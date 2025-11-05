# 🛍️ Configuración de Webhooks Shopify - Logiflow

Este documento describe cómo configurar los webhooks de Shopify para cada tienda y sincronizar pedidos automáticamente con el sistema Logiflow.

## 📋 Resumen

Cada tienda Shopify tiene su propio endpoint dedicado con verificación HMAC-SHA256 independiente:

| Tienda | Endpoint Webhook | Variable Env |
|--------|------------------|--------------|
| **Novi** | `/api/webhooks/shopify/novi` | `SHOPIFY_NOVI_*` |
| **Dearel** | `/api/webhooks/shopify/dearel` | `SHOPIFY_DEAREL_*` |
| **Blumi Perú** | `/api/webhooks/shopify/blumi` | `SHOPIFY_BLUMI_*` |
| **NoviPeru** | `/api/webhooks/shopify/noviperu` | `SHOPIFY_NOVIPERU_*` |
| **Cumbre** | `/api/webhooks/shopify/cumbre` | `SHOPIFY_CUMBRE_*` |
| **Trazto** | `/api/webhooks/shopify/trazto` | `SHOPIFY_TRAZTO_*` |

---

## 🔧 Paso 1: Crear Custom App en Shopify

Realiza estos pasos **en cada tienda Shopify**:

### 1.1 Acceder al panel de configuración
1. Entra al Admin de Shopify: `https://{tu-tienda}.myshopify.com/admin`
2. Ve a **Settings** (⚙️) → **Apps and sales channels**
3. Busca la sección **"Develop apps"** o **"App development"**
4. Click en **"Create an app"** o **"Allow custom app development"** (si es primera vez)

### 1.2 Crear la app
1. **App name**: `Logiflow Integration - {Nombre Tienda}` (ej. "Logiflow Integration - Dearel")
2. **App developer**: Tu cuenta/email de administrador

### 1.3 Configurar permisos (Admin API scopes)
1. Click en **"Configure Admin API scopes"**
2. Selecciona los siguientes scopes **read-only** (mínimos requeridos):
   - ✅ `read_orders` — Leer pedidos
   - ✅ `read_customers` — Leer datos del cliente
   - ✅ `read_products` — Leer productos
   - ✅ `read_fulfillments` — Leer estado de envíos
   - ⚠️ `write_webhooks` — (opcional) Solo si quieres gestionar webhooks vía API

3. Click **"Save"**

### 1.4 Instalar la app y obtener credenciales
1. Click en **"Install app"**
2. Shopify te mostrará el **Admin API Access Token** — **cópialo inmediatamente** (solo se muestra una vez)
3. Anota también:
   - **Shop Domain**: `{tu-tienda}.myshopify.com` (está en la URL del admin)
   - **API Version**: usa `2024-10` o `2023-10` (compatible con el código)

---

## 🔐 Paso 2: Configurar Variables de Entorno

### 2.1 Añadir credenciales al archivo `.env`

Para **cada tienda**, añade estas 4 variables al archivo `.env` (o `.env.local` en desarrollo):

