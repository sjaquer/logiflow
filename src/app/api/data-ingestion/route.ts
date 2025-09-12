
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { getContactDetails, getLeadDetails } from '@/lib/kommo';
import type { OrderItem, Shop } from '@/lib/types';

const db = getAdminDb();

function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return '';
    // Remove non-numeric characters, except for a leading '+'
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle common Peruvian formats
    if (cleaned.startsWith('+51') && cleaned.length > 3) {
      cleaned = '+51 ' + cleaned.substring(3);
    } else if (cleaned.startsWith('51') && cleaned.length > 2 && phone.length > 9) { // Avoid '51' being part of a normal number
      cleaned = '+51 ' + cleaned.substring(2);
    }
    
    return cleaned;
}

/**
 * API Endpoint to receive webhook data from various sources like Kommo or Shopify.
 * It intelligently handles different content types (JSON or form-data).
 */
export async function POST(request: Request) {
  // 1. Validate incoming request security
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

  let data: Record<string, any>;
  let sourceType: 'shopify' | 'kommo' | 'unknown' = 'unknown';
  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
        data = await request.json();
        console.info("Received JSON data, likely from Shopify.");
        sourceType = 'shopify'; 
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
        console.info("Received form-data, likely from Kommo.");
        if (data['leads[status][0][id]']) {
          sourceType = 'kommo';
        }
    } else {
        const rawBody = await request.text();
        console.warn(`Unexpected content-type: ${contentType}. Trying to parse as JSON.`);
        try {
            data = JSON.parse(rawBody);
            sourceType = 'shopify';
        } catch {
            console.error("Could not parse raw body as JSON. Body might be in another format.");
            return NextResponse.json({ message: 'Invalid or unsupported content type.' }, { status: 400 });
        }
    }
  } catch (error: any) {
    console.error("Failed to parse incoming webhook body:", error.message);
    return NextResponse.json({ message: 'Invalid webhook payload format.', error: error.message }, { status: 400 });
  }

  try {
    if (sourceType === 'shopify' && data.id) {
        // --- SHOPIFY ORDER CREATION LOGIC ---
        console.info("Processing Shopify order...");

        const shippingAddress = data.shipping_address || {};
        const customer = data.customer || {};

        // DNI field will be left blank to be filled by the Call Center agent.
        const clientDNI = '';

        // Extract items from the order
        const shopifyItems: Omit<OrderItem, 'estado_item'>[] = data.line_items.map((item: any) => ({
          sku: item.sku || 'N/A',
          nombre: item.title,
          variante: item.variant_title || '',
          cantidad: item.quantity,
          precio_unitario: parseFloat(item.price),
          subtotal: parseFloat(item.price) * item.quantity,
        }));

        const clientData = {
            dni: clientDNI,
            nombres: shippingAddress.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
            celular: formatPhoneNumber(shippingAddress.phone || data.phone || customer.phone),
            email: data.email || customer.email || '',
            direccion: shippingAddress.address1 || '',
            distrito: shippingAddress.city || '',
            provincia: shippingAddress.province || '',
            estado_llamada: 'NUEVO' as const,
            source: 'shopify',
            shopify_order_id: data.id,
            last_updated_from_kommo: new Date().toISOString(), // Use a generic timestamp
            shopify_items: shopifyItems,
            // Shopify doesn't have a clear shop name field in the order payload. 
            // We can assign a default or have a mapping based on another field if available.
            tienda_origen: 'Trazto' as Shop, 
        };

        // We use addDoc to get an auto-generated ID, which is more robust
        const docRef = await db.collection('clients').add(clientData);
        
        console.log(`Successfully processed Shopify order and saved client with ID: ${docRef.id}`);
        return NextResponse.json({ success: true, message: 'Shopify order processed.', id: docRef.id });

    } else if (sourceType === 'kommo') {
        // --- KOMMO LEAD UPDATE LOGIC ---
        const leadId = data['leads[status][0][id]'] as string;
        console.log(`Processing Kommo Lead ID: ${leadId}`);

        const leadDetails = await getLeadDetails(leadId);
        if (!leadDetails) {
            console.error(`Could not fetch details for lead ID: ${leadId}`);
            return NextResponse.json({ success: false, message: "Failed to fetch lead details." }, { status: 500 });
        }

        const contactId = leadDetails._embedded?.contacts?.[0]?.id;
        if (!contactId) {
            console.error(`Lead ${leadId} has no associated contact. Cannot proceed.`);
            return NextResponse.json({ success: false, message: "Lead has no associated contact." });
        }
        
        const contactDetails = await getContactDetails(contactId);
        if (!contactDetails) {
          console.error(`Could not fetch details for contact ID: ${contactId}`);
          return NextResponse.json({ success: false, message: "Failed to fetch contact details." }, { status: 500 });
        }

        const clientName = contactDetails.name;
        let clientDNI: string | null = null, clientPhone: string | null = null, clientEmail: string | null = null, clientAddress: string | null = null, clientDistrict: string | null = null;
        
        if (contactDetails.custom_fields_values) {
          for (const field of contactDetails.custom_fields_values) {
            const value = field.values[0]?.value;
            switch (field.field_name.toLowerCase()) {
              case 'dni': clientDNI = value; break;
              case 'phone': clientPhone = value; break;
              case 'email': clientEmail = value; break;
              case 'direccion': clientAddress = value; break;
              case 'distrito': clientDistrict = value; break;
            }
          }
        }
        
        // For Kommo, DNI is expected.
        if (!clientDNI) {
          console.warn("Kommo webhook processing stopped: DNI not found in contact's custom fields.");
          return NextResponse.json({ success: false, message: 'DNI not found in custom fields.' }, { status: 400 });
        }
        
        const clientData = {
          dni: clientDNI,
          nombres: clientName || '',
          celular: formatPhoneNumber(clientPhone),
          email: clientEmail || '',
          direccion: clientAddress || '',
          distrito: clientDistrict || '',
          provincia: 'Lima',
          estado_llamada: 'NUEVO' as const,
          source: 'kommo',
          kommo_lead_id: leadId,
          kommo_contact_id: contactId,
          last_updated_from_kommo: new Date().toISOString(),
        };

        // For Kommo, we use DNI as the document ID to upsert data
        const docRef = db.collection('clients').doc(clientDNI);
        await docRef.set(clientData, { merge: true });
        
        console.log(`Successfully processed Kommo lead and saved client: ${clientDNI}`);
        return NextResponse.json({ success: true, message: 'Kommo lead processed.', id: docRef.id });

    } else {
        console.log("Webhook received, but it's not a recognized Shopify or Kommo format. Ignoring.");
        return NextResponse.json({ success: true, message: "Payload not recognized, ignored." });
    }

  } catch (error) {
    console.error(`Error processing webhook logic:`, error);
    return NextResponse.json({ message: 'Internal server error while processing webhook logic.' }, { status: 500 });
  }
}
