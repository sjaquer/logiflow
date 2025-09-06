
import { NextResponse } from 'next/server';
import { z } from 'zod';

const NotifyRequestSchema = z.object({
  payload: z.record(z.any()), // Permite cualquier objeto JSON como payload
});

/**
 * API Endpoint para actuar como proxy seguro y llamar a webhooks externos (ej. Make.com).
 * Esto evita exponer las URLs de los webhooks en el lado del cliente.
 */
export async function POST(request: Request) {
  try {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ success: false, message: 'La URL del webhook no está configurada en el servidor.' }, { status: 500 });
    }

    const body = await request.json();

    // 1. Validar la solicitud que llega desde nuestra propia app
    const parsedRequest = NotifyRequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json({ success: false, message: 'Solicitud inválida, se esperaba un "payload".', errors: parsedRequest.error.flatten() }, { status: 400 });
    }

    const { payload } = parsedRequest.data;

    // 2. Llamar al webhook externo (Make.com) de forma segura desde el servidor
    const makeResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Make.com responde con "Accepted" (texto plano) y status 200 si el webhook fue recibido.
    if (!makeResponse.ok) {
        console.error('Error al llamar al webhook de Make.com:', makeResponse.statusText);
        const responseBody = await makeResponse.text();
        console.error('Respuesta de Make.com:', responseBody);
        return NextResponse.json({ success: false, message: `El servicio externo devolvió un error: ${makeResponse.statusText}` }, { status: makeResponse.status });
    }
    
    // 3. Responder a nuestra app que todo salió bien
    return NextResponse.json({ success: true, message: 'Webhook disparado correctamente.' });

  } catch (error) {
    console.error('Error en el endpoint de notificación:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}
