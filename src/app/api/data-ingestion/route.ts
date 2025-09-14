
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { getContactDetails, getLeadDetails } from '@/lib/kommo';
import type { OrderItem, Client, Shop } from '@/lib/types';


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
    console.info("--- Processing Shopify Payload for Call Center Queue ---");
    const db = getAdminDb();

    const shippingAddress = data.shipping_address || {};
    const customer = data.customer || {};
    
    // Use a temporary DNI if not available, can be confirmed by agent
    const dni = String(shippingAddress.company || `temp-shopify-${data.id}`).trim();
    
    let clientName = shippingAddress.name || '';
    if (!clientName && (customer.first_name || customer.last_name)) {
        clientName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }

    const shopifyItems: OrderItem[] = data.line_items.map((item: any) => ({
      sku: item.sku || 'N/A',
      nombre: item.title || 'Producto sin nombre',
      variante: item.variant_title || '',
      cantidad: item.quantity,
      precio_unitario: parseFloat(item.price),
      subtotal: parseFloat(item.price) * item.quantity,
      estado_item: 'PENDIENTE' as const,
    }));
    
    const shopifyPaymentDetails = {
        total_price: parseFloat(data.total_price),
        subtotal_price: parseFloat(data.subtotal_price),
        total_shipping: parseFloat(data.total_shipping_price_set?.shop_money?.amount || '0'),
        payment_gateway: data.payment_gateway_names?.[0] || 'Desconocido',
    };

    const newClientLead: Omit<Client, 'id'> = {
        dni,
        nombres: clientName,
        celular: formatPhoneNumber(shippingAddress.phone || data.phone || customer.phone),
        email: customer.email || data.email || '',
        direccion: shippingAddress.address1 || '',
        distrito: shippingAddress.city || '',
        provincia: shippingAddress.province || 'Lima',
        source: 'shopify',
        last_updated: new Date().toISOString(),
        call_status: 'NUEVO', // New leads from Shopify start here
        first_interaction_at: new Date().toISOString(),
        tienda_origen: 'Dearel' as Shop, // Can be improved later
        shopify_order_id: String(data.id),
        shopify_items: shopifyItems,
        shopify_payment_details: shopifyPaymentDetails,
    };

    const clientsRef = db.collection('clients');
    const newClientRef = await clientsRef.add(newClientLead);

    console.log(`Successfully created new lead from Shopify in call center queue. Client ID: ${newClientRef.id}`);

    return NextResponse.json({ success: true, message: 'Shopify lead created in call center queue.', clientId: newClientRef.id });
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
