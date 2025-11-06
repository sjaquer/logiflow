/**
 * Utilidades comunes para procesar webhooks de Shopify
 */

import type { OrderItem, Shop } from './types';

/**
 * Formatea un número de teléfono peruano
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+51')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('51')) {
      cleaned = cleaned.substring(2);
    }
    return cleaned.trim();
}

/**
 * Extrae el nombre del cliente de un pedido de Shopify
 * Prioridad: shipping_address > billing_address > customer > email > fallback
 */
export function extractClientName(data: any, storeName: string): string {
    const shippingAddress = data.shipping_address || {};
    const billingAddress = data.billing_address || {};
    const customer = data.customer || {};
    
    let clientName = '';
    
    // 1. Intentar con shipping_address.name
    if (shippingAddress.name) {
        clientName = shippingAddress.name;
    } 
    // 2. Intentar con billing_address.name
    else if (billingAddress.name) {
        clientName = billingAddress.name;
    } 
    // 3. Combinar customer.first_name + last_name
    else if (customer.first_name || customer.last_name) {
        clientName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    } 
    // 4. Intentar con customer.default_address
    else if (customer.default_address?.name) {
        clientName = customer.default_address.name;
    } 
    // 5. Usar email como último recurso
    else if (data.contact_email || customer.email || data.email) {
        const email = data.contact_email || customer.email || data.email;
        clientName = email.split('@')[0].replace(/[._-]/g, ' ').trim();
    }
    
    // Fallback final
    if (!clientName) {
        clientName = 'Usuario Desconocido';
        console.warn(`[${storeName}] ⚠️ No se pudo determinar el nombre del cliente para el pedido ${data.id}`);
    }
    
    console.log(`[${storeName}] Cliente identificado: "${clientName}"`);
    return clientName;
}

/**
 * Procesa los items de línea de un pedido de Shopify
 */
export function processShopifyItems(lineItems: any[]): OrderItem[] {
    return (lineItems || []).map((item: any) => ({
        sku: item.sku || 'N/A',
        nombre: item.title || 'Producto sin nombre',
        variante: item.variant_title || '',
        cantidad: item.quantity,
        precio_unitario: parseFloat(item.price),
        subtotal: parseFloat(item.price) * item.quantity,
        estado_item: 'PENDIENTE' as const,
    }));
}

/**
 * Extrae los detalles de pago de un pedido de Shopify
 */
export function extractPaymentDetails(data: any) {
    return {
        total_price: parseFloat(data.total_price || '0'),
        subtotal_price: parseFloat(data.subtotal_price || '0'),
        total_shipping: parseFloat(data.total_shipping_price_set?.shop_money?.amount || '0'),
        total_tax: parseFloat(data.total_tax || '0'),
        total_discounts: parseFloat(data.total_discounts || '0'),
        payment_gateway: data.payment_gateway_names?.[0] || 'Desconocido',
        financial_status: data.financial_status || 'pending',
        currency: data.currency || 'PEN',
    };
}

/**
 * Extrae el mejor número de teléfono disponible
 */
export function extractPhoneNumber(data: any): string {
    const shippingAddress = data.shipping_address || {};
    const billingAddress = data.billing_address || {};
    const customer = data.customer || {};
    
    const phone = shippingAddress.phone 
        || billingAddress.phone 
        || data.phone 
        || customer.phone 
        || customer.default_address?.phone
        || '';
    
    return formatPhoneNumber(phone);
}

/**
 * Crea un objeto de lead completo desde un pedido de Shopify
 * Filtra valores undefined para evitar errores en Firestore
 */
export function createShopifyLead(data: any, storeName: Shop) {
    const shippingAddress = data.shipping_address || {};
    const billingAddress = data.billing_address || {};
    const customer = data.customer || {};
    
    const clientName = extractClientName(data, storeName);
    const shopifyItems = processShopifyItems(data.line_items);
    const shopifyPaymentDetails = extractPaymentDetails(data);
    const shopifyOrderId = String(data.id);
    
    // Función helper para limpiar valores undefined
    const cleanValue = (value: any, defaultValue: any = '') => {
        return value !== undefined && value !== null ? value : defaultValue;
    };
    
    const lead: any = {
        // Información personal
        nombres: clientName,
        celular: extractPhoneNumber(data),
        
        // Dirección de envío
        direccion: cleanValue(shippingAddress.address1 || billingAddress.address1),
        distrito: cleanValue(shippingAddress.city || billingAddress.city),
        provincia: cleanValue(shippingAddress.province || billingAddress.province, 'Lima'),
        
        // Campos de origen y tracking
        source: 'shopify',
        tienda_origen: storeName,
        
        // Información del pedido
        shopify_order_id: shopifyOrderId,
        shopify_items: shopifyItems,
        shopify_payment_details: shopifyPaymentDetails,
        
        // Estados
        call_status: 'NUEVO',
        
        // Fechas importantes
        first_interaction_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
    };
    
    // Agregar campos opcionales solo si tienen valores válidos
    if (shippingAddress.last_name || billingAddress.last_name || customer.last_name) {
        lead.apellidos = shippingAddress.last_name || billingAddress.last_name || customer.last_name;
    }
    
    if (customer.email || data.email || data.contact_email) {
        lead.email = customer.email || data.email || data.contact_email;
    }
    
    if (shippingAddress.address2 || billingAddress.address2) {
        lead.direccion_referencia = shippingAddress.address2 || billingAddress.address2;
    }
    
    if (shippingAddress.zip || billingAddress.zip) {
        lead.codigo_postal = shippingAddress.zip || billingAddress.zip;
    }
    
    if (shippingAddress.country || billingAddress.country) {
        lead.pais = shippingAddress.country || billingAddress.country;
    }
    
    if (data.order_number || data.name) {
        lead.shopify_order_number = data.order_number || data.name;
    }
    
    if (data.financial_status) {
        lead.financial_status = data.financial_status;
    }
    
    if (data.fulfillment_status) {
        lead.fulfillment_status = data.fulfillment_status;
    }
    
    if (data.created_at) {
        lead.created_time = data.created_at;
    }
    
    if (data.confirmed && data.confirmed_at) {
        lead.confirmed_at = data.confirmed_at;
    }
    
    if (data.note) {
        lead.notas_cliente = data.note;
    }
    
    if (data.tags) {
        lead.tags = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    
    if (customer.id) {
        lead.shopify_customer_id = String(customer.id);
    }
    
    return lead;
}
