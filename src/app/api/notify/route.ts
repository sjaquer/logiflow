import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import type { Webhook, WebhookEvent } from '@/lib/types';

const NotifyRequestSchema = z.object({
  event: z.custom<WebhookEvent>(),
  payload: z.record(z.any()),
});

/**
 * API Endpoint to trigger webhooks based on application events.
 * It reads webhook configurations from Firestore and calls them.
 */
export async function POST(request: Request) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const parsedRequest = NotifyRequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json({ success: false, message: 'Solicitud inválida, se esperaba un "event" y "payload".', errors: parsedRequest.error.flatten() }, { status: 400 });
    }

    const { event, payload } = parsedRequest.data;

    // Find all active webhooks for the given event
    const webhooksRef = db.collection('webhooks');
    const snapshot = await webhooksRef.where('event', '==', event).where('active', '==', true).get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: 'Evento recibido, pero no hay webhooks activos configurados para este evento.', detail: `No webhooks found for event: ${event}` }, { status: 200 });
    }

    const webhookPromises = snapshot.docs.map(doc => {
        const webhook = doc.data() as Webhook;
        console.log(`Calling webhook: ${webhook.name} for event: ${event}`);
        return fetch(webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    });

    await Promise.all(webhookPromises);
    
    return NextResponse.json({ success: true, message: 'Webhooks disparados correctamente.', detail: `Called ${webhookPromises.length} webhook(s) for event: ${event}` });

  } catch (error) => {
    console.error('Error en el endpoint de notificación:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}
