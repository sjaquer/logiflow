# 🚀 Shopify Webhooks - Referencia Rápida

## 📍 URLs de Webhook por Tienda

### Development (ngrok)
Primero ejecuta: `ngrok http 3000`

Luego usa estas URLs en Shopify:

```
Novi:     https://TU-NGROK-ID.ngrok.io/api/webhooks/shopify/novi
Dearel:   https://TU-NGROK-ID.ngrok.io/api/webhooks/shopify/dearel
Blumi:    https://TU-NGROK-ID.ngrok.io/api/webhooks/shopify/blumi
NoviPeru: https://TU-NGROK-ID.ngrok.io/api/webhooks/shopify/noviperu
Cumbre:   https://TU-NGROK-ID.ngrok.io/api/webhooks/shopify/cumbre
Trazto:   https://TU-NGROK-ID.ngrok.io/api/webhooks/shopify/trazto
```

### Production
```
Novi:     https://flujologistico.vercel.app/api/webhooks/shopify/novi
Dearel:   https://flujologistico.vercel.app/api/webhooks/shopify/dearel
Blumi:    https://flujologistico.vercel.app/api/webhooks/shopify/blumi
NoviPeru: https://flujologistico.vercel.app/api/webhooks/shopify/noviperu
Cumbre:   https://flujologistico.vercel.app/api/webhooks/shopify/cumbre
Trazto:   https://flujologistico.vercel.app/api/webhooks/shopify/trazto
```

---

## ⚙️ Configuración de Webhooks en Shopify

Para **cada tienda**, crea estos 4 webhooks:

| Event | Format | URL |
|-------|--------|-----|
| `orders/create` | JSON | `https://{dominio}/api/webhooks/shopify/{tienda}` |
| `orders/updated` | JSON | `https://{dominio}/api/webhooks/shopify/{tienda}` |
| `orders/paid` | JSON | `https://{dominio}/api/webhooks/shopify/{tienda}` |
| `fulfillments/create` | JSON | `https://{dominio}/api/webhooks/shopify/{tienda}` |

---

## 🔑 Variables de Entorno (.env)

Copia y pega en tu archivo `.env`, luego completa con tus credenciales reales:

```bash
# === NOVI ===
SHOPIFY_NOVI_SHOP_DOMAIN=novi.myshopify.com
SHOPIFY_NOVI_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_NOVI_WEBHOOK_SECRET=
SHOPIFY_NOVI_API_VERSION=2024-10

# === DEAREL ===
SHOPIFY_DEAREL_SHOP_DOMAIN=dearel.myshopify.com
SHOPIFY_DEAREL_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_DEAREL_WEBHOOK_SECRET=
SHOPIFY_DEAREL_API_VERSION=2024-10

# === BLUMI PERÚ ===
SHOPIFY_BLUMI_SHOP_DOMAIN=blumi-peru.myshopify.com
SHOPIFY_BLUMI_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_BLUMI_WEBHOOK_SECRET=
SHOPIFY_BLUMI_API_VERSION=2024-10

# === NOVIPERU ===
SHOPIFY_NOVIPERU_SHOP_DOMAIN=noviperu.myshopify.com
SHOPIFY_NOVIPERU_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_NOVIPERU_WEBHOOK_SECRET=
SHOPIFY_NOVIPERU_API_VERSION=2024-10

# === CUMBRE ===
SHOPIFY_CUMBRE_SHOP_DOMAIN=cumbre.myshopify.com
SHOPIFY_CUMBRE_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_CUMBRE_WEBHOOK_SECRET=
SHOPIFY_CUMBRE_API_VERSION=2024-10

# === TRAZTO ===
SHOPIFY_TRAZTO_SHOP_DOMAIN=trazto.myshopify.com
SHOPIFY_TRAZTO_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_TRAZTO_WEBHOOK_SECRET=
SHOPIFY_TRAZTO_API_VERSION=2024-10
```

---

## 🧪 Testing con PowerShell

### 1. Levantar ngrok
```powershell
ngrok http 3000
```

