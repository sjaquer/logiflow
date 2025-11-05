/**
 * Configuración Multi-Tienda para Shopify
 * 
 * Este archivo maneja las credenciales y configuración de múltiples tiendas de Shopify.
 * Cada tienda tiene sus propias credenciales de API y webhook secrets.
 */

import type { Shop } from './types';

interface ShopifyStoreConfig {
  name: Shop;
  domain: string;
  accessToken: string;
  webhookSecret: string;
  apiVersion: string;
  active: boolean;
}

// Mapeo de nombres de tienda a identificadores de variables de entorno
const STORE_ENV_MAP = {
  'Novi': 'NOVI',
  'Dearel': 'DEAREL', 
  'Blumi Perú': 'BLUMI',
  'NoviPeru': 'NOVIPERU',
  'Cumbre': 'CUMBRE',
  'Trazto': 'TRAZTO'
} as const;

/**
 * Obtiene la configuración de una tienda específica desde las variables de entorno
 */
export function getShopifyStoreConfig(storeName: Shop): ShopifyStoreConfig | null {
  const envKey = STORE_ENV_MAP[storeName];
  
  if (!envKey) {
    console.error(`[ShopifyConfig] No env mapping found for store: ${storeName}`);
    return null;
  }

  const domain = process.env[`SHOPIFY_${envKey}_SHOP_DOMAIN`];
  const accessToken = process.env[`SHOPIFY_${envKey}_ACCESS_TOKEN`];
  const webhookSecret = process.env[`SHOPIFY_${envKey}_WEBHOOK_SECRET`];
  const apiVersion = process.env[`SHOPIFY_${envKey}_API_VERSION`] || '2023-10';

  // Verificar que las credenciales esenciales estén presentes
  if (!domain || !accessToken) {
    console.warn(`[ShopifyConfig] Missing credentials for store: ${storeName}`);
    return null;
  }

  return {
    name: storeName,
    domain,
    accessToken,
    webhookSecret: webhookSecret || '',
    apiVersion,
    active: true
  };
}

/**
 * Obtiene todas las configuraciones de tiendas disponibles
 */
export function getAllShopifyStores(): ShopifyStoreConfig[] {
  const stores: ShopifyStoreConfig[] = [];
  
  const storeNames: Shop[] = ['Novi', 'Dearel', 'Blumi Perú', 'NoviPeru', 'Cumbre', 'Trazto'];
  
  for (const storeName of storeNames) {
    const config = getShopifyStoreConfig(storeName);
    if (config) {
      stores.push(config);
    }
  }

  console.log(`[ShopifyConfig] Loaded ${stores.length} active stores:`, stores.map(s => s.name));
  return stores;
}

/**
 * Identifica de qué tienda proviene un webhook basándose en el dominio o headers
 */
export function identifyStoreFromWebhook(headers: Record<string, string>, payload: any): Shop | null {
  // Método 1: Verificar header X-Shopify-Shop-Domain
  const shopDomain = headers['x-shopify-shop-domain'] || headers['X-Shopify-Shop-Domain'];
  
  if (shopDomain) {
    const allStores = getAllShopifyStores();
    const store = allStores.find(s => s.domain === shopDomain);
    if (store) {
      console.log(`[ShopifyConfig] Store identified by domain: ${store.name} (${shopDomain})`);
      return store.name;
    }
  }

  // Método 2: Verificar en el payload si hay información de la tienda
  if (payload?.shop?.domain) {
    const allStores = getAllShopifyStores();
    const store = allStores.find(s => s.domain === payload.shop.domain);
    if (store) {
      console.log(`[ShopifyConfig] Store identified by payload: ${store.name} (${payload.shop.domain})`);
      return store.name;
    }
  }

  // Método 3: Verificar webhook signature contra todos los secrets
  const signature = headers['x-shopify-hmac-sha256'] || headers['X-Shopify-Hmac-Sha256'];
  if (signature) {
    // Este método requeriría verificar la firma contra cada webhook secret
    // Se implementaría si los métodos anteriores fallan
    console.log('[ShopifyConfig] Attempting signature-based store identification...');
  }

  console.warn('[ShopifyConfig] Could not identify store from webhook');
  return null;
}

/**
 * Verifica la firma de un webhook de Shopify
 */
export function verifyShopifyWebhook(
  payload: string | Buffer, 
  signature: string, 
  storeName: Shop
): boolean {
  const config = getShopifyStoreConfig(storeName);
  
  if (!config || !config.webhookSecret) {
    console.error(`[ShopifyConfig] No webhook secret for store: ${storeName}`);
    return false;
  }

  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', config.webhookSecret);
    hmac.update(payload, 'utf8');
    const expectedSignature = hmac.digest('base64');
    
    const actualSignature = signature.replace('sha256=', '');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(actualSignature)
    );
    
    if (isValid) {
      console.log(`[ShopifyConfig] ✅ Webhook verified for store: ${storeName}`);
    } else {
      console.error(`[ShopifyConfig] ❌ Invalid webhook signature for store: ${storeName}`);
    }
    
    return isValid;
  } catch (error) {
    console.error(`[ShopifyConfig] Error verifying webhook:`, error);
    return false;
  }
}

/**
 * Obtiene la URL de la API de Shopify para una tienda
 */
export function getShopifyApiUrl(storeName: Shop, endpoint: string): string | null {
  const config = getShopifyStoreConfig(storeName);
  
  if (!config) {
    return null;
  }
  
  return `https://${config.domain}/admin/api/${config.apiVersion}/${endpoint}`;
}

/**
 * Realiza una petición autenticada a la API de Shopify
 */
export async function shopifyApiRequest(
  storeName: Shop, 
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response | null> {
  const config = getShopifyStoreConfig(storeName);
  
  if (!config) {
    console.error(`[ShopifyConfig] No configuration found for store: ${storeName}`);
    return null;
  }
  
  const url = getShopifyApiUrl(storeName, endpoint);
  if (!url) {
    return null;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      console.error(`[ShopifyConfig] API request failed for ${storeName}:`, response.status, response.statusText);
    }
    
    return response;
  } catch (error) {
    console.error(`[ShopifyConfig] API request error for ${storeName}:`, error);
    return null;
  }
}

/**
 * Obtiene estadísticas de configuración para debugging
 */
export function getShopifyConfigStats() {
  const allStores = getAllShopifyStores();
  const configuredStores = allStores.filter(s => s.accessToken && s.domain);
  const storesWithWebhooks = allStores.filter(s => s.webhookSecret);
  
  return {
    totalStores: allStores.length,
    configuredStores: configuredStores.length,
    storesWithWebhooks: storesWithWebhooks.length,
    stores: allStores.map(s => ({
      name: s.name,
      domain: s.domain,
      hasToken: !!s.accessToken,
      hasWebhookSecret: !!s.webhookSecret,
      apiVersion: s.apiVersion
    }))
  };
}