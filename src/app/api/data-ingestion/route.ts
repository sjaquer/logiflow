
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { getContactDetails, getLeadDetails } from '@/lib/kommo';

const db = getAdminDb();

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

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await request.json();
        console.log("Received JSON data, likely from Shopify.");
        sourceType = 'shopify'; // Assume JSON is from Shopify for now
    } else {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
        console.log("Received form-data, likely from Kommo.");
        // Check for Kommo-specific fields to confirm source
        if (data['leads[status][0][id]']) {
          sourceType = 'kommo';
        }
    }
  } catch (error) {
    console.error("Failed to parse incoming webhook body:", error);
    return NextResponse.json({ message: 'Invalid webhook payload format.' }, { status: 400 });
  }

  try {
    if (sourceType === 'shopify' && data.id) {
        // --- SHOPIFY ORDER CREATION LOGIC ---
        console.log(`Processing Shopify Order ID: ${data.id}`);

        const customer = data.customer;
        const address = data.shipping_address || customer?.default_address;

        if (!address || !customer) {
            console.warn(`Shopify Order ${data.id} is missing customer or shipping address.`);
            return NextResponse.json({ success: false, message: 'Missing customer or address info.' }, { status: 400 });
        }
        
        // Shopify often doesn't have a dedicated DNI field. A common practice is to use address2.
        // Fallback to a placeholder if not found, so the agent can fill it in.
        const clientDNI = address.address2 || `NE-${Date.now()}`; 
        
        const clientData = {
            dni: clientDNI,
            nombres: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
            celular: address.phone || customer.phone || '',
            email: customer.email || '',
            direccion: address.address1 || '',
            distrito: address.city || '',
            provincia: address.province || 'Lima',
            estado_llamada: 'NUEVO',
            shopify_order_id: data.id,
            last_updated_from_kommo: new Date().toISOString(), // Generic timestamp
        };

        const docRef = db.collection('clients').doc(clientData.dni);
        await docRef.set(clientData, { merge: true });
        
        console.log(`Successfully processed Shopify order and saved client: ${clientData.dni}`);
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
        
        if (!clientDNI) {
          console.warn("Kommo webhook processing stopped: DNI not found in contact's custom fields.");
          return NextResponse.json({ success: false, message: 'DNI not found in custom fields.' }, { status: 400 });
        }
        
        const clientData = {
          dni: clientDNI,
          nombres: clientName || '',
          celular: clientPhone || '',
          email: clientEmail || '',
          direccion: clientAddress || '',
          distrito: clientDistrict || '',
          provincia: 'Lima',
          estado_llamada: 'NUEVO',
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