### 2. Probar endpoint manualmente (sin HMAC)
```powershell
$payload = @{
    id = "12345678901"
    order_number = 1001
    email = "test@example.com"
    total_price = "150.00"
    subtotal_price = "140.00"
    line_items = @(
        @{
            title = "Producto Test"
            quantity = 1
            price = "140.00"
            sku = "TEST-001"
        }
    )
    customer = @{
        first_name = "Juan"
        last_name = "Prueba"
        email = "test@example.com"
        phone = "987654321"
    }
    shipping_address = @{
        name = "Juan Prueba"
        address1 = "Av Test 123"
        city = "Lima"
        province = "Lima"
        phone = "987654321"
    }
} | ConvertTo-Json -Depth 10

# Cambiar {tienda} por: novi, dearel, blumi, noviperu, cumbre, trazto
$url = "https://TU-NGROK-ID.ngrok.io/api/webhooks/shopify/dearel"

# OJO: Esta prueba fallará con 401 si HMAC está activado
Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType "application/json"
```

### 3. Ver logs en tiempo real
```powershell
# En tu terminal donde corre Next.js verás:
# [Dearel] Webhook received
# [Dearel] ❌ Invalid webhook signature (esperado si no enviaste HMAC)
# O
# [Dearel] ✅ Webhook signature verified
# [Dearel] ✅ Lead saved to shopify_leads: 12345678901
```

---

## 🔐 Permisos (Scopes) Requeridos

Al crear la Custom App en Shopify, selecciona:

- ✅ `read_orders` — **Obligatorio** (leer pedidos)
- ✅ `read_customers` — **Obligatorio** (datos del cliente)
- ✅ `read_products` — Recomendado (información de productos)
- ✅ `read_fulfillments` — Recomendado (estado de envíos)
- ⚠️ `write_webhooks` — Opcional (si quieres gestionar webhooks vía API)

**NO concedas**:
- ❌ `write_orders` — Solo si necesitas modificar pedidos
- ❌ `write_customers` — No es necesario
- ❌ `read_all_orders` — Scope amplio no necesario

---

## 📊 Verificar Configuración

### Comando para ver config cargada
Añade esto temporalmente en un endpoint de prueba:

```typescript
import { getShopifyConfigStats } from '@/lib/shopify-config';

export async function GET() {
  const stats = getShopifyConfigStats();
  return NextResponse.json(stats);
}
```

Luego visita: `http://localhost:3000/api/test-shopify-config`

Respuesta esperada:
```json
{
  "totalStores": 6,
  "configuredStores": 6,
  "storesWithWebhooks": 6,
  "stores": [
    {
      "name": "Novi",
      "domain": "novi.myshopify.com",
      "hasToken": true,
      "hasWebhookSecret": true,
      "apiVersion": "2024-10"
    },
    // ... resto de tiendas
  ]
}
```

---

## 🐛 Errores Comunes

### Error: "Invalid signature" (401)
**Causa**: Webhook secret no coincide o está vacío
**Fix**:
1. Verifica que `SHOPIFY_{TIENDA}_WEBHOOK_SECRET` esté en `.env`
2. Reinicia el servidor después de cambiar `.env`
3. En desarrollo, puedes temporalmente comentar la validación

### Error: "Order ID is missing" (400)
**Causa**: Payload de prueba no tiene campo `id`
**Fix**: Asegúrate que el JSON tenga `"id": "12345678901"`

### Error: No se guarda en Firestore
**Causa**: Credenciales Firebase incorrectas o reglas restrictivas
**Fix**:
1. Verifica `FIREBASE_SERVICE_ACCOUNT` en `.env`
2. Revisa Firestore Rules: debe permitir writes del servidor
3. Mira logs del servidor para ver el error exacto

---

## ✅ Checklist Rápido

- [ ] 6 endpoints creados (verificar archivos en `src/app/api/webhooks/shopify/`)
- [ ] `.env` configurado con todas las tiendas
- [ ] Custom Apps creadas en Shopify con scopes correctos
- [ ] Access Tokens copiados a `.env`
- [ ] Webhooks configurados en Shopify Admin (4 por tienda = 24 total)
- [ ] ngrok funcionando para testing local
- [ ] Prueba con pedido real: webhook recibido, HMAC verificado, guardado en Firestore
- [ ] Pedido visible en Call Center Queue UI

---

## 📚 Documentación Completa

Ver: `SHOPIFY_SETUP.md` para guía paso a paso detallada.

---

**Última actualización**: 4 de noviembre de 2025