```bash
# === TIENDA: NOVI ===
SHOPIFY_NOVI_SHOP_DOMAIN=novi.myshopify.com
SHOPIFY_NOVI_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_NOVI_WEBHOOK_SECRET=                # Se genera al crear el webhook (Paso 3)
SHOPIFY_NOVI_API_VERSION=2024-10

# === TIENDA: DEAREL ===
SHOPIFY_DEAREL_SHOP_DOMAIN=dearel.myshopify.com
SHOPIFY_DEAREL_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_DEAREL_WEBHOOK_SECRET=              # Se genera al crear el webhook (Paso 3)
SHOPIFY_DEAREL_API_VERSION=2024-10

# === TIENDA: BLUMI PERÚ ===
SHOPIFY_BLUMI_SHOP_DOMAIN=blumi-peru.myshopify.com
SHOPIFY_BLUMI_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_BLUMI_WEBHOOK_SECRET=               # Se genera al crear el webhook (Paso 3)
SHOPIFY_BLUMI_API_VERSION=2024-10

# === TIENDA: NOVIPERU ===
SHOPIFY_NOVIPERU_SHOP_DOMAIN=noviperu.myshopify.com
SHOPIFY_NOVIPERU_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_NOVIPERU_WEBHOOK_SECRET=            # Se genera al crear el webhook (Paso 3)
SHOPIFY_NOVIPERU_API_VERSION=2024-10

# === TIENDA: CUMBRE ===
SHOPIFY_CUMBRE_SHOP_DOMAIN=cumbre.myshopify.com
SHOPIFY_CUMBRE_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_CUMBRE_WEBHOOK_SECRET=              # Se genera al crear el webhook (Paso 3)
SHOPIFY_CUMBRE_API_VERSION=2024-10

# === TIENDA: TRAZTO ===
SHOPIFY_TRAZTO_SHOP_DOMAIN=trazto.myshopify.com
SHOPIFY_TRAZTO_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_TRAZTO_WEBHOOK_SECRET=              # Se genera al crear el webhook (Paso 3)
SHOPIFY_TRAZTO_API_VERSION=2024-10
```

### ⚠️ Importante - Seguridad
- **NUNCA subas el archivo `.env` a GitHub** (ya está en `.gitignore`)
- En producción, usa **secrets** de tu plataforma:
  - Vercel: Settings → Environment Variables
  - Cloud Run: Secrets Manager
  - Railway/Render: Environment Variables

---

## 🔔 Paso 3: Crear Webhooks en Shopify

Para **cada tienda**, configura los webhooks siguiendo estos pasos:

### 3.1 Acceder a la sección de Webhooks
**Opción A** - Desde la Custom App:
1. En Shopify Admin → Settings → Apps and sales channels
2. Click en la app "Logiflow Integration - {Tienda}"
3. Click en **"API credentials"** o **"Configuration"**
4. Busca la sección **"Webhooks"** → Click **"Create webhook"**

**Opción B** - Desde Settings:
1. En Shopify Admin → Settings → **Notifications**
2. Scroll hasta la sección **"Webhooks"**
3. Click **"Create webhook"**

### 3.2 Configurar cada webhook

Crea **4 webhooks separados** con la siguiente configuración:

#### Webhook 1: Orders Create
- **Event**: `orders/create`
- **Format**: `JSON`
- **URL**: `https://TU-DOMINIO.com/api/webhooks/shopify/{tienda}`
  - Ejemplo Novi: `https://api.logiflow.com/api/webhooks/shopify/novi`
  - Ejemplo Dearel: `https://api.logiflow.com/api/webhooks/shopify/dearel`
- **API version**: `2024-10` (o la que configuraste en `.env`)

#### Webhook 2: Orders Updated
- **Event**: `orders/updated`
- **Format**: `JSON`
- **URL**: `https://TU-DOMINIO.com/api/webhooks/shopify/{tienda}`

#### Webhook 3: Orders Paid
- **Event**: `orders/paid`
- **Format**: `JSON`
- **URL**: `https://TU-DOMINIO.com/api/webhooks/shopify/{tienda}`

#### Webhook 4: Fulfillments Create
- **Event**: `fulfillments/create`
- **Format**: `JSON`
- **URL**: `https://TU-DOMINIO.com/api/webhooks/shopify/{tienda}`

### 3.3 Copiar el Webhook Secret

⚠️ **IMPORTANTE**: Después de crear cada webhook:

1. Shopify NO muestra explícitamente un "Webhook Secret" en la UI moderna
2. El secret se **genera automáticamente** y se usa en el header `X-Shopify-Hmac-Sha256`
3. Para obtenerlo, tienes 2 opciones:

**Opción A - Usar la API de Shopify** (recomendado):
```bash
# PowerShell
$domain = "TU-TIENDA.myshopify.com"
$token = "shpat_tu_access_token"
$headers = @{
    "X-Shopify-Access-Token" = $token
}
Invoke-RestMethod -Uri "https://$domain/admin/api/2024-10/webhooks.json" -Headers $headers
```
El campo `api_client_id` o la respuesta completa te dará información para verificar.

