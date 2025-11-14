import { NextResponse } from 'next/server';
import { updateLead } from '@/lib/kommo';

/**
 * Endpoint de prueba para actualizar un lead en Kommo
 * POST /api/kommo/test/update-test-lead
 * Body: { leadId: "123456", updates: { price: 500, ... } }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { leadId, updates } = body;

        if (!leadId) {
            return NextResponse.json(
                { success: false, message: 'leadId is required' },
                { status: 400 }
            );
        }

        if (!updates || typeof updates !== 'object') {
            return NextResponse.json(
                { success: false, message: 'updates object is required' },
                { status: 400 }
            );
        }

        console.log(`[KOMMO_TEST] Updating lead ${leadId} with:`, updates);

        // Construir payload con el leadId
        const payload = {
            id: parseInt(leadId, 10),
            ...updates
        };

        const result = await updateLead(leadId, payload);

        if (result) {
            console.log(`[KOMMO_TEST] ✅ Lead updated successfully`);
            return NextResponse.json({ 
                success: true, 
                message: 'Lead updated successfully',
                data: result 
            });
        } else {
            console.log(`[KOMMO_TEST] ❌ Failed to update lead`);
            return NextResponse.json(
                { success: false, message: 'Failed to update lead' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('[KOMMO_TEST] Error updating lead:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
