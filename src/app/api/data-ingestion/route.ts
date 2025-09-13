
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { getContactDetails, getLeadDetails } from '@/lib/kommo';
import type { OrderItem, Shop } from '@/lib/types';

const db = getAdminDb();

/**
 * Normalizes a phone number by removing country codes for Peru (+51 or 51).
 * @param phone The raw phone number string.
 * @returns The cleaned 9-digit phone number, or an empty string if input is invalid.
 */
function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return '';
    // Remove all non-digit characters except for a leading '+'
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+51')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('51')) {
      cleaned = cleaned.substring(2);
    }
    return cleaned.trim();
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

  let data: Record<string, any>;
  let sourceType: 'shopify' | 'kommo' | 'unknown' = 'unknown';
  const contentType = request.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
        data = await request.json();
        console.info("Received JSON data, likely from Shopify.");
        // Simple check to confirm if it's a Shopify payload
        if (data.id && data.line_items) {
           sourceType = 'shopify'; 
        }
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
             if (data.id && data.line_items) {
               sourceType = 'shopify';
            }
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
        console.info("--- RAW SHOPIFY PAYLOAD RECEIVED ---");
        console.info(JSON.stringify(data, null, 2));

        // Prioritize shipping_address as it's the most relevant for logistics
        const shippingAddress = data.shipping_address || {};
        const customer = data.customer || {};

        // Extract DNI from a conventional field (like 'company') or leave empty
        const dni = shippingAddress.company || '';

        const shopifyItems: OrderItem[] = data.line_items.map((item: any) => ({
          sku: item.sku || 'N/A',
          nombre: item.title,
          variante: item.variant_title || '',
          cantidad: item.quantity,
          precio_unitario: parseFloat(item.price),
          subtotal: parseFloat(item.price) * item.quantity,
          estado_item: 'PENDIENTE' as const,
        }));

        const clientData = {
            // Take DNI specifically from shipping_address.company
            dni: dni,
            // Prioritize shipping name, fallback to customer name
            nombres: shippingAddress.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
            // Prioritize shipping phone, fallback to order phone, then customer phone
            celular: formatPhoneNumber(shippingAddress.phone || data.phone || customer.phone),
            // Email is usually reliable on the main object
            email: data.email || customer.email || '',
            // Address details from shipping_address
            direccion: shippingAddress.address1 || '',
            distrito: shippingAddress.city || '',
            provincia: shippingAddress.province || 'Lima', // Default to Lima if not provided
            // System fields
            estado_llamada: 'NUEVO' as const,
            source: 'shopify' as const,
            shopify_order_id: String(data.id),
            last_updated_from_kommo: new Date().toISOString(),
            shopify_items: shopifyItems,
            // Per user request, Shopify orders are currently from "Dearel"
            tienda_origen: 'Dearel' as Shop,
        };

        const docRef = db.collection('clients').doc();
        await docRef.set(clientData);
        
        console.log(`Successfully processed Shopify order and saved client with Firestore-generated ID: ${docRef.id}`);
        return NextResponse.json({ success: true, message: 'Shopify order processed.', id: docRef.id });

    } else if (sourceType === 'kommo') {
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
          source: 'kommo' as const,
          kommo_lead_id: leadId,
          kommo_contact_id: contactId,
          last_updated_from_kommo: new Date().toISOString(),
        };

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