**Opción B - Dejar vacío y usar modo dev**:
En desarrollo local, puedes comentar temporalmente la validación HMAC para probar (NO en producción).

**Opción C - Usar Shopify CLI** (si tienes instalado):
```bash
shopify webhook list
```

Por ahora, **deja `WEBHOOK_SECRET` vacío** en `.env` si no lo encuentras — el sistema lo logeará cuando reciba el primer webhook real.

---

## 🧪 Paso 4: Probar los Webhooks en Local (con ngrok)

### 4.1 Instalar ngrok
```bash
# PowerShell (con chocolatey)
choco install ngrok

# O descarga desde: https://ngrok.com/download
```

### 4.2 Exponer tu localhost
```bash
# Asumiendo que tu app corre en puerto 3000
ngrok http 3000
```

Obtendrás una URL pública como:
```
https://abc123.ngrok.io
```

### 4.3 Actualizar URL de webhooks temporalmente
En Shopify Admin:
1. Ve a Settings → Notifications → Webhooks
2. Edita cada webhook
3. Cambia la URL a: `https://abc123.ngrok.io/api/webhooks/shopify/{tienda}`
4. Guarda

### 4.4 Crear un pedido de prueba
1. En Shopify Admin → Orders → **Create order**
2. Añade un producto, cliente y dirección de prueba
3. Click **"Create order"**
4. Shopify enviará el webhook automáticamente

### 4.5 Verificar en logs
En tu terminal/consola deberías ver:
```
[Dearel] Webhook received
[Dearel] ✅ Webhook signature verified
[Dearel] ✅ Lead saved to shopify_leads: 12345678901
```

### 4.6 Verificar en Firestore
1. Abre Firebase Console → Firestore Database
2. Busca la colección `shopify_leads`
3. Debe haber un documento con ID = `shopify_order_id` del pedido

### 4.7 Verificar en la UI
1. Abre tu app: `http://localhost:3000`
2. Ve a **Call Center Queue**
3. El pedido de Shopify debe aparecer en la tabla con:
   - ✅ Tienda origen correcta
   - ✅ Productos mapeados
   - ✅ Datos del cliente

---

## 🔐 Paso 5: Verificación de Seguridad (HMAC)

El sistema **ya implementa verificación HMAC-SHA256** automáticamente:

### Cómo funciona
1. Shopify envía el header `X-Shopify-Hmac-Sha256` con cada webhook
2. Nuestro endpoint lee el `rawBody` (sin parsear)
3. Calcula HMAC usando `SHOPIFY_{TIENDA}_WEBHOOK_SECRET`
4. Compara con `crypto.timingSafeEqual()` (seguro contra timing attacks)
5. Si NO coincide → rechaza con `401 Unauthorized`

### Código relevante
```typescript
// En cada endpoint: /api/webhooks/shopify/{tienda}/route.ts
const rawBody = await request.text();
const signature = request.headers.get('x-shopify-hmac-sha256') || '';

const isValid = verifyShopifyWebhook(rawBody, signature, storeName);
if (!isValid) {
    return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
}
```

### Obtener el Webhook Secret real
Si necesitas el secret exacto (para producción):

**Método 1 - API Admin de Shopify**:
```bash
# PowerShell
$domain = "dearel.myshopify.com"
$token = "shpat_tu_access_token"
$headers = @{ "X-Shopify-Access-Token" = $token }

$response = Invoke-RestMethod -Uri "https://$domain/admin/api/2024-10/webhooks.json" -Headers $headers
$response.webhooks | Select-Object id, address, topic
```

Shopify no expone el secret directamente, pero puedes:
1. Crear un webhook vía API especificando el secret
2. O usar el mismo secret para todos los webhooks de una app

**Método 2 - Generar tu propio secret**:
```powershell
# PowerShell - Generar secret aleatorio seguro
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$secret = [Convert]::ToBase64String($bytes)
Write-Output $secret
```

Luego configúralo en Shopify vía API al crear webhooks.

---

## 📊 Paso 6: URLs de Webhook por Tienda

### Development (con ngrok)
```
https://abc123.ngrok.io/api/webhooks/shopify/novi
https://abc123.ngrok.io/api/webhooks/shopify/dearel
https://abc123.ngrok.io/api/webhooks/shopify/blumi
https://abc123.ngrok.io/api/webhooks/shopify/noviperu
https://abc123.ngrok.io/api/webhooks/shopify/cumbre
https://abc123.ngrok.io/api/webhooks/shopify/trazto
```

### Production
```
https://api.logiflow.com/api/webhooks/shopify/novi
https://api.logiflow.com/api/webhooks/shopify/dearel
https://api.logiflow.com/api/webhooks/shopify/blumi
https://api.logiflow.com/api/webhooks/shopify/noviperu
https://api.logiflow.com/api/webhooks/shopify/cumbre
https://api.logiflow.com/api/webhooks/shopify/trazto
```

---

## 🐛 Troubleshooting

### Problema: Webhook devuelve 401 Unauthorized
**Causa**: HMAC signature no coincide
**Solución**:
1. Verifica que `SHOPIFY_{TIENDA}_WEBHOOK_SECRET` esté configurado
2. Confirma que la URL del webhook sea exacta (sin trailing slash)
3. Revisa los logs del servidor para ver el error exacto

### Problema: Webhook devuelve 500 Internal Server Error
**Causa**: Error al guardar en Firestore o credenciales Firebase incorrectas
**Solución**:
1. Verifica que `FIREBASE_SERVICE_ACCOUNT` esté configurado
2. Revisa logs del servidor: `console.error` mostrará el stack trace
3. Confirma permisos de Firestore (reglas de seguridad)

### Problema: El pedido no aparece en la UI
**Causa**: Listener de Firestore no conectado o caché desactualizado
**Solución**:
1. Refresca la página (F5)
2. Click en "Limpiar Caché" en Call Center Queue
3. Verifica en Firebase Console que el documento existe en `shopify_leads`

### Problema: "Could not verify webhook signature" en logs
**Causa**: Webhook secret incorrecto o vacío
**Solución temporal (solo development)**:
1. Comenta temporalmente la validación HMAC
2. Prueba que el resto del flujo funcione
3. **NUNCA deploys sin validación HMAC en producción**

---

## ✅ Checklist Final

Por cada tienda, verifica:

- [ ] Custom App creada en Shopify con scopes correctos
- [ ] Access Token copiado y guardado en `.env`
- [ ] Shop Domain configurado en `.env`
- [ ] Webhook Secret configurado (o proceso de obtención en marcha)
- [ ] 4 webhooks creados: orders/create, orders/updated, orders/paid, fulfillments/create
- [ ] URL del webhook apunta al endpoint correcto: `/api/webhooks/shopify/{tienda}`
- [ ] Prueba con ngrok exitosa: pedido de prueba recibido y guardado
- [ ] Verificación HMAC funcionando (sin errores 401)
- [ ] Pedido visible en Call Center Queue UI
- [ ] Datos mapeados correctamente: tienda, cliente, productos

---

## 🚀 Próximos Pasos

1. **Sincronizar pedidos históricos** (opcional):
   - Crear script que use `shopifyApiRequest` para importar pedidos pasados
   - Ver sección de sincronización en documentación principal

2. **Configurar alertas y monitoreo**:
   - Sentry para errores de webhook
   - Logs estructurados para auditoría
   - Métricas de latencia y tasa de éxito

3. **Rotación de credenciales**:
   - Plan de rotación cada 90 días
   - Documentar proceso y responsables

4. **Webhooks adicionales** (según necesidad):
   - `orders/cancelled` - Para manejar cancelaciones
   - `fulfillments/update` - Para tracking de envíos
   - `refunds/create` - Para devoluciones

---

## 📞 Soporte

Si necesitas ayuda:
1. Revisa los logs del servidor para errores específicos
2. Consulta la documentación de Shopify: https://shopify.dev/docs/api/admin-rest/webhooks
3. Verifica la configuración de Firebase y variables de entorno

---

**Última actualización**: 4 de noviembre de 2025
**Versión**: 1.0.0
