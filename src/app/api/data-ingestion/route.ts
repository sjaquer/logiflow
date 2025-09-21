
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
    
    const shopifyOrderId = String(data.id);
    if (!shopifyOrderId) {
        console.error("Shopify webhook processing stopped: Order ID is missing from payload.");
        return NextResponse.json({ success: false, message: 'Shopify Order ID is missing.' }, { status: 400 });
    }

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

    // This is a temporary lead, not a permanent client.
    const newShopifyLead = {
        nombres: clientName,
        celular: formatPhoneNumber(shippingAddress.phone || data.phone || customer.phone),
        email: customer.email || data.email || '',
        direccion: shippingAddress.address1 || '',
        distrito: shippingAddress.city || '',
        provincia: shippingAddress.province || 'Lima',
        source: 'shopify' as const,
        last_updated: new Date().toISOString(),
        call_status: 'NUEVO' as const, 
        first_interaction_at: new Date().toISOString(),
        tienda_origen: 'Dearel' as Shop,
        shopify_order_id: shopifyOrderId,
        shopify_items: shopifyItems,
        shopify_payment_details: shopifyPaymentDetails,
    };
    
    // Use the shopify_order_id as the document ID in a separate collection for leads.
    const leadRef = db.collection('shopify_leads').doc(shopifyOrderId);
    await leadRef.set(newShopifyLead);

    console.log(`Successfully created Shopify lead. Document ID in shopify_leads: ${leadRef.id}`);

    return NextResponse.json({ success: true, message: 'Shopify lead processed for call center queue.', leadId: leadRef.id });
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


// This function attempts to parse the body as JSON. If it fails, it returns null.
async function tryParseJson(request: Request) {
    try {
        return await request.json();
    } catch (e) {
        return null;
    }
}

// This function attempts to parse the body as form data. If it fails, it returns null.
async function tryParseFormData(request: Request) {
    try {
        const formData = await request.formData();
        return Object.fromEntries(formData.entries());
    } catch (e) {
        return null;
    }
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

    const contentType = request.headers.get('content-type') || '';
    let payload: any;

    if (contentType.includes('application/json')) {
        payload = await tryParseJson(request);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
        payload = await tryParseFormData(request.clone()); // Clone because formData consumes the body
    } else {
        // Fallback for unknown content types: try both, JSON first.
        payload = await tryParseJson(request.clone());
        if (!payload) {
            payload = await tryParseFormData(request.clone());
        }
    }

    if (!payload) {
        return NextResponse.json({ success: false, message: "Could not parse request body." }, { status: 400 });
    }

    try {
        // Shopify payload check (always JSON)
        if (payload.id && payload.line_items && payload.order_number) {
            return await handleShopifyWebhook(payload);
        }
        // Kommo payload check (can be form-data or JSON)
        else if (payload['leads[status][0][id]']) {
            return await handleKommoWebhook(payload);
        } else {
            console.log("Webhook received, but it's not a recognized Shopify or Kommo format. Ignoring.", payload);
            return NextResponse.json({ success: true, message: "Payload not recognized, ignored." });
        }
    } catch (error) {
        console.error(`Error processing webhook:`, error);
        return NextResponse.json({ message: 'Internal server error while processing webhook logic.', error: (error as Error).message }, { status: 500 });
    }
}
