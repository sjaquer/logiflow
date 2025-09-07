
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import type { NextRequest } from 'next/server';

const db = getAdminDb();

/**
 * API Endpoint to receive and process webhook data from Kommo.
 * This endpoint is designed to be triggered when a new lead is created or updated in Kommo.
 * It expects the data in `application/x-www-form-urlencoded` format.
 */
export async function POST(request: NextRequest) {
  const serverApiKey = process.env.MAKE_API_KEY;

  if (!serverApiKey) {
    console.error("MAKE_API_KEY (Server API Key) is not configured in environment variables.");
    return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
  }

  const apiKeyFromUrl = request.nextUrl.searchParams.get('apiKey');
  if (apiKeyFromUrl !== serverApiKey) {
    console.warn("Unauthorized webhook attempt. Ignoring.");
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    console.log("Received full data object from Kommo:", data);

    // Kommo can send different event types. We are interested in 'add' or 'update' for leads/contacts.
    const eventKey = Object.keys(data).find(key => key.includes('[add][0]') || key.includes('[update][0]'));
    
    if (!eventKey) {
        console.log("Webhook received, but it's not a lead/contact creation or update event. Ignoring.");
        return NextResponse.json({ success: true, message: 'Evento no relevante. Ignorado.' });
    }

    const eventType = eventKey.split('[')[0]; // 'leads' or 'contacts'
    const eventIndex = eventKey.match(/\[(\d+)\]/g)?.[0] || '[0]';
    const prefix = `${eventType}[add]${eventIndex}`; // We'll assume the 'add' event for simplicity

    const clientName = data[`${prefix}[name]`] as string || '';
    
    let clientDNI: string | null = null;
    let clientPhone: string | null = null;
    let clientEmail: string | null = data[`${prefix}[custom_fields][email]`] as string || null;
    let clientAddress: string | null = null;
    let clientDistrict: string | null = null;

    // Kommo sends custom fields as an array. We need to find them.
    for (const key in data) {
        if (key.startsWith(`${prefix}[custom_fields]`)) {
            if (key.endsWith('[name]')) {
                const valueKey = key.replace('[name]', '[values][0][value]');
                const fieldName = data[key] as string;
                const fieldValue = data[valueKey] as string;

                if (fieldName.toLowerCase() === 'dni') {
                    clientDNI = fieldValue;
                }
                if (fieldName.toLowerCase() === 'phone') {
                    clientPhone = fieldValue;
                }
                if (fieldName.toLowerCase() === 'direccion') {
                    clientAddress = fieldValue;
                }
                if (fieldName.toLowerCase() === 'distrito') {
                    clientDistrict = fieldValue;
                }
            }
        }
    }
    
    // In Kommo, the standard phone and email are not in custom_fields
    // Let's check for them in their standard locations as a fallback.
     if (!clientPhone) {
        const phoneKey = Object.keys(data).find(k => k.endsWith('[values][0][value]') && data[k.replace('value', 'code')] === 'PHONE');
        if (phoneKey) clientPhone = data[phoneKey] as string;
     }
     if (!clientEmail) {
        const emailKey = Object.keys(data).find(k => k.endsWith('[values][0][value]') && data[k.replace('value', 'code')] === 'EMAIL');
        if (emailKey) clientEmail = data[emailKey] as string;
     }

    if (!clientDNI) {
      console.warn("Webhook processing stopped: DNI not found in custom fields.");
      return NextResponse.json({ success: false, message: 'DNI no encontrado en los campos personalizados.' }, { status: 400 });
    }

    const clientData = {
      dni: clientDNI,
      nombres: clientName,
      celular: clientPhone || '',
      email: clientEmail || '',
      direccion: clientAddress || '',
      distrito: clientDistrict || '',
      provincia: 'Lima', // Default value
      kommo_lead_id: data[`${prefix}[id]`] as string || null,
      last_updated_from_kommo: new Date().toISOString(),
    };

    const docRef = db.collection('clients').doc(clientDNI);
    await docRef.set(clientData, { merge: true });
    
    console.log(`Successfully processed and saved client: ${clientDNI}`);
    return NextResponse.json({ success: true, message: `Cliente procesado.`, id: docRef.id });

  } catch (error) {
    console.error(`Error procesando webhook de Kommo:`, error);
    return NextResponse.json({ message: 'Error interno del servidor al procesar el webhook.' }, { status: 500 });
  }
}
