import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { getContactDetails, getLeadDetails } from '@/lib/kommo';
import type { OrderItem, Shop, Client, Order } from '@/lib/types';

const db = getAdminDb();

function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+51')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('51')) {
      cleaned = cleaned.substring(2);
    }
    return cleaned.trim();
}

async function handleShopifyWebhook(data: Record<string, any>) {
    console.info("--- Processing Shopify Payload ---");

    const shippingAddress = data.shipping_address || {};
    const customer = data.customer || {};

    // Prioritize DNI from 'company' field, a common practice in Peru for Shopify.
    const dni = shippingAddress.company || '';

    let clientName = shippingAddress.name || '';
    if (!clientName && (customer.first_name || customer.last_name)) {
        clientName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }
    
    if (!dni) {
        console.warn(`Webhook from Shopify for order ${data.id} is missing DNI (company field). Client cannot be created reliably. Skipping.`);
        return NextResponse.json({ success: false, message: 'Client DNI not found in shipping_address.company. Cannot process order.' }, { status: 400 });
    }

    const clientRef = db.collection('clients').doc(dni);
    const clientData: Partial<Client> = {
        dni: dni,
        nombres: clientName,
        celular: formatPhoneNumber(shippingAddress.phone || data.phone || customer.phone),
        email: data.email || customer.email || '',
        direccion: shippingAddress.address1 || '',
        distrito: shippingAddress.city || '',
        provincia: shippingAddress.province || 'Lima',
        source: 'shopify',
        last_updated: new Date().toISOString(),
    };
    
    // Create or update the client record.
    await clientRef.set(clientData, { merge: true });
    console.log(`Client record for DNI ${dni} created/updated successfully.`);

    // Now, create the ORDER document
    const orderRef = db.collection('orders').doc(); // Firestore will generate the ID

    const shopifyItems: OrderItem[] = data.line_items.map((item: any) => ({
      sku: item.sku || 'N/A',
      nombre: item.title,
      variante: item.variant_title || '',
      cantidad: item.quantity,
      precio_unitario: parseFloat(item.price),
      subtotal: parseFloat(item.price) * item.quantity,
      estado_item: 'PENDIENTE' as const,
    }));

    const newOrder: Omit<Order, 'id_pedido' | 'asignacion' | 'historial'> = {
        id_interno: `SHOPIFY-${data.order_number}`,
        tienda: { id_tienda: 'Dearel', nombre: 'Dearel' as Shop }, // Hardcoded as per request
        estado_actual: 'PENDIENTE',
        cliente: {
            id_cliente: dni, // Link to the client document
            dni: dni,
            nombres: clientName,
            celular: clientData.celular!,
        },
        items: shopifyItems,
        pago: {
            monto_total: parseFloat(data.total_price),
            monto_pendiente: parseFloat(data.total_outstanding),
            metodo_pago_previsto: data.payment_gateway_names?.[0] || 'Desconocido',
            estado_pago: 'PENDIENTE',
            comprobante_url: null,
            fecha_pago: null,
        },
        envio: {
            tipo: (shippingAddress.province || 'Lima').toLowerCase() === 'lima' ? 'LIMA' : 'PROVINCIA',
            provincia: shippingAddress.province || 'Lima',
            distrito: shippingAddress.city || '',
            direccion: shippingAddress.address1 || '',
            courier: 'URBANO', // Default, can be changed later
            agencia_shalom: null,
            nro_guia: null,
            link_seguimiento: null,
            costo_envio: parseFloat(data.total_shipping_price_set?.shop_money?.amount || '0'),
        },
        fechas_clave: {
            creacion: data.created_at || new Date().toISOString(),
            confirmacion_llamada: null,
            procesamiento_iniciado: null,
            preparacion: null,
            despacho: null,
            entrega_estimada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            entrega_real: null,
            anulacion: null,
        },
        notas: {
            nota_pedido: data.note || '',
            observaciones_internas: '',
            motivo_anulacion: null,
        },
        source: 'shopify',
        shopify_order_id: String(data.id),
    };

    await orderRef.set({
        ...newOrder,
        id_pedido: orderRef.id,
    });

    console.log(`Successfully created new order ${orderRef.id} from Shopify, linked to client ${dni}.`);
    return NextResponse.json({ success: true, message: 'Shopify order processed into a new order document.', orderId: orderRef.id, clientId: dni });
}

