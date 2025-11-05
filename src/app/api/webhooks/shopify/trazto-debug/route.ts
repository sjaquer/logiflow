import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
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
    const storeName: Shop = 'Trazto';
    
    console.log(`🧪 [${storeName}] DEBUG Webhook received - NO HMAC verification`);

    try {
        // Leer el body como texto
        const rawBody = await request.text();
        console.log(`📦 [${storeName}] Raw body length:`, rawBody.length);

        // Parsear el payload
        let data: Record<string, any>;
        try {
            data = JSON.parse(rawBody);
            console.log(`✅ [${storeName}] JSON parsed successfully`);
            console.log(`🆔 [${storeName}] Order ID:`, data.id);
        } catch (error) {
            console.error(`❌ [${storeName}] Error parsing JSON:`, error);
            return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
        }

        // Verificar Firebase
        const db = getAdminDb();
        console.log(`🔥 [${storeName}] Firebase admin initialized`);

        const shippingAddress = data.shipping_address || {};
        const customer = data.customer || {};
        
        const shopifyOrderId = String(data.id);
        if (!shopifyOrderId) {
            console.error(`❌ [${storeName}] Order ID is missing from payload`);
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
            nombres: clientName || 'Cliente Trazto',
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
            debug_mode: true, // Flag para identificar tests
        };
        
        console.log(`📋 [${storeName}] Lead data prepared:`, JSON.stringify(newShopifyLead, null, 2));

        const leadRef = db.collection('shopify_leads').doc(`debug_${shopifyOrderId}`);
        await leadRef.set(newShopifyLead, { merge: true });

        console.log(`✅ [${storeName}] Lead saved to shopify_leads: ${leadRef.id}`);

        return NextResponse.json({ 
            success: true, 
            message: `${storeName} DEBUG webhook processed successfully`, 
            leadId: leadRef.id,
            data: newShopifyLead
        });

    } catch (error) {
        console.error(`💥 [${storeName}] Unexpected error:`, error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Internal server error'
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: 'Trazto DEBUG Webhook Endpoint - No HMAC verification',
        status: 'active',
        note: 'Use this for testing without HMAC signatures',
        timestamp: new Date().toISOString()
    });
}