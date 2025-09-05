
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// --- Esquema de Validación para los datos que esperamos de Kommo ---
// Kommo envía muchos datos. Definimos solo los que nos interesan.
// Esta es una estructura de ejemplo, podría necesitar ajustes según el payload real.
const KommoLeadSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  responsible_user_id: z.number(),
  status_id: z.number(),
  pipeline_id: z.number(),
  created_at: z.number(),
  _embedded: z.object({
    contacts: z.array(z.object({
      id: z.number(),
      name: z.string().optional(),
      custom_fields_values: z.array(z.object({
        field_code: z.string(),
        values: z.array(z.object({
          value: z.string(),
        })),
      })).optional(),
    })).optional(),
  }),
});

// --- Inicialización del SDK de Admin de Firebase ---
// Esto es necesario para operaciones de backend como escribir en Firestore desde una API Route.
try {
  if (!admin.apps.length) {
    let credentials;
    // Vercel y otros entornos podrían pasar las credenciales como un raw JSON string
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim().startsWith('{')) {
      credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    } else {
      // Para desarrollo local, es una ruta al archivo
      credentials = require(process.env.GOOGLE_APPLICATION_CREDENTIALS!);
    }
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  }
} catch (error: any) {
  console.error('Firebase Admin SDK initialization error', error);
}

const db = admin.firestore();

// --- El Handler de la API Route ---
export async function POST(request: Request) {
  try {
    // 1. OBTENER LOS DATOS DEL WEBHOOK
    // Kommo envía los datos de un lead/contacto en un array, usualmente bajo una clave como 'leads[add]' o 'contacts[add]'.
    // Inspecciona el payload real de Kommo para obtener la clave correcta. Usaremos 'leads[add][0]' como ejemplo.
    const body = await request.json();
    const leadData = body?.['leads']?.['add']?.[0] || body?.['leads']?.['status']?.[0];

    if (!leadData) {
      return NextResponse.json({ message: "No se encontraron datos de lead válidos en el payload" }, { status: 400 });
    }

    // 2. VALIDAR Y EXTRAER LA INFORMACIÓN
    const parsedLead = KommoLeadSchema.parse(leadData);
    const contact = parsedLead._embedded.contacts?.[0];

    if (!contact) {
      return NextResponse.json({ message: "El lead no tiene un contacto asociado" }, { status: 400 });
    }

    // Mapear campos personalizados de Kommo a nuestros campos.
    // DEBERÁS AJUSTAR 'PHONE', 'EMAIL', 'DNI' al 'field_code' real que tienes en Kommo.
    const getCustomFieldValue = (code: string) => {
      return contact.custom_fields_values?.find(f => f.field_code === code)?.values[0]?.value;
    };

    const clientDNI = getCustomFieldValue('DNI') || `KOMMO-${contact.id}`; // Usar DNI si existe, si no, un ID de Kommo.
    const clientPhone = getCustomFieldValue('PHONE');
    const clientEmail = getCustomFieldValue('EMAIL');
    const clientName = contact.name || parsedLead.name;

    // 3. PREPARAR EL DOCUMENTO PARA FIRESTORE
    const clientDoc = {
      dni: clientDNI,
      nombres: clientName,
      celular: clientPhone || '',
      email: clientEmail || '',
      // Por defecto, no tenemos la dirección desde Kommo a menos que sea un campo personalizado.
      direccion: '', 
      distrito: '',
      provincia: '',
      // Añadimos una referencia para saber de dónde vino este cliente.
      source: 'kommo',
      kommo_lead_id: parsedLead.id,
      kommo_contact_id: contact.id,
    };

    // 4. GUARDAR EN LA BASE DE DATOS (CLIENTS)
    // Usamos .set() con merge:true para crear o actualizar el cliente sin sobrescribir campos existentes.
    const clientRef = db.collection('clients').doc(clientDNI);
    await clientRef.set(clientDoc, { merge: true });

    console.log(`Cliente ${clientName} (DNI: ${clientDNI}) guardado/actualizado desde Kommo.`);

    // 5. RESPONDER A KOMMO
    // Kommo espera una respuesta 200 OK para saber que el webhook fue recibido correctamente.
    return NextResponse.json({ success: true, message: `Cliente ${clientDNI} procesado.` });

  } catch (error) {
    console.error('Error procesando el webhook de Kommo:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Error de validación de datos", errors: error.errors }, { status: 400 });
    }

    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
