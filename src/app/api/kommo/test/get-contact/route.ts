import { NextResponse } from 'next/server';
import { getContactDetails } from '@/lib/kommo';

/**
 * Endpoint de prueba para obtener detalles de un contacto de Kommo
 * GET /api/kommo/test/get-contact?contactId=654321
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const contactIdStr = searchParams.get('contactId');

        if (!contactIdStr) {
            return NextResponse.json(
                { success: false, message: 'contactId is required' },
                { status: 400 }
            );
        }

        const contactId = parseInt(contactIdStr, 10);
        if (isNaN(contactId)) {
            return NextResponse.json(
                { success: false, message: 'contactId must be a number' },
                { status: 400 }
            );
        }

        console.log(`[KOMMO_TEST] Fetching contact details for ID: ${contactId}`);
        
        const result = await getContactDetails(contactId);

        if (result) {
            console.log(`[KOMMO_TEST] ✅ Contact found:`, result);
            return NextResponse.json({ 
                success: true, 
                message: 'Contact retrieved successfully',
                data: result 
            });
        } else {
            console.log(`[KOMMO_TEST] ❌ Contact not found or API error`);
            return NextResponse.json(
                { success: false, message: 'Contact not found or API error' },
                { status: 404 }
            );
        }
    } catch (error: any) {
        console.error('[KOMMO_TEST] Error fetching contact:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
