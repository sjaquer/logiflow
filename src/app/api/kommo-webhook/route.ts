
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase/firebase-admin';

// --- Esquema de Validación para los datos que esperamos de Kommo ---
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

// --- El Handler de la API Route ---
export async function POST(request: Request) {
  try {
    const db = getAdminDb();
    
    // 1. OBTENER LOS DATOS DEL WEBHOOK
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

    const getCustomFieldValue = (code: string) => {
      return contact.custom_fields_values?.find(f => f.field_code === code)?.values[0]?.value;
    };

    const clientDNI = getCustomFieldValue('DNI') || `KOMMO-${contact.id}`;
    const clientPhone = getCustomFieldValue('PHONE');
    const clientEmail = getCustomFieldValue('EMAIL');
    const clientName = contact.name || parsedLead.name;

    // 3. PREPARAR EL DOCUMENTO PARA FIRESTORE
    const clientDoc = {
      dni: clientDNI,
      nombres: clientName,
      celular: clientPhone || '',
      email: clientEmail || '',
      direccion: '', 
      distrito: '',
      provincia: '',
      source: 'kommo',
      kommo_lead_id: parsedLead.id,
      kommo_contact_id: contact.id,
    };

    // 4. GUARDAR EN LA BASE DE DATOS (CLIENTS)
    const clientRef = db.collection('clients').doc(clientDNI);
    await clientRef.set(clientDoc, { merge: true });

    console.log(`Cliente ${clientName} (DNI: ${clientDNI}) guardado/actualizado desde Kommo.`);

    // 5. RESPONDER A KOMMO
    return NextResponse.json({ success: true, message: `Cliente ${clientDNI} procesado.` });

  } catch (error) {
    console.error('Error procesando el webhook de Kommo:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Error de validación de datos", errors: error.errors }, { status: 400 });
    }

    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
