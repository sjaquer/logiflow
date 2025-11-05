import { NextResponse } from 'next/server';
import { getShopifyConfigStats } from '@/lib/shopify-config';

export async function GET() {
  console.log('🔍 Checking Shopify configuration...');
  
  const stats = getShopifyConfigStats();
  
  console.log('📊 Shopify Config Stats:', {
    totalStores: stats.totalStores,
    configuredStores: stats.configuredStores,
    storesWithWebhooks: stats.storesWithWebhooks
  });

  const envVars = {
    // Verificar variables específicas
    NOVI_DOMAIN: process.env.SHOPIFY_NOVI_SHOP_DOMAIN || 'MISSING',
    NOVI_TOKEN: process.env.SHOPIFY_NOVI_ACCESS_TOKEN ? 'SET' : 'MISSING',
    NOVI_SECRET: process.env.SHOPIFY_NOVI_WEBHOOK_SECRET ? 'SET' : 'MISSING',
    
    DEAREL_DOMAIN: process.env.SHOPIFY_DEAREL_SHOP_DOMAIN || 'MISSING',
    DEAREL_TOKEN: process.env.SHOPIFY_DEAREL_ACCESS_TOKEN ? 'SET' : 'MISSING',
    DEAREL_SECRET: process.env.SHOPIFY_DEAREL_WEBHOOK_SECRET ? 'SET' : 'MISSING',
    
    // Agregar el resto de tiendas
    BLUMI_DOMAIN: process.env.SHOPIFY_BLUMI_SHOP_DOMAIN || 'MISSING',
    BLUMI_TOKEN: process.env.SHOPIFY_BLUMI_ACCESS_TOKEN ? 'SET' : 'MISSING',
    BLUMI_SECRET: process.env.SHOPIFY_BLUMI_WEBHOOK_SECRET ? 'SET' : 'MISSING',
  };

  const diagnosis = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    shopifyConfig: stats,
    environmentVariables: envVars,
    issues: [],
    solutions: []
  };

  // Diagnosticar problemas
  if (stats.configuredStores === 0) {
    diagnosis.issues.push('🚨 NINGUNA tienda tiene ACCESS_TOKEN configurado');
    diagnosis.solutions.push('1. Ve a tu Shopify Admin → Apps → Custom Apps');
    diagnosis.solutions.push('2. Crea Custom App o usa existente');
    diagnosis.solutions.push('3. Copia Access Token al .env');
  }

  if (stats.storesWithWebhooks === 0) {
    diagnosis.issues.push('⚠️ NINGUNA tienda tiene WEBHOOK_SECRET configurado');
    diagnosis.solutions.push('4. Configura webhook secrets en Shopify');
    diagnosis.solutions.push('5. Copia secrets al .env');
  }

  if (stats.configuredStores < stats.totalStores) {
    diagnosis.issues.push(`⚠️ Solo ${stats.configuredStores}/${stats.totalStores} tiendas configuradas`);
  }

  return NextResponse.json(diagnosis, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Use GET method to check configuration' 
  }, { status: 405 });
}