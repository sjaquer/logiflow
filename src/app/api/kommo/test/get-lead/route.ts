import { NextResponse } from 'next/server';
import { getLeadDetails } from '@/lib/kommo';

/**
 * Endpoint de prueba para obtener detalles de un lead de Kommo
 * GET /api/kommo/test/get-lead?leadId=123456
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const leadId = searchParams.get('leadId');

        if (!leadId) {
            return NextResponse.json(
                { success: false, message: 'leadId is required' },
                { status: 400 }
            );
        }

        console.log(`[KOMMO_TEST] Fetching lead details for ID: ${leadId}`);
        
        const result = await getLeadDetails(leadId);

        if (result) {
            console.log(`[KOMMO_TEST] ✅ Lead found:`, result);
            return NextResponse.json({ 
                success: true, 
                message: 'Lead retrieved successfully',
                data: result 
            });
        } else {
            console.log(`[KOMMO_TEST] ❌ Lead not found or API error`);
            return NextResponse.json(
                { success: false, message: 'Lead not found or API error' },
                { status: 404 }
            );
        }
    } catch (error: any) {
        console.error('[KOMMO_TEST] Error fetching lead:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
