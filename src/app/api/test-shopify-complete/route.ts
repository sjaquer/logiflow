import { NextResponse } from 'next/server';
import { getShopifyConfigStats } from '@/lib/shopify-config';
import { getAdminDb } from '@/lib/firebase/firebase-admin';

export async function GET() {
  try {
    console.log('🔍 Testing Shopify webhook system...');
    
    // 1. Verificar configuración
    const stats = getShopifyConfigStats();
    console.log('📊 Config stats:', stats);

    // 2. Verificar Firebase connection
    const db = getAdminDb();
    const testDoc = await db.collection('shopify_leads').limit(1).get();
    const firebaseWorks = !testDoc.empty || testDoc.docs.length >= 0;
    console.log('🔥 Firebase connection:', firebaseWorks ? 'OK' : 'FAILED');

    // 3. Verificar endpoints
    const endpointTests = [];
    for (const store of stats.stores) {
      const endpoint = `/api/webhooks/shopify/${store.name.toLowerCase()}`;
      endpointTests.push({
        store: store.name,
        endpoint,
        hasToken: store.hasToken,
        hasSecret: store.hasWebhookSecret
      });
    }

    // 4. Revisar últimos leads en la base de datos
    const recentLeads = await db.collection('shopify_leads')
      .orderBy('last_updated', 'desc')
      .limit(5)
      .get();

    const lastLeads = recentLeads.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().last_updated
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      shopifyConfig: stats,
      firebaseConnection: firebaseWorks,
      endpoints: endpointTests,
      lastLeads: lastLeads,
      diagnostics: {
        totalConfiguredStores: stats.configuredStores,
        totalWithWebhooks: stats.storesWithWebhooks,
        firebaseReads: recentLeads.size,
        recommendations: []
      }
    });

  } catch (error) {
    console.error('💥 Diagnostic error:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('🧪 Manual webhook test initiated...');
    
    const body = await request.json();
    const { store = 'dearel', testPayload } = body;

    console.log(`Testing store: ${store}`);
    console.log(`Test payload:`, testPayload);

    // Crear un lead de prueba directamente
    const db = getAdminDb();
    const testLead = {
      nombres: testPayload?.customer?.first_name || 'Test User',
      celular: testPayload?.customer?.phone || '999888777',
      email: testPayload?.customer?.email || 'test@shopify.com',
      direccion: testPayload?.shipping_address?.address1 || 'Test Address',
      distrito: testPayload?.shipping_address?.city || 'Lima',
      provincia: testPayload?.shipping_address?.province || 'Lima',
      source: 'shopify' as const,
      last_updated: new Date().toISOString(),
      call_status: 'NUEVO' as const,
      first_interaction_at: new Date().toISOString(),
      tienda_origen: store.charAt(0).toUpperCase() + store.slice(1) as any,
      shopify_order_id: testPayload?.id || `manual_test_${Date.now()}`,
      manual_test: true,
      test_timestamp: new Date().toISOString()
    };

    const leadRef = db.collection('shopify_leads').doc(`manual_${Date.now()}`);
    await leadRef.set(testLead);

    console.log('✅ Manual test lead created:', leadRef.id);

    return NextResponse.json({
      success: true,
      message: 'Manual webhook test completed',
      leadId: leadRef.id,
      leadData: testLead,
      instructions: 'Check the Call Center Queue to see if the lead appears'
    });

  } catch (error) {
    console.error('💥 Manual test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}