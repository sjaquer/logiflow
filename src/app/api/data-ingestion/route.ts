
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { getContactDetails, getLeadDetails } from '@/lib/kommo';
import type { OrderItem, Client, Order } from '@/lib/types';


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
    console.info("--- Processing Shopify Payload to create separate Order and Client ---");
    const db = getAdminDb();

    // 1. Process and find/create client
    const shippingAddress = data.shipping_address || {};
    const customer = data.customer || {};
    const dni = String(shippingAddress.company || `temp-shopify-${data.id}`).trim();
    
    let clientName = shippingAddress.name || '';
    if (!clientName && (customer.first_name || customer.last_name)) {
        clientName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }

    const clientsRef = db.collection('clients');
    const q = clientsRef.where("dni", "==", dni);
    const querySnapshot = await q.get();

    let clientId: string;
    let clientDataForOrder: { id_cliente: string, nombres: string, dni: string, celular: string, email?: string };

    if (!querySnapshot.empty) {
        const existingClientDoc = querySnapshot.docs[0];
        clientId = existingClientDoc.id;
        const existingClientData = existingClientDoc.data() as Client;
        
        // Update client with potentially new data from Shopify
        await existingClientDoc.ref.update({
            nombres: clientName,
            celular: formatPhoneNumber(shippingAddress.phone || data.phone || customer.phone),
            email: customer.email || data.email || '',
            direccion: shippingAddress.address1 || '',
            distrito: shippingAddress.city || '',
            provincia: shippingAddress.province || 'Lima',
            last_updated: new Date().toISOString(),
        });

        clientDataForOrder = {
            id_cliente: clientId,
            nombres: clientName,
            dni: dni,
            celular: formatPhoneNumber(shippingAddress.phone || data.phone || customer.phone),
            email: customer.email || data.email || ''
        };
        console.log(`Found and updated existing client. Client ID: ${clientId}`);

    } else {
        const newClientPayload: Omit<Client, 'id'> = {
            dni,
            nombres: clientName,
            celular: formatPhoneNumber(shippingAddress.phone || data.phone || customer.phone),
            email: customer.email || data.email || '',
            direccion: shippingAddress.address1 || '',
            distrito: shippingAddress.city || '',
            provincia: shippingAddress.province || 'Lima',
            source: 'shopify',
            last_updated: new Date().toISOString(),
            call_status: 'VENTA_CONFIRMADA', // Client is confirmed by default from a sale
            first_interaction_at: new Date().toISOString(),
        };
        const newClientRef = await clientsRef.add(newClientPayload);
        clientId = newClientRef.id;

        clientDataForOrder = {
            id_cliente: clientId,
            nombres: newClientPayload.nombres,
            dni: newClientPayload.dni,
            celular: newClientPayload.celular,
            email: newClientPayload.email
        };
        console.log(`Created new client from Shopify order. Client ID: ${clientId}`);
    }

    // 2. Create the Order document
    const shopifyItems: OrderItem[] = data.line_items.map((item: any) => ({
      sku: item.sku || 'N/A',
      nombre: item.title || 'Producto sin nombre',
      variante: item.variant_title || '',
      cantidad: item.quantity,
      precio_unitario: parseFloat(item.price),
      subtotal: parseFloat(item.price) * item.quantity,
      estado_item: 'PENDIENTE' as const,
    }));

    const orderId = `SHOPIFY-${data.order_number}`;
    const orderRef = db.collection('orders').doc(orderId);

    const newOrderPayload: Omit<Order, 'id_pedido'> = {
        id_interno: `Shopify #${data.order_number}`,
        tienda: { id_tienda: 'Dearel', nombre: 'Dearel' }, // Assuming default shop, can be improved
        estado_actual: 'PENDIENTE',
        cliente: clientDataForOrder,
        items: shopifyItems,
        pago: {
            monto_total: parseFloat(data.total_price),
            monto_pendiente: data.financial_status === 'paid' ? 0 : parseFloat(data.total_outstanding),
            metodo_pago_previsto: data.payment_gateway_names?.[0] || 'Desconocido',
            estado_pago: data.financial_status === 'paid' ? 'PAGADO' : 'PENDIENTE',
            comprobante_url: null,
            fecha_pago: data.processed_at,
        },
        envio: {
            tipo: (shippingAddress.province || 'LIMA').toUpperCase() === 'LIMA' ? 'LIMA' : 'PROVINCIA',
            provincia: shippingAddress.province || 'Lima',
            distrito: shippingAddress.city || '',
            direccion: shippingAddress.address1 || '',
            courier: 'URBANO', // Default courier
            agencia_shalom: null,
            nro_guia: null,
            link_seguimiento: null,
            costo_envio: parseFloat(data.total_shipping_price_set?.shop_money?.amount || '0'),
        },
        asignacion: { // Default assignment, can be changed later in the UI
            id_usuario_actual: 'SYSTEM',
            nombre_usuario_actual: 'Sistema (Shopify)',
        },
        historial: [{
            fecha: new Date().toISOString(),
            id_usuario: 'SYSTEM',
            nombre_usuario: 'Sistema (Shopify)',
            accion: 'Creación de Pedido',
            detalle: 'Pedido creado automáticamente desde Shopify.'
        }],
        fechas_clave: {
            creacion: data.created_at,
            confirmacion_llamada: null,
            procesamiento_iniciado: null,
            preparacion: null,
            despacho: null,
            entrega_estimada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days estimate
            entrega_real: null,
            anulacion: data.cancelled_at,
        },
        notas: {
            nota_pedido: data.note || '',
            observaciones_internas: '',
            motivo_anulacion: data.cancel_reason,
        },
        source: 'shopify',
        shopify_order_id: String(data.id),
    };

    await orderRef.set({ ...newOrderPayload, id_pedido: orderId });
    console.log(`Successfully created new order. Order ID: ${orderId}`);

    return NextResponse.json({ success: true, message: 'Shopify order processed into a separate client and order.', clientId: clientId, orderId: orderId });
}


