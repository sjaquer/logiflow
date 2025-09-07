
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import type { NextRequest } from 'next/server';

const db = getAdminDb();

/**
 * API Endpoint to receive webhook data from Kommo.
 * This endpoint is the public "mailbox" for Kommo to send data to.
 */
export async function POST(request: NextRequest) {
    const serverApiKey = process.env.MAKE_API_KEY;

    if (!serverApiKey) {
        console.error("MAKE_API_KEY is not configured on the server.");
        return NextResponse.json({ message: 'Error de configuración del servidor' }, { status: 500 });
    }

    const apiKeyFromUrl = request.nextUrl.searchParams.get('apiKey');
    if (!apiKeyFromUrl || apiKeyFromUrl !== serverApiKey) {
        console.warn("Unauthorized webhook attempt. Ignoring.");
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        console.log("--- INCOMING WEBHOOK FROM KOMMO ---");
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries());

        // Log the entire received payload to Vercel logs
        console.log("Received data:", JSON.stringify(data, null, 2));
        
        // Respond to Kommo immediately to confirm receipt
        return NextResponse.json({ success: true, message: 'Webhook received and logged for debugging.' });

    } catch (error) {
        console.error('Error processing webhook for logging:', error);
        return NextResponse.json({ success: false, message: 'Error processing webhook.' }, { status: 500 });
    }
}
