
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import type { NextRequest } from 'next/server';

const db = getAdminDb();

// --- Kommo Field Names (Case-Sensitive) ---
// You might need to adjust these if your custom fields in Kommo have different names.
const KOMMO_FIELD_DNI = 'DNI';
const KOMMO_FIELD_PHONE = 'Phone';
const KOMMO_FIELD_EMAIL = 'Email';
const KOMMO_FIELD_ADDRESS = 'Address';


/**
 * API Endpoint to receive webhook data from Kommo.
 * This endpoint is the public "mailbox" for Kommo to send data to.
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!apiKey || apiKey !== process.env.MAKE_API_KEY) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const leadDataKey = Object.keys(data).find(key => key.startsWith('leads[add][0]'));
    
    if (!leadDataKey) {
      return NextResponse.json({ success: false, message: 'No lead data found in webhook payload.' }, { status: 400 });
    }

    const leadName = data['leads[add][0][name]'] as string;
    let clientDNI: string | null = null;
    let clientPhone: string | null = null;
    let clientEmail: string | null = null;
    let clientAddress: string | null = null;

    // Find custom fields by iterating through the data
    for (const key in data) {
      if (key.includes('[custom_fields]')) {
        const fieldNameKey = key.replace(/values\[\d+\]\[value\]$/, 'name');
        const fieldValue = data[key] as string;

        if (data[fieldNameKey] === KOMMO_FIELD_DNI) {
          clientDNI = fieldValue;
        }
        if (data[fieldNameKey] === KOMMO_FIELD_PHONE) {
          clientPhone = fieldValue;
        }
         if (data[fieldNameKey] === KOMMO_FIELD_EMAIL) {
          clientEmail = fieldValue;
        }
         if (data[fieldNameKey] === KOMMO_FIELD_ADDRESS) {
          clientAddress = fieldValue;
        }
      }
    }
    
    // Also check the main phone and email fields if they are not in custom fields
    if (!clientPhone) {
      const phoneKey = Object.keys(data).find(key => key.endsWith('[contacts][0][phone]'));
      if (phoneKey) clientPhone = data[phoneKey] as string;
    }
     if (!clientEmail) {
      const emailKey = Object.keys(data).find(key => key.endsWith('[contacts][0][email]'));
      if (emailKey) clientEmail = data[emailKey] as string;
    }


    if (!clientDNI) {
      return NextResponse.json({ success: false, message: `Custom field '${KOMMO_FIELD_DNI}' not found or empty in Kommo payload. Cannot create client.` }, { status: 400 });
    }
    
    const dataToSave = {
        dni: clientDNI,
        nombres: leadName || 'Sin Nombre desde Kommo',
        celular: clientPhone || '',
        email: clientEmail || '',
        direccion: clientAddress || 'No especificada',
        distrito: '', // Kommo might not send this, can be enriched later
        provincia: '', // Kommo might not send this, can be enriched later
        source: 'kommo-webhook',
    };

    const docRef = db.collection('clients').doc(clientDNI);
    await docRef.set(dataToSave, { merge: true });

    console.log(`Cliente guardado/actualizado desde Kommo con DNI: ${clientDNI}`);
    
    // IMPORTANT: Kommo expects a 200 OK response to confirm receipt.
    return NextResponse.json({ success: true, message: `Cliente procesado.`, id: docRef.id });

  } catch (error) {
    console.error(`Error procesando webhook de Kommo:`, error);
    return NextResponse.json({ message: 'Error interno del servidor al procesar el webhook.' }, { status: 500 });
  }
}
