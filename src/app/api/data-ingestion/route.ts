
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { getContactDetails, getLeadDetails } from '@/lib/kommo';

const db = getAdminDb();

/**
 * API Endpoint to receive webhook data from various sources like Kommo or Shopify.
 * It intelligently handles different content types (JSON or form-data).
 * The primary logic is geared towards processing Kommo leads for now.
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
  try {
    // Try to parse as JSON first (common for modern webhooks like Shopify)
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await request.json();
        console.log("Received JSON data:", data);
    } else {
        // Fallback to formData (for services like Kommo)
        const body = await request.formData();
        data = Object.fromEntries(body.entries());
        console.log("Received form-data:", data);
    }
  } catch (error) {
    console.error("Failed to parse incoming webhook body:", error);
    return NextResponse.json({ message: 'Invalid webhook payload format.' }, { status: 400 });
  }

  try {
    // For now, the logic is specific to Kommo's "lead status changed" webhook.
    // We will expand this later to differentiate between Shopify and Kommo payloads.
    
    // 2. Extract Lead ID from the webhook payload (Kommo format)
    const leadId = data['leads[status][0][id]'] as string;
    if (!leadId) {
        console.log("Webhook payload did not contain a Kommo lead ID. Ignoring for now.");
        // We'll add Shopify logic here later.
        return NextResponse.json({ success: true, message: "Payload is not a Kommo lead update, ignored." });
    }
    
    // 3. Fetch Lead Details from Kommo API to get the Contact ID
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
    
    // 4. Fetch Contact Details from Kommo API
    const contactDetails = await getContactDetails(contactId);
    if (!contactDetails) {
      console.error(`Could not fetch details for contact ID: ${contactId}`);
      return NextResponse.json({ success: false, message: "Failed to fetch contact details." }, { status: 500 });
    }

    // 5. Extract and clean the data
    const clientName = contactDetails.name;
    let clientDNI: string | null = null;
    let clientPhone: string | null = null;
    let clientEmail: string | null = null;
    let clientAddress: string | null = null;
    let clientDistrict: string | null = null;
    
    if (contactDetails.custom_fields_values) {
      for (const field of contactDetails.custom_fields_values) {
        const value = field.values[0]?.value;
        switch (field.field_name.toLowerCase()) {
          case 'dni':
            clientDNI = value;
            break;
          case 'phone':
            clientPhone = value;
            break;
          case 'email':
            clientEmail = value;
            break;
          case 'direccion':
            clientAddress = value;
            break;
          case 'distrito':
            clientDistrict = value;
            break;
        }
      }
    }
    
    if (!clientDNI) {
      console.warn("Webhook processing stopped: DNI not found in contact's custom fields.");
      return NextResponse.json({ success: false, message: 'DNI not found in custom fields.' }, { status: 400 });
    }
    
    // 6. Save the client to Firestore
    const clientData = {
      dni: clientDNI,
      nombres: clientName || '',
      celular: clientPhone || '',
      email: clientEmail || '',
      direccion: clientAddress || '',
      distrito: clientDistrict || '',
      provincia: 'Lima', // Default value
      estado_llamada: 'NUEVO', // Set initial call status
      kommo_lead_id: leadId,
      kommo_contact_id: contactId,
      last_updated_from_kommo: new Date().toISOString(),
    };

    const docRef = db.collection('clients').doc(clientDNI);
    await docRef.set(clientData, { merge: true });
    
    console.log(`Successfully processed and saved client: ${clientDNI}`);
    return NextResponse.json({ success: true, message: `Cliente procesado.`, id: docRef.id });

  } catch (error) {
    console.error(`Error processing webhook logic:`, error);
    return NextResponse.json({ message: 'Internal server error while processing webhook logic.' }, { status: 500 });
  }
}