async function handleKommoWebhook(data: Record<string, any>) {
    const leadId = data['leads[status][0][id]'] as string;
    console.log(`Processing Kommo Lead ID: ${leadId}`);

    const leadDetails = await getLeadDetails(leadId);
    if (!leadDetails) {
        throw new Error(`Could not fetch details for lead ID: ${leadId}`);
    }

    const contactId = leadDetails._embedded?.contacts?.[0]?.id;
    if (!contactId) {
        throw new Error(`Lead ${leadId} has no associated contact.`);
    }
    
    const contactDetails = await getContactDetails(contactId);
    if (!contactDetails) {
      throw new Error(`Could not fetch details for contact ID: ${contactId}`);
    }

    let clientDNI: string | null = null, clientPhone: string | null = null, clientEmail: string | null = null, clientAddress: string | null = null, clientDistrict: string | null = null;
    
    if (contactDetails.custom_fields_values) {
      for (const field of contactDetails.custom_fields_values) {
        const value = field.values[0]?.value;
        switch (field.field_code) { // Using field_code is more reliable than field_name
          case 'DNI': clientDNI = value; break;
          case 'PHONE': clientPhone = value; break;
          case 'EMAIL': clientEmail = value; break;
          case 'ADDRESS': clientAddress = value; break;
          case 'DISTRICT': clientDistrict = value; break;
        }
      }
    }
    
    if (!clientDNI) {
      console.warn("Kommo webhook processing stopped: DNI not found in contact's custom fields.");
      return NextResponse.json({ success: false, message: 'DNI not found in custom fields.' }, { status: 400 });
    }
    
    const clientData: Client = {
      id: clientDNI,
      dni: clientDNI,
      nombres: contactDetails.name || '',
      celular: formatPhoneNumber(clientPhone),
      email: clientEmail || '',
      direccion: clientAddress || '',
      distrito: clientDistrict || '',
      provincia: 'Lima',
      source: 'kommo',
      last_updated: new Date().toISOString(),
      call_status: 'NUEVO',
      kommo_lead_id: leadId,
      kommo_contact_id: contactId,
    };

    const docRef = db.collection('clients').doc(clientDNI);
    await docRef.set(clientData, { merge: true });
    
    console.log(`Successfully processed Kommo lead and created/updated client: ${clientDNI}`);
    return NextResponse.json({ success: true, message: 'Kommo lead processed into a client document.', id: docRef.id });
}

export async function POST(request: Request) {
    const serverApiKey = process.env.MAKE_API_KEY;
    if (!serverApiKey) {
      console.error("MAKE_API_KEY is not configured in environment variables.");
      return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    const apiKeyFromUrl = new URL(request.url).searchParams.get('apiKey');
    if (apiKeyFromUrl !== serverApiKey) {
      console.warn("Unauthorized webhook attempt. Ignoring.");
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payload = await request.json();
        
        // Determine source based on payload structure
        if (payload.id && payload.line_items && payload.order_number) {
            return await handleShopifyWebhook(payload);
        } else if (payload['leads[status][0][id]']) {
            return await handleKommoWebhook(payload);
        } else {
            console.log("Webhook received, but it's not a recognized Shopify or Kommo format. Ignoring.", payload);
            return NextResponse.json({ success: true, message: "Payload not recognized, ignored." });
        }
    } catch (error) {
        // Fallback for form-data from Kommo if JSON parsing fails
        try {
            const formData = await request.formData();
            const data = Object.fromEntries(formData.entries());
             if (data['leads[status][0][id]']) {
                return await handleKommoWebhook(data);
            }
             console.log("Webhook received (form-data), but not a recognized format. Ignoring.", data);
             return NextResponse.json({ success: true, message: "Payload not recognized, ignored." });
        } catch (formError) {
             console.error(`Error processing webhook:`, error);
             return NextResponse.json({ message: 'Internal server error while processing webhook logic.', error: (error as Error).message }, { status: 500 });
        }
    }
}
