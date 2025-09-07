import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import type { Webhook } from '@/lib/types';


const notifyPayloadSchema = z.object({
  event: z.string(),
  payload: z.any(),
});

const db = getAdminDb();

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsedBody = notifyPayloadSchema.safeParse(json);

    if (!parsedBody.success) {
      return NextResponse.json({ success: false, message: 'Invalid payload', errors: parsedBody.error.errors }, { status: 400 });
    }

    const { event, payload } = parsedBody.data;

    // Buscar webhooks activos que coincidan con el evento
    const webhooksRef = db.collection('webhooks');
    const snapshot = await webhooksRef.where('event', '==', event).where('active', '==', true).get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: 'No active webhooks found for this event.', detail: `Event: ${event}` });
    }

    const webhooks = snapshot.docs.map(doc => doc.data() as Webhook);

    // Disparar todos los webhooks en paralelo
    const webhookPromises = webhooks.map(webhook => {
      console.log(`Disparando webhook: ${webhook.name} para el evento: ${event}`);
      return fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(err => {
         // Capturamos errores individuales para no detener todo el proceso
         console.error(`Error al disparar el webhook ${webhook.name} a ${webhook.url}:`, err);
      });
    });

    await Promise.allSettled(webhookPromises);

    return NextResponse.json({ success: true, message: 'Webhooks disparados correctamente.', detail: `Called ${webhookPromises.length} webhook(s) for event: ${event}` });

  } catch (error) {
    console.error('Error en el endpoint de notificación:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}
