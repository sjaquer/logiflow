import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { verifyShopifyWebhook } from '@/lib/shopify-config';
import type { OrderItem, Shop } from '@/lib/types';

function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+51')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('51')) {
      cleaned = cleaned.substring(2);
    }
    return cleaned.trim();
}

export async function POST(request: Request) {
    const storeName: Shop = 'Novi';
    
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
    const shippingAddress = data.shipping_address || {};
    const customer = data.customer || {};
    
    const shopifyOrderId = String(data.id);
    if (!shopifyOrderId) {
        console.error(`[${storeName}] Order ID is missing from payload`);
        return NextResponse.json({ success: false, message: 'Order ID is missing' }, { status: 400 });
    }

    let clientName = shippingAddress.name || '';
    if (!clientName && (customer.first_name || customer.last_name)) {
        clientName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }

    const shopifyItems: OrderItem[] = (data.line_items || []).map((item: any) => ({
      sku: item.sku || 'N/A',
      nombre: item.title || 'Producto sin nombre',
      variante: item.variant_title || '',
      cantidad: item.quantity,
      precio_unitario: parseFloat(item.price),
      subtotal: parseFloat(item.price) * item.quantity,
      estado_item: 'PENDIENTE' as const,
    }));
    
    const shopifyPaymentDetails = {
        total_price: parseFloat(data.total_price || '0'),
        subtotal_price: parseFloat(data.subtotal_price || '0'),
        total_shipping: parseFloat(data.total_shipping_price_set?.shop_money?.amount || '0'),
        payment_gateway: data.payment_gateway_names?.[0] || 'Desconocido',
    };

    const newShopifyLead = {
        nombres: clientName,
        celular: formatPhoneNumber(shippingAddress.phone || data.phone || customer.phone),
        email: customer.email || data.email || '',
        direccion: shippingAddress.address1 || '',
        distrito: shippingAddress.city || '',
        provincia: shippingAddress.province || 'Lima',
        source: 'shopify' as const,
        last_updated: new Date().toISOString(),
        call_status: 'NUEVO' as const, 
        first_interaction_at: new Date().toISOString(),
        tienda_origen: storeName,
        shopify_order_id: shopifyOrderId,
        shopify_items: shopifyItems,
        shopify_payment_details: shopifyPaymentDetails,
    };
    
    const leadRef = db.collection('shopify_leads').doc(shopifyOrderId);
    await leadRef.set(newShopifyLead, { merge: true });

    console.log(`[${storeName}] ✅ Lead saved to shopify_leads: ${leadRef.id}`);

    return NextResponse.json({ 
        success: true, 
        message: `${storeName} order processed`, 
        leadId: leadRef.id 
    });
}
