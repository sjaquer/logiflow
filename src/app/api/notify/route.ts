import { NextResponse } from 'next/server';
import { z } from 'zod';

const NotifyRequestSchema = z.object({
  payload: z.record(z.any()),
});

/**
 * API Endpoint to securely trigger a Make.com webhook from the client.
 * It reads the webhook URL from environment variables and forwards the payload.
 */
export async function POST(request: Request) {
  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!makeWebhookUrl) {
    console.error('MAKE_WEBHOOK_URL environment variable is not set.');
    return NextResponse.json({ success: false, message: 'La configuración del servidor para webhooks está incompleta.' }, { status: 500 });
  }

  try {
    const body = await request.json();

    const parsedRequest = NotifyRequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json({ success: false, message: 'Solicitud inválida, se esperaba un "payload".', errors: parsedRequest.error.flatten() }, { status: 400 });
    }

    const { payload } = parsedRequest.data;

    // Call the Make.com webhook
    const makeResponse = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!makeResponse.ok) {
        // Forward the error from Make.com if possible
        const errorBody = await makeResponse.text();
        console.error(`Error from Make.com webhook: ${makeResponse.status} ${errorBody}`);
        return NextResponse.json({ success: false, message: `Error del webhook de Make.com: ${errorBody}` }, { status: makeResponse.status });
    }

    const responseText = await makeResponse.text();

    // Make.com often returns "Accepted" as plain text for webhooks
    if (responseText.toLowerCase() === 'accepted') {
        return NextResponse.json({ success: true, message: 'Webhook disparado correctamente.', detail: 'Accepted' });
    }
    
    // Try to parse as JSON if not plain text "Accepted"
    try {
        const responseJson = JSON.parse(responseText);
        return NextResponse.json({ success: true, message: 'Webhook disparado correctamente.', detail: responseJson });
    } catch {
        // If it's not JSON and not "Accepted", return the text
        return NextResponse.json({ success: true, message: 'Webhook disparado correctamente.', detail: responseText });
    }


  } catch (error) => {
    console.error('Error en el endpoint de notificación:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}
