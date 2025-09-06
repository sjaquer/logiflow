
import { NextResponse } from 'next/server';
import { z } from 'zod';

const NotifyRequestSchema = z.object({
  webhookUrl: z.string().url('La URL del webhook no es válida.'),
  payload: z.record(z.any()), // Permite cualquier objeto JSON como payload
});

/**
 * API Endpoint para actuar como proxy seguro y llamar a webhooks externos (ej. Make.com).
 * Esto evita exponer las URLs de los webhooks en el lado del cliente.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar la solicitud que llega desde nuestra propia app
    const parsedRequest = NotifyRequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json({ success: false, message: 'Solicitud inválida.', errors: parsedRequest.error.flatten() }, { status: 400 });
    }

    const { webhookUrl, payload } = parsedRequest.data;

    // 2. Llamar al webhook externo (Make.com) de forma segura desde el servidor
    const makeResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Make.com responde con "Accepted" (texto plano) y status 200 si el webhook fue recibido.
    if (!makeResponse.ok) {
        console.error('Error al llamar al webhook de Make.com:', makeResponse.statusText);
        return NextResponse.json({ success: false, message: 'El servicio externo devolvió un error.' }, { status: makeResponse.status });
    }
    
    // 3. Responder a nuestra app que todo salió bien
    return NextResponse.json({ success: true, message: 'Webhook disparado correctamente.' });

  } catch (error) {
    console.error('Error en el endpoint de notificación:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}

    