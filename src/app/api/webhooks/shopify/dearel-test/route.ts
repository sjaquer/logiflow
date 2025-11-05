import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';

export async function POST(request: Request) {
    console.log('🧪 [TEST] Webhook de prueba recibido para Dearel');

    try {
        // Leer el payload
        const rawBody = await request.text();
        console.log('📦 [TEST] Raw body:', rawBody);

        let data: Record<string, any>;
        try {
            data = JSON.parse(rawBody);
        } catch (error) {
            console.error('❌ [TEST] Error parsing JSON:', error);
            return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
        }

        console.log('✅ [TEST] Parsed data:', JSON.stringify(data, null, 2));

        const shopifyOrderId = String(data.id);
        if (!shopifyOrderId) {
            console.error('❌ [TEST] Order ID is missing from payload');
            return NextResponse.json({ success: false, message: 'Order ID is missing' }, { status: 400 });
        }

        console.log('🔑 [TEST] Order ID found:', shopifyOrderId);

        // Intentar escribir a Firestore
        const db = getAdminDb();
        console.log('🔥 [TEST] Firebase Admin DB initialized');

        const shippingAddress = data.shipping_address || {};
        const customer = data.customer || {};

        let clientName = shippingAddress.name || '';
        if (!clientName && (customer.first_name || customer.last_name)) {
            clientName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
        }

        const testLead = {
            nombres: clientName || 'Test Customer',
            celular: customer.phone || '987654321',
            email: customer.email || data.email || 'test@example.com',
            direccion: shippingAddress.address1 || 'Test Address',
            distrito: shippingAddress.city || 'Lima',
            provincia: shippingAddress.province || 'Lima',
            source: 'shopify' as const,
            last_updated: new Date().toISOString(),
            call_status: 'NUEVO' as const,
            first_interaction_at: new Date().toISOString(),
            tienda_origen: 'Dearel' as const,
            shopify_order_id: shopifyOrderId,
            test_mode: true, // Flag para identificar tests
        };

        console.log('📋 [TEST] Lead data to save:', JSON.stringify(testLead, null, 2));

        const leadRef = db.collection('shopify_leads').doc(`test_${shopifyOrderId}`);
        await leadRef.set(testLead, { merge: true });

        console.log('✅ [TEST] Lead saved successfully to Firestore');

        return NextResponse.json({ 
            success: true, 
            message: 'TEST: Dearel webhook processed successfully',
            leadId: leadRef.id,
            data: testLead
        });

    } catch (error) {
        console.error('💥 [TEST] Unexpected error:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: 'Dearel Test Webhook Endpoint',
        status: 'active',
        timestamp: new Date().toISOString()
    });
}