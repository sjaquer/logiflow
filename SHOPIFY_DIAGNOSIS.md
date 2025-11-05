# 🚨 DIAGNÓSTICO: Por qué NO llegan pedidos de Shopify

## ❌ PROBLEMA IDENTIFICADO

**Las credenciales de Shopify están VACÍAS** en tu archivo `.env`:

```bash
# ❌ TODAS están vacías
SHOPIFY_NOVI_ACCESS_TOKEN=
SHOPIFY_DEAREL_ACCESS_TOKEN=
SHOPIFY_BLUMI_ACCESS_TOKEN=
SHOPIFY_NOVIPERU_ACCESS_TOKEN=
SHOPIFY_CUMBRE_ACCESS_TOKEN=
SHOPIFY_TRAZTO_ACCESS_TOKEN=

# ❌ TODOS los webhook secrets están vacíos
SHOPIFY_NOVI_WEBHOOK_SECRET=
SHOPIFY_DEAREL_WEBHOOK_SECRET=
# etc...
```

**Sin credenciales = Sin autenticación = Shopify rechaza los webhooks**

---

## 🛠️ SOLUCIÓN PASO A PASO

### 1. **OBTENER ACCESS TOKENS** (Para cada tienda)

Para **CADA** una de tus 6 tiendas de Shopify:

#### A. Ve a tu Shopify Admin
- Novi: `https://novi.myshopify.com/admin`
- Dearel: `https://dearel.com/admin` 
- Blumi: `https://blumiperu.com/admin`
- NoviPeru: `https://noviperu.myshopify.com/admin`
- Cumbre: `https://cumbre.pe/admin`
- Trazto: `https://trazto.myshopify.com/admin`

#### B. Crear Custom App (si no existe)
1. Ve a **Apps** → **App and sales channel settings**
2. Clic en **Develop apps**
3. **Create an app** → Nombre: "LogiFlow Integration"
4. En **Configuration**, configura **Admin API access**:

**Scopes requeridos**:
- ✅ `read_orders` (Obligatorio)
- ✅ `read_customers` (Obligatorio) 
- ✅ `read_products` (Recomendado)
- ✅ `read_fulfillments` (Para tracking)

5. **Save** → **Install app**
6. **Revela el Admin API access token** → **COPIA EL TOKEN**

#### C. Actualizar .env
```bash
# Reemplaza 'shpat_xxxxx' con tu token real
SHOPIFY_NOVI_ACCESS_TOKEN=shpat_1234567890abcdef...
SHOPIFY_DEAREL_ACCESS_TOKEN=shpat_9876543210fedcba...
# etc para todas las tiendas
```

### 2. **CONFIGURAR WEBHOOKS** (Para cada tienda)

En cada tienda Shopify:

#### A. Crear Webhooks
1. Ve a **Settings** → **Notifications**
2. Scroll hasta **Webhooks**
3. **Create webhook** para CADA evento:

| Event | Endpoint URL |
|-------|-------------|
| `Order creation` | `https://flujologistico.vercel.app/api/webhooks/shopify/novi` |
| `Order updated` | `https://flujologistico.vercel.app/api/webhooks/shopify/novi` |
| `Order paid` | `https://flujologistico.vercel.app/api/webhooks/shopify/novi` |
| `Order fulfillment` | `https://flujologistico.vercel.app/api/webhooks/shopify/novi` |

**⚠️ CAMBIA "novi" por el nombre de cada tienda:**
- Novi: `/shopify/novi`
- Dearel: `/shopify/dearel`
- Blumi: `/shopify/blumi`
- NoviPeru: `/shopify/noviperu`
- Cumbre: `/shopify/cumbre`
- Trazto: `/shopify/trazto`

#### B. Generar Webhook Secret
1. Al crear cada webhook, Shopify genera un **webhook secret**
2. **COPIA** cada secret a tu `.env`:

```bash
SHOPIFY_NOVI_WEBHOOK_SECRET=tu_secret_aqui
SHOPIFY_DEAREL_WEBHOOK_SECRET=otro_secret_aqui
# etc...
```

### 3. **VERIFICAR CONFIGURACIÓN**

#### A. Reiniciar Servidor
```powershell
# Ctrl+C para parar
npm run dev
```

#### B. Probar Diagnóstico
```
GET http://localhost:3000/api/shopify-diagnosis
```

**Respuesta esperada**:
```json
{
  "shopifyConfig": {
    "totalStores": 6,
    "configuredStores": 6,  ← Debe ser 6
    "storesWithWebhooks": 6 ← Debe ser 6
  }
}
```

#### C. Probar Webhook Manualmente
```powershell
# Ejemplo para Dearel
$headers = @{
    "Content-Type" = "application/json"
    "X-Shopify-Hmac-Sha256" = "dummy_signature_for_testing"
}

$payload = @{
    id = "12345678901"
    order_number = 1001
    email = "test@example.com"
    total_price = "150.00"
    customer = @{
        first_name = "Juan"
        last_name = "Prueba"
        email = "test@example.com"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/shopify/dearel" -Method Post -Body $payload -Headers $headers
```

---

## 🔍 DIAGNÓSTICO AVANZADO

### Verificar Variables de Entorno
```powershell
# En terminal de Node.js (F12 → Console):
console.log('NOVI_TOKEN:', process.env.SHOPIFY_NOVI_ACCESS_TOKEN ? 'SET' : 'MISSING');
console.log('DEAREL_TOKEN:', process.env.SHOPIFY_DEAREL_ACCESS_TOKEN ? 'SET' : 'MISSING');
```

### Logs del Servidor
Cuando llega un webhook, deberías ver en tu terminal:

```
✅ CORRECTO:
[Dearel] Webhook received
[Dearel] ✅ Webhook signature verified  
[Dearel] ✅ Lead saved to shopify_leads: 12345678901

❌ ERROR (sin credenciales):
[Dearel] Webhook received
[Dearel] ❌ No webhook secret for store: Dearel
[Dearel] ❌ Invalid webhook signature
```

### Verificar en Shopify
En cada tienda, ve a **Analytics** → **Live View**:
- Haz un pedido de prueba
- Debería aparecer inmediatamente
- Si aparece en Shopify pero NO en tu Call Center → problema de webhook
- Si NO aparece en Shopify → problema de la tienda

---

## 🚀 CHECKLIST COMPLETO

### Credenciales (6 tiendas x 3 valores = 18 configuraciones)
- [ ] NOVI: Domain, Access Token, Webhook Secret
- [ ] DEAREL: Domain, Access Token, Webhook Secret  
- [ ] BLUMI: Domain, Access Token, Webhook Secret
- [ ] NOVIPERU: Domain, Access Token, Webhook Secret
- [ ] CUMBRE: Domain, Access Token, Webhook Secret
- [ ] TRAZTO: Domain, Access Token, Webhook Secret

### Webhooks (6 tiendas x 4 eventos = 24 webhooks)
- [ ] NOVI: 4 webhooks configurados
- [ ] DEAREL: 4 webhooks configurados
- [ ] BLUMI: 4 webhooks configurados  
- [ ] NOVIPERU: 4 webhooks configurados
- [ ] CUMBRE: 4 webhooks configurados
- [ ] TRAZTO: 4 webhooks configurados

### Endpoints (6 archivos existentes ✅)
- [x] `/api/webhooks/shopify/novi/route.ts`
- [x] `/api/webhooks/shopify/dearel/route.ts`
- [x] `/api/webhooks/shopify/blumi/route.ts`
- [x] `/api/webhooks/shopify/noviperu/route.ts`
- [x] `/api/webhooks/shopify/cumbre/route.ts`
- [x] `/api/webhooks/shopify/trazto/route.ts`

### Testing
- [ ] Diagnóstico API: `GET /api/shopify-diagnosis`
- [ ] Webhook manual: `POST /api/webhooks/shopify/[tienda]`
- [ ] Pedido real desde tienda Shopify
- [ ] Verificar en Call Center Queue

---

## 🎯 PRIORIDAD DE IMPLEMENTACIÓN

### 1. **URGENTE** - Configura una tienda primero
Empieza con **Dearel** (tu tienda principal):
1. Obtén access token de Dearel
2. Configura 4 webhooks de Dearel  
3. Actualiza `.env` solo para Dearel
4. Prueba con un pedido real

### 2. **MEDIO** - Replica a otras tiendas
Una vez que Dearel funcione, replica el proceso para:
- Novi
- Blumi  
- NoviPeru

### 3. **FINAL** - Tiendas restantes
- Cumbre
- Trazto

---

## ⚡ COMANDOS RÁPIDOS

### Verificar configuración actual:
```powershell
curl http://localhost:3000/api/shopify-diagnosis
```

### Probar webhook específico:
```powershell
curl -X POST http://localhost:3000/api/webhooks/shopify/dearel \
  -H "Content-Type: application/json" \
  -d '{"id":"12345","email":"test@test.com"}'
```

### Ver logs en tiempo real:
```powershell
# Terminal donde corre npm run dev mostrará los logs
```

---

**¿Quieres que te ayude a configurar la primera tienda paso a paso?** 🚀