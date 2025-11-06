import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { verifyShopifyWebhook } from '@/lib/shopify-config';
import { createShopifyLead, processShopifyItems, extractPaymentDetails } from '@/lib/shopify-webhook-utils';
import type { Shop } from '@/lib/types';

export async function POST(request: Request) {
    const storeName: Shop = 'NoviPeru';
    
    console.log(`[${storeName}] Webhook received`);

    // Leer el body como texto para verificar HMAC
    const rawBody = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256') || '';

    // Verificar firma HMAC
    const isValid = verifyShopifyWebhook(rawBody, signature, storeName);
    if (!isValid) {
        console.error(`[${storeName}] ❌ Invalid webhook signature`);
        return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }

    console.log(`[${storeName}] ✅ Webhook signature verified`);

    // Parsear el payload
    let data: Record<string, any>;
    try {
        data = JSON.parse(rawBody);
    } catch (error) {
        console.error(`[${storeName}] Error parsing JSON:`, error);
        return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    const db = getAdminDb();
    
    const shopifyOrderId = String(data.id);
    if (!shopifyOrderId) {
        console.error(`[${storeName}] Order ID is missing from payload`);
        return NextResponse.json({ success: false, message: 'Order ID is missing' }, { status: 400 });
    }

    // Usar la función compartida para crear el lead con toda la lógica mejorada
    const newShopifyLead = createShopifyLead(data, storeName);
    const shopifyItems = processShopifyItems(data.line_items);
    const shopifyPaymentDetails = extractPaymentDetails(data);
    
    const leadRef = db.collection('shopify_leads').doc(shopifyOrderId);
    await leadRef.set(newShopifyLead, { merge: true });

    console.log(`[${storeName}] ✅ Lead guardado en shopify_leads: ${leadRef.id}`);
    console.log(`[${storeName}] 📦 Pedido #${newShopifyLead.shopify_order_number} - Cliente: ${newShopifyLead.nombres} - Items: ${shopifyItems.length} - Total: S/ ${shopifyPaymentDetails.total_price}`);

    return NextResponse.json({ 
        success: true, 
        message: `${storeName} order processed`, 
        leadId: leadRef.id,
        clientName: newShopifyLead.nombres,
        orderNumber: newShopifyLead.shopify_order_number,
    });
}
