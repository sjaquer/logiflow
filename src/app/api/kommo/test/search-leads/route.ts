import { NextResponse } from 'next/server';
import { searchLeads } from '@/lib/kommo';

/**
 * Endpoint de prueba para buscar leads en Kommo
 * GET /api/kommo/test/search-leads?query=Juan
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json(
                { success: false, message: 'query is required' },
                { status: 400 }
            );
        }

        console.log(`[KOMMO_TEST] Searching leads with query: "${query}"`);
        
        const result = await searchLeads(query);

        if (result) {
            const leadsCount = result._embedded?.leads?.length || 0;
            console.log(`[KOMMO_TEST] ✅ Found ${leadsCount} leads`);
            return NextResponse.json({ 
                success: true, 
                message: `Found ${leadsCount} leads`,
                data: result 
            });
        } else {
            console.log(`[KOMMO_TEST] ❌ Search failed or API error`);
            return NextResponse.json(
                { success: false, message: 'Search failed or API error' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('[KOMMO_TEST] Error searching leads:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
