
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
    const db = getAdminDb();
    
    // Recognize multiple Kommo webhook formats
    const leadId = data['leads[status][0][id]'] 
               || data['unsorted[update][0][data][leads][id]'] 
               || data['leads[update][0][id]'];
    
    if (!leadId) {
        console.log("Kommo webhook does not contain a recognized lead ID. Ignoring.", data);
        return NextResponse.json({ success: false, message: 'Kommo Lead ID not found in payload.' }, { status: 400 });
    }

    console.log(`Processing Kommo Lead ID: ${leadId}`);

    // --- Data Extraction from Webhook Payload ---
    const customFields = data[`leads[update][0][custom_fields]`] || [];
    const fieldsMap: Record<string, string> = {};

    for (const key in customFields) {
        if (customFields.hasOwnProperty(key)) {
            const field = customFields[key];
            if (field.name && field.values && field.values[0]) {
                fieldsMap[field.name.toUpperCase()] = field.values[0].value;
            }
        }
    }
    
    // Attempt to get contact details via API if not in payload
    let contactDetails: any = {};
    const leadDetails = await getLeadDetails(leadId);
    const contactId = leadDetails?._embedded?.contacts?.[0]?.id;
    if (contactId) {
        contactDetails = await getContactDetails(contactId) || {};
    }

    const clientName = fieldsMap['NOMBRE'] || contactDetails.name || leadDetails.name || 'Lead sin nombre';
    const clientPhone = formatPhoneNumber(contactDetails?.custom_fields_values?.find((f: any) => f.field_code === 'PHONE')?.values[0]?.value);
    const clientEmail = contactDetails?.custom_fields_values?.find((f: any) => f.field_code === 'EMAIL')?.values[0]?.value;


    const clientsRef = db.collection('clients');
    // Use kommo_lead_id as the unique identifier for syncing
    const q = clientsRef.where("kommo_lead_id", "==", leadId);
    const querySnapshot = await q.get();

    const clientDataPayload: Partial<Client> = {
      // DNI needs to be a custom field in Kommo and mapped here
      dni: fieldsMap['DNI'] || '',
      nombres: clientName,
      celular: clientPhone,
      email: clientEmail || '',
      direccion: fieldsMap['DIRECCION'] || '',
      distrito: fieldsMap['DISTRITO'] || '',
      provincia: fieldsMap['PROVINCIA'] || 'Lima',
      source: 'kommo',
      last_updated: new Date().toISOString(),
      kommo_lead_id: leadId,
      kommo_contact_id: contactId,
      etapa_kommo: leadDetails?.status?.name || 'No disponible',
      tienda_origen: fieldsMap['TIENDA'] as Shop || undefined,
      producto: fieldsMap['PRODUCTO'] || undefined,
    };
    
    let clientId: string;
    if(!querySnapshot.empty) {
        const existingClientDoc = querySnapshot.docs[0];
        await existingClientDoc.ref.update(clientDataPayload as { [x: string]: any });
        clientId = existingClientDoc.id;
        console.log(`Successfully updated existing client from Kommo lead. Client ID: ${clientId}`);
    } else {
        const newClientPayload = {
            ...clientDataPayload,
            call_status: 'NUEVO',
            first_interaction_at: new Date().toISOString(),
        };
        const newClientRef = await clientsRef.add(newClientPayload);
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

    // Kommo can send data as 'application/x-www-form-urlencoded', so we must handle it.
    if (contentType.includes('application/json')) {
        payload = await tryParseJson(request);
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        payload = await tryParseFormData(request.clone()); // Clone because formData consumes the body
    } else {
        // Fallback for unknown content types: try both.
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
        // Kommo payload checks (status change OR unsorted lead OR update)
        else if (payload['leads[status][0][id]'] || payload['unsorted[update][0][uid]'] || payload['leads[update][0][id]']) {
            return await handleKommoWebhook(payload);
        } else {
            console.log("Webhook received, but it's not a recognized Shopify or Kommo format. Ignoring.", payload);
            return NextResponse.json({ success: true, message: "Payload not recognized, ignored." });
        }
    } catch (error) {
        console.error(`Error processing webhook:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message: 'Internal server error while processing webhook logic.', error: errorMessage }, { status: 500 });
    }
}