async function handleKommoWebhook(data: Record<string, any>) {
    const db = getAdminDb(); // Initialize DB inside the handler
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
        switch (field.field_code) {
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
    
    const clientsRef = db.collection('clients');
    const q = clientsRef.where("dni", "==", clientDNI);
    const querySnapshot = await q.get();

    const clientDataPayload: Partial<Client> = {
      dni: clientDNI,
      nombres: contactDetails.name || '',
      celular: formatPhoneNumber(clientPhone),
      email: clientEmail || '',
      direccion: clientAddress || '',
      distrito: clientDistrict || '',
      provincia: 'Lima',
      source: 'kommo',
      last_updated: new Date().toISOString(),
      first_interaction_at: new Date().toISOString(),
      call_status: 'NUEVO',
      kommo_lead_id: leadId,
      kommo_contact_id: contactId,
    };
    
    let clientId: string;
    if(!querySnapshot.empty) {
        const existingClientDoc = querySnapshot.docs[0];
        await existingClientDoc.ref.update(clientDataPayload as { [x: string]: any });
        clientId = existingClientDoc.id;
        console.log(`Successfully updated existing client from Kommo lead. Client ID: ${clientId}`);
    } else {
        const newClientRef = await clientsRef.add(clientDataPayload);
        clientId = newClientRef.id;
        console.log(`Successfully created new client from Kommo lead. Client ID: ${clientId}`);
    }

    return NextResponse.json({ success: true, message: 'Kommo lead processed into a client document.', id: clientId });
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
        
        if (payload.id && payload.line_items && payload.order_number) {
            return await handleShopifyWebhook(payload);
        } else if (payload['leads[status][0][id]']) {
            return await handleKommoWebhook(payload);
        } else {
            console.log("Webhook received, but it's not a recognized Shopify or Kommo format. Ignoring.", payload);
            return NextResponse.json({ success: true, message: "Payload not recognized, ignored." });
        }
    } catch (error) {
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
