# Reporte Técnico Completo - Integración Kommo CRM

**Fecha:** 13 de noviembre de 2025  
**Proyecto:** LogiFlow - Sistema de Gestión de Pedidos  
**Versión de la Integración:** 1.0  

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de la Integración](#arquitectura-de-la-integración)
3. [Componentes Implementados](#componentes-implementados)
4. [Variables de Entorno](#variables-de-entorno)
5. [Funciones y APIs Disponibles](#funciones-y-apis-disponibles)
6. [Flujos de Datos](#flujos-de-datos)
7. [Endpoints Implementados](#endpoints-implementados)
8. [Tipos y Estructuras de Datos](#tipos-y-estructuras-de-datos)
9. [Mapeo de Campos](#mapeo-de-campos)
10. [Funcionalidades Actuales](#funcionalidades-actuales)
11. [Limitaciones y Faltantes](#limitaciones-y-faltantes)
12. [Recomendaciones Técnicas](#recomendaciones-técnicas)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen Ejecutivo

### Estado Actual
La integración con Kommo CRM está **PARCIALMENTE IMPLEMENTADA** con las siguientes características:

✅ **Implementado:**
- Cliente API para comunicación con Kommo
- Sistema de gestión de tokens (access token de larga duración)
- Endpoint para actualizar leads desde LogiFlow
- Búsqueda de leads por Shopify Order ID
- Mapeo de campos personalizados de pedidos a Kommo
- Cambio automático de estado del lead en Kommo

❌ **NO Implementado:**
- Endpoint para recibir webhooks desde Kommo (`/api/data-ingestion` mencionado en docs pero NO existe en código)
- Sincronización bidireccional automática
- Creación de leads desde LogiFlow
- Gestión de contactos
- Gestión de notas/tareas
- Sistema de notificaciones de eventos Kommo
- Refresh automático de tokens (solo hay lógica pero sin refresh_token activo)

### Propósito
Actualizar leads en Kommo CRM cuando se confirma un pedido en LogiFlow, permitiendo la trazabilidad completa del proceso de ventas.

---

## 🏗️ Arquitectura de la Integración

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIFLOW APP                             │
│                                                                   │
│  ┌──────────────────┐                                            │
│  │  Create Order    │                                            │
│  │  Form Component  │                                            │
│  └────────┬─────────┘                                            │
│           │                                                       │
│           │ 1. Submit Order                                      │
│           │                                                       │
│           v                                                       │
│  ┌──────────────────┐                                            │
│  │   Save to        │                                            │
│  │   Firestore      │                                            │
│  └────────┬─────────┘                                            │
│           │                                                       │
│           │ 2. POST /api/kommo/update-lead                       │
│           │                                                       │
│           v                                                       │
│  ┌──────────────────────────────────┐                            │
│  │  /api/kommo/update-lead          │                            │
│  │  - Busca lead_id si falta        │                            │
│  │  - Mapea campos del pedido       │                            │
│  │  - Llama a updateLead()          │                            │
│  └────────┬─────────────────────────┘                            │
│           │                                                       │
└───────────┼───────────────────────────────────────────────────────┘
            │
            │ 3. PATCH /api/v4/leads
            v
┌─────────────────────────────────────────────────────────────────┐
│                      KOMMO CRM API                               │
│                                                                   │
│  - Actualiza campos personalizados                               │
│  - Cambia status_id a "Venta Confirmada"                         │
│  - Añade tag "Venta Confirmada LogiFlow"                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo NO Implementado (Mencionado en Docs)

```
┌─────────────────────────────────────────────────────────────────┐
│                      KOMMO CRM                                   │
│                                                                   │
│  Usuario actualiza lead → Webhook trigger                        │
│                                                                   │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ Webhook POST (NO IMPLEMENTADO)
         │
         v
┌─────────────────────────────────────────────────────────────────┐
│              /api/data-ingestion (NO EXISTE)                     │
│                                                                   │
│  - Recibiría evento de Kommo                                     │
│  - Llamaría a getLeadDetails() y getContactDetails()             │
│  - Actualizaría Firestore con datos de Kommo                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**IMPORTANTE:** El endpoint `/api/data-ingestion` está mencionado extensamente en `docs/KOMMO_INTEGRATION.md` pero **NO EXISTE** en el código actual. Esta es una funcionalidad pendiente de implementar.

---

## 🔧 Componentes Implementados

### 1. Cliente API Kommo (`src/lib/kommo.ts`)

**Ubicación:** `i:\Documentos\DESARROLLO\APLICACIONES EMPRESARIALES\logiflow\src\lib\kommo.ts`

**Propósito:** Módulo server-side para interactuar con la API de Kommo CRM.

#### Funciones Internas

##### `getAccessToken()`
```typescript
async function getAccessToken(): Promise<string | null>
```

**Descripción:**
- Obtiene y gestiona el access token para autenticación con Kommo
- Implementa lógica de refresh (pero no está activa porque KOMMO_REFRESH_TOKEN está vacío)
- Mantiene token en memoria durante la ejecución del servidor

**Flujo:**
1. Verifica variables de entorno (SUBDOMAIN, INTEGRATION_ID, SECRET_KEY)
2. Inicializa token desde `KOMMO_ACCESS_TOKEN` si no existe en memoria
3. Verifica expiración (con buffer de 5 minutos)
4. Si está expirado Y hay refresh_token, intenta renovar
5. Retorna access token válido o null

**Limitación Actual:**
- El `KOMMO_REFRESH_TOKEN` está vacío en `.env`, por lo que usa un token de larga duración (1 año)
- Si el token expira, la integración dejará de funcionar hasta actualizar manualmente el token

##### `kommoApiRequest<T>()`
```typescript
async function kommoApiRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PATCH' = 'GET', 
  body: any = null
): Promise<T | null>
```

**Descripción:**
- Función genérica para hacer llamadas a la API de Kommo
- Maneja autenticación automática
- Construye URL completa: `https://{SUBDOMAIN}.kommo.com/api/v4/{endpoint}`
- Retorna respuesta parseada como JSON o null en caso de error

**Características:**
- Headers automáticos: Authorization Bearer token + Content-Type JSON
- Logging de errores detallado
- Manejo de errores HTTP

#### Funciones Exportadas

##### `getLeadDetails(leadId: string)`
```typescript
export async function getLeadDetails(leadId: string): Promise<any | null>
```

**Descripción:** Obtiene detalles completos de un lead específico, incluyendo contactos asociados.

**Endpoint Kommo:** `GET /api/v4/leads/{leadId}?with=contacts`

**Uso Actual:** ❌ NO SE USA en el código actual (función disponible pero no utilizada)

**Ejemplo de Respuesta:**
```json
{
  "id": 123456,
  "name": "#1234 - Juan Pérez",
  "price": 350,
  "status_id": 79547911,
  "_embedded": {
    "contacts": [
      {
        "id": 654321,
        "name": "Juan Pérez"
      }
    ]
  },
  "custom_fields_values": [...]
}
```

##### `getContactDetails(contactId: number)`
```typescript
export async function getContactDetails(contactId: number): Promise<any | null>
```

**Descripción:** Obtiene detalles completos de un contacto, incluyendo leads asociados.

**Endpoint Kommo:** `GET /api/v4/contacts/{contactId}?with=leads`

**Uso Actual:** ❌ NO SE USA en el código actual

##### `updateLead(leadId: string, data: any)`
```typescript
export async function updateLead(leadId: string, data: any): Promise<any | null>
```

**Descripción:** Actualiza un lead existente en Kommo.

**Endpoint Kommo:** `PATCH /api/v4/leads`

**Uso Actual:** ✅ USADO en `/api/kommo/update-lead/route.ts`

**Particularidad:** La API de Kommo espera un **array** de leads en el body, incluso para actualizar uno solo:
```json
[
  {
    "id": 123456,
    "price": 350,
    "status_id": 79547911,
    "custom_fields_values": [...]
  }
]
```

##### `searchLeads(query: string)`
```typescript
export async function searchLeads(query: string): Promise<any | null>
```

**Descripción:** Busca leads por texto (nombre, teléfono, email, etc.).

**Endpoint Kommo:** `GET /api/v4/leads?query={query}`

**Uso Actual:** ✅ USADO en `/api/kommo/update-lead/route.ts` para buscar lead por Shopify Order ID cuando `kommo_lead_id` no está disponible.

**Ejemplo de Uso:**
```typescript
const result = await searchLeads("#1234"); // Busca lead con nombre que incluya "#1234"
```

---

### 2. Endpoint de Actualización (`src/app/api/kommo/update-lead/route.ts`)

**Ubicación:** `i:\Documentos\DESARROLLO\APLICACIONES EMPRESARIALES\logiflow\src\app\api\kommo\update-lead\route.ts`

**Método:** `POST`

**Propósito:** Actualizar un lead en Kommo cuando se confirma un pedido en LogiFlow.

#### Input Esperado

```typescript
{
  "order": Order // Ver tipo Order en sección de Tipos
}
```

#### Flujo de Procesamiento

1. **Validación del Request**
   - Verifica que `order` esté presente en el body
   - Log: `[LOGIFLOW_DEBUG] Received order payload: {...}`

2. **Identificación del Lead**
   - **Opción A:** Si `order.kommo_lead_id` existe → usa ese ID
   - **Opción B:** Si NO existe pero SÍ `order.shopify_order_id`:
     - Construye query de búsqueda: `#${order.shopify_order_id}`
     - Llama a `searchLeads(query)`
     - Busca lead que incluya el query en su nombre
     - Si encuentra → asigna `leadIdToUpdate`
     - Si NO encuentra → retorna 404

3. **Mapeo de Campos**
   - Construye array `custom_fields_values` con los datos del pedido
   - Filtra campos sin valor (undefined/null)

4. **Construcción del Payload**
   ```typescript
   {
     id: parseInt(leadIdToUpdate, 10),
     price: order.pago.monto_total,
     status_id: KOMMO_STATUS_ID_VENTA_CONFIRMADA, // 79547911
     custom_fields_values: [...],
     _embedded: {
       tags: [{ name: "Venta Confirmada LogiFlow" }]
     }
   }
   ```

5. **Actualización en Kommo**
   - Llama a `updateLead(leadIdToUpdate, updatePayload)`
   - Retorna resultado o error

#### Constantes de Configuración

```typescript
const KOMMO_FIELD_IDS = {
  PEDIDO: 985570,           // ID del pedido en LogiFlow
  DIRECCION: 630092,        // Dirección de envío
  PRODUCTO: 630096,         // Lista de productos
  TIENDA: 1002512,          // Nombre de la tienda
  PROVINCIA: 630094,        // Provincia de envío
  COURIER: 630104,          // Empresa de courier
  MONTO_PENDIENTE: 1002220, // Monto pendiente de pago
  NOTA: 630108,             // Nota del pedido
  LINK_SHALOM: 1002224,     // Link de seguimiento
  BOLETA_SHALOM: 1002226,   // Número de guía
};

const KOMMO_STATUS_ID_VENTA_CONFIRMADA = 79547911;
```

**⚠️ IMPORTANTE:** Estos IDs son específicos de tu cuenta de Kommo y pueden cambiar si:
- Se eliminan y recrean campos personalizados
- Se cambia de cuenta/workspace de Kommo
- Se modifican pipelines

#### Respuestas del Endpoint

**Success (200):**
```json
{
  "success": true,
  "message": "Lead updated in Kommo.",
  "data": { /* respuesta de Kommo */ }
}
```

**Lead Not Found (404):**
```json
{
  "success": false,
  "message": "Could not find a Kommo lead for Shopify order #1234."
}
```

**Missing Data (400):**
```json
{
  "success": false,
  "message": "Lead ID is missing and could not be found."
}
```

**Error (500):**
```json
{
  "success": false,
  "message": "Failed to update lead in Kommo."
}
```

#### Integración con Create Order Form

**Ubicación del Llamado:** `src/app/(dashboard)/create-order/components/create-order-form.tsx`

**Líneas relevantes:**
```typescript
// Línea ~416
if (isDevMode) console.log('DEV MODE: Attempting to call /api/kommo/update-lead...');

const response = await fetch(`/api/kommo/update-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: newOrder })
});

if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || 'Unknown error from /api/kommo/update-lead');
}
```

**Momento de Ejecución:** Inmediatamente después de guardar el pedido en Firestore.

---

## 🔐 Variables de Entorno

### Variables Necesarias

```bash
# Kommo CRM Integration (use .env or your secrets manager)
KOMMO_SUBDOMAIN=your-kommo-subdomain
KOMMO_ACCESS_TOKEN=your-kommo-access-token
KOMMO_REFRESH_TOKEN=
KOMMO_INTEGRATION_ID=your-kommo-integration-id
KOMMO_SECRET_KEY=your-kommo-secret-key
```

### Descripción de Cada Variable

| Variable | Requerida | Descripción | Valor Actual |
|----------|-----------|-------------|--------------|
| `KOMMO_SUBDOMAIN` | ✅ Sí | Subdominio de tu cuenta Kommo (ej: `tuempresa` en `tuempresa.kommo.com`) | `blumiperu0102` |
| `KOMMO_ACCESS_TOKEN` | ✅ Sí | Token de acceso OAuth 2.0 de larga duración. **Expira:** 2030-06-01 | Configurado ✅ |
| `KOMMO_REFRESH_TOKEN` | ⚠️ Recomendado | Token para renovar el access token cuando expire | ❌ VACÍO |
| `KOMMO_INTEGRATION_ID` | ✅ Sí | ID de tu integración OAuth en Kommo | Configurado ✅ |
| `KOMMO_SECRET_KEY` | ✅ Sí | Clave secreta de la integración OAuth | Configurado ✅ |

### ⚠️ Riesgos de Seguridad

**CRÍTICO:** Todas las credenciales de Kommo están expuestas en el archivo `.env` del repositorio.

**Recomendaciones:**
1. ❌ **NUNCA** commitear `.env` al repositorio Git
2. ✅ Verificar que `.env` está en `.gitignore`
3. ✅ Usar variables de entorno del sistema o secretos de Vercel/plataforma de deploy
4. ✅ Rotar tokens periódicamente
5. ✅ Obtener un `REFRESH_TOKEN` para no depender de un token de larga duración

### Cómo Obtener las Credenciales

#### 1. Acceder al Panel de Kommo
```
https://blumiperu0102.kommo.com/settings/profile/
```

#### 2. Crear o Acceder a tu Integración
- Ir a: **Settings → Integrations → My Integrations**
- Crear nueva integración o editar existente
- Tipo: **Private Application** (para uso interno)

#### 3. Configurar OAuth 2.0
- **Scopes necesarios:**
  - `crm` (gestión de leads, contactos, empresas)
  - `files` (opcional, si necesitas adjuntar archivos)
  - `notifications` (opcional, para webhooks)
  - `push_notifications` (opcional)

#### 4. Obtener Tokens
- **Access Token:** Generado al autorizar la integración
- **Refresh Token:** Generado solo si la integración tiene refresh habilitado
- **Integration ID:** Visible en el panel de la integración
- **Secret Key:** Visible en el panel de la integración

---

## 🔌 Funciones y APIs Disponibles

### Módulo `src/lib/kommo.ts`

| Función | Parámetros | Retorno | Estado | Descripción |
|---------|-----------|---------|--------|-------------|
| `getLeadDetails()` | `leadId: string` | `Promise<any \| null>` | ✅ Implementada<br>❌ No usada | Obtiene detalles completos de un lead con contactos |
| `getContactDetails()` | `contactId: number` | `Promise<any \| null>` | ✅ Implementada<br>❌ No usada | Obtiene detalles de un contacto con leads |
| `updateLead()` | `leadId: string`<br>`data: any` | `Promise<any \| null>` | ✅ Implementada<br>✅ Usada | Actualiza un lead en Kommo |
| `searchLeads()` | `query: string` | `Promise<any \| null>` | ✅ Implementada<br>✅ Usada | Busca leads por texto |

### Endpoints API

| Endpoint | Método | Estado | Descripción |
|----------|--------|--------|-------------|
| `/api/kommo/update-lead` | POST | ✅ Implementado<br>✅ Funcional | Actualiza lead en Kommo al confirmar pedido |
| `/api/data-ingestion` | POST | ❌ NO EXISTE<br>(mencionado en docs) | Recibiría webhooks de Kommo |

---

## 📊 Flujos de Datos

### Flujo 1: LogiFlow → Kommo (Implementado)

**Trigger:** Usuario confirma pedido en formulario de Create Order

**Secuencia:**
```
1. Usuario llena formulario de pedido
   ↓
2. Click en "Guardar Pedido"
   ↓
3. Validación del formulario (React Hook Form + Zod)
   ↓
4. Guardar pedido en Firestore
   ↓
5. POST /api/kommo/update-lead con payload del pedido
   ↓
6. Endpoint identifica lead_id (directo o por búsqueda)
   ↓
7. Mapeo de campos del pedido a estructura de Kommo
   ↓
8. PATCH /api/v4/leads en Kommo API
   ↓
9. Kommo actualiza lead:
   - Campos personalizados
   - Presupuesto (price)
   - Status → "Venta Confirmada"
   - Tag → "Venta Confirmada LogiFlow"
   ↓
10. Respuesta a usuario (toast notification)
```

**Datos Sincronizados:**
- ID del pedido
- Dirección de envío
- Productos y cantidades
- Tienda
- Provincia
- Courier
- Monto total
- Monto pendiente
- Notas del pedido
- Link de seguimiento
- Número de guía

### Flujo 2: Kommo → LogiFlow (NO Implementado)

**Trigger Esperado:** Usuario modifica lead en Kommo

**Secuencia Teórica (según docs):**
```
1. Usuario mueve lead a etapa "Para Llamar" en Kommo
   ↓
2. Kommo dispara webhook → POST /api/data-ingestion
   ↓
3. Endpoint recibe notificación básica
   ↓
4. GET /api/v4/leads/{id} para datos completos
   ↓
5. GET /api/v4/contacts/{id} para datos del contacto
   ↓
6. Buscar en Firestore si lead ya existe
   ↓
7. Si existe: UPDATE
   Si no: CREATE nuevo lead en Firestore
   ↓
8. Lead aparece en Call Center Queue
```

**Estado:** ❌ COMPLETAMENTE NO IMPLEMENTADO

---

## 🌐 Endpoints Implementados

### POST `/api/kommo/update-lead`

**Archivo:** `src/app/api/kommo/update-lead/route.ts`

**Headers Requeridos:**
```
Content-Type: application/json
```

**Body Esperado:**
```typescript
{
  "order": {
    "id_pedido": "ORD-2024-001",
    "kommo_lead_id": "123456", // Opcional si hay shopify_order_id
    "shopify_order_id": "9999", // Opcional si hay kommo_lead_id
    "pago": {
      "monto_total": 350.00,
      "monto_pendiente": 0.00
    },
    "envio": {
      "direccion": "Av. Principal 123",
      "provincia": "Lima",
      "courier": "Shalom",
      "link_seguimiento": "https://tracking.com/123",
      "nro_guia": "SHLM-123456"
    },
    "items": [
      {
        "nombre": "Producto A",
        "cantidad": 2
      }
    ],
    "tienda": {
      "nombre": "Blumi"
    },
    "notas": {
      "nota_pedido": "Cliente prefiere entrega por la tarde"
    }
  }
}
```

**Respuesta Success (200):**
```json
{
  "success": true,
  "message": "Lead updated in Kommo.",
  "data": {
    "_embedded": {
      "leads": [
        {
          "id": 123456,
          "name": "#9999 - Juan Pérez",
          "updated_at": 1699900000
        }
      ]
    }
  }
}
```

**Respuesta Error (404):**
```json
{
  "success": false,
  "message": "Could not find a Kommo lead for Shopify order #9999."
}
```

**Ejemplo de Llamada con PowerShell:**
```powershell
$body = @{
    order = @{
        id_pedido = "ORD-TEST-001"
        kommo_lead_id = "123456"
        pago = @{
            monto_total = 350.00
            monto_pendiente = 0.00
        }
        envio = @{
            direccion = "Av. Test 123"
            provincia = "Lima"
            courier = "Shalom"
            link_seguimiento = "https://example.com"
            nro_guia = "SHLM-TEST"
        }
        items = @(
            @{
                nombre = "Producto Test"
                cantidad = 1
            }
        )
        tienda = @{
            nombre = "Blumi"
        }
        notas = @{
            nota_pedido = "Nota de prueba"
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Post -Uri "http://localhost:9002/api/kommo/update-lead" -Body $body -ContentType "application/json"
```

---

## 📝 Tipos y Estructuras de Datos

### Tipo `Order` (Relevante para Kommo)

**Ubicación:** `src/lib/types.ts` (líneas ~60-88)

```typescript
export interface Order {
  // Identificadores
  id_pedido: string;
  kommo_lead_id?: string;       // ID del lead en Kommo
  shopify_order_id?: string;    // ID del pedido en Shopify
  
  // Origen
  source: 'shopify' | 'kommo' | 'manual';
  
  // Cliente
  cliente: {
    uid_cliente: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string;
    dni: string;
  };
  
  // Pago
  pago: {
    metodo_pago: string;
    monto_pagado: number;
    monto_pendiente: number;
    monto_total: number;
  };
  
  // Envío
  envio: {
    direccion: string;
    distrito: string;
    provincia: string;
    departamento: string;
    referencia: string;
    courier: string;
    fecha_envio: string | null;
    fecha_entrega: string | null;
    estado_envio: string;
    link_seguimiento: string;
    nro_guia: string;
    costo_envio: number;
  };
  
  // Tienda
  tienda: {
    id_tienda: string;
    nombre: string;
  };
  
  // Items
  items: {
    sku: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
  
  // Notas
  notas: {
    nota_pedido: string;
    observaciones_internas: string;
    motivo_anulacion: string | null;
  };
  
  // Metadata
  fecha_pedido: string;
  fecha_actualizacion: string;
  estado_pedido: string;
  usuario_registro: string;
}
```

### Tipo `ShopifyLead` (Relevante para Kommo)

**Ubicación:** `src/lib/types.ts` (líneas ~180-220)

```typescript
export interface ShopifyLead {
  // Identificadores
  id: string; // Shopify Order ID
  kommo_lead_id?: string;
  kommo_contact_id?: number;
  
  // Origen
  source: 'kommo' | 'manual' | 'shopify';
  tienda: string; // 'Blumi', 'Novi', 'Dearel', etc.
  
  // Cliente
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  
  // Dirección
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  pais: string;
  
  // Pedido
  producto: string;
  notas_agente: string;
  call_status: CallStatus; // 'PENDIENTE' | 'EN_PROCESO' | 'VISTO' | 'NO_CONTESTA' | ...
  
  // Kommo Specific
  etapa_kommo?: string; // ej: "Llamada inicial"
  
  // Shopify Specific
  shopify_order_number: string;
  shopify_items: { name: string; quantity: number; price: string }[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}
```

---

## 🗺️ Mapeo de Campos

### LogiFlow Order → Kommo Lead

| Campo en LogiFlow | Campo en Kommo | Field ID | Tipo | Notas |
|-------------------|----------------|----------|------|-------|
| `id_pedido` | `PEDIDO` (custom) | 985570 | Text | ID único del pedido en LogiFlow |
| `envio.direccion` | `DIRECCION` (custom) | 630092 | Text | Dirección completa de envío |
| `items[].nombre` + `cantidad` | `PRODUCTO` (custom) | 630096 | Text | Concatenado: "2x Producto A, 1x Producto B" |
| `tienda.nombre` | `TIENDA` (custom) | 1002512 | Text | Nombre de la tienda (Blumi, Novi, etc.) |
| `envio.provincia` | `PROVINCIA` (custom) | 630094 | Text | Provincia de envío |
| `envio.courier` | `COURIER` (custom) | 630104 | Text | Empresa de courier |
| `pago.monto_pendiente` | `MONTO PENDIENTE` (custom) | 1002220 | Numeric | Monto pendiente de pago |
| `notas.nota_pedido` | `NOTA` (custom) | 630108 | Textarea | Notas del pedido |
| `envio.link_seguimiento` | `LINK SHALOM` (custom) | 1002224 | URL | Link de seguimiento |
| `envio.nro_guia` | `BOLETA SHALOM` (custom) | 1002226 | Text | Número de guía de envío |
| `pago.monto_total` | `Presupuesto` (price) | - | Numeric | Campo estándar de Kommo |
| - | `Status` (status_id) | 79547911 | Select | Cambia a "Venta Confirmada" |
| - | `Tag` | - | Tag | Añade "Venta Confirmada LogiFlow" |

### ⚠️ Importante: Verificación de Field IDs

**Los Field IDs son específicos de tu cuenta de Kommo.** Para verificar o actualizar:

1. Acceder a Kommo → Settings → Customization → Lead Fields
2. Editar cada campo personalizado
3. En la URL verás el ID: `https://blumiperu0102.kommo.com/settings/widgets/edit/lead/{FIELD_ID}`
4. Actualizar constantes en `src/app/api/kommo/update-lead/route.ts` si es necesario

---

## ✅ Funcionalidades Actuales

### 1. Actualización de Leads (LogiFlow → Kommo)

**Estado:** ✅ FUNCIONAL

**Descripción:** Cuando un agente confirma un pedido en LogiFlow, el sistema automáticamente actualiza el lead correspondiente en Kommo con todos los detalles del pedido.

**Características:**
- ✅ Busca lead por `kommo_lead_id` directo
- ✅ Busca lead por `shopify_order_id` si no hay `kommo_lead_id`
- ✅ Mapea 10 campos personalizados
- ✅ Actualiza presupuesto (price)
- ✅ Cambia status a "Venta Confirmada"
- ✅ Añade tag identificador
- ✅ Logging detallado para debugging

**Casos de Uso:**
- Pedidos originados en Shopify que tienen lead en Kommo
- Pedidos manuales que tienen lead en Kommo

### 2. Búsqueda de Leads

**Estado:** ✅ FUNCIONAL

**Descripción:** Capacidad de buscar leads en Kommo por texto (nombre, teléfono, email, ID de orden).

**Uso Actual:**
- Búsqueda de leads por Shopify Order ID cuando no se tiene `kommo_lead_id`

**Potencial No Explotado:**
- Búsqueda por teléfono del cliente
- Búsqueda por email
- Búsqueda por nombre completo

### 3. Gestión de Tokens

**Estado:** ⚠️ PARCIALMENTE FUNCIONAL

**Descripción:** Sistema de autenticación con Kommo usando OAuth 2.0.

**Características:**
- ✅ Almacenamiento de token en memoria
- ✅ Lógica de refresh implementada
- ❌ Refresh token no configurado (vacío en .env)
- ⚠️ Depende de token de larga duración que expira en 2030

**Riesgo:** Si el token expira antes de 2030 o es revocado, la integración dejará de funcionar y requerirá intervención manual.

---

## ❌ Limitaciones y Faltantes

### 1. Sincronización Bidireccional

**Estado:** ❌ NO IMPLEMENTADA

**Descripción:** La documentación (`KOMMO_INTEGRATION.md`) describe un flujo completo de sincronización bidireccional, pero actualmente **SOLO funciona LogiFlow → Kommo**.

**Faltante:**
- ❌ Endpoint `/api/data-ingestion` para recibir webhooks de Kommo
- ❌ Lógica para procesar eventos de Kommo
- ❌ Sincronización de actualizaciones de leads desde Kommo
- ❌ Creación automática de leads en LogiFlow desde Kommo

**Impacto:**
- Los cambios hechos en Kommo NO se reflejan en LogiFlow
- Los leads creados en Kommo NO aparecen automáticamente en Call Center Queue
- Hay que actualizar manualmente en ambos lados

### 2. Gestión de Contactos

**Estado:** ❌ NO UTILIZADA

**Descripción:** Aunque existe la función `getContactDetails()`, no se utiliza en ninguna parte del código.

**Faltantes:**
- ❌ Creación de contactos en Kommo
- ❌ Actualización de contactos
- ❌ Sincronización de datos de contactos
- ❌ Asociación de contactos con múltiples leads

### 3. Creación de Leads

**Estado:** ❌ NO IMPLEMENTADA

**Descripción:** No existe funcionalidad para crear leads en Kommo desde LogiFlow.

**Impacto:**
- Solo puede actualizar leads existentes
- Si un cliente nuevo llega por canal manual en LogiFlow, no se crea en Kommo

### 4. Gestión de Notas/Tareas

**Estado:** ❌ NO IMPLEMENTADA

**Descripción:** No hay funciones para crear notas, tareas o recordatorios en Kommo.

**Faltantes:**
- ❌ Crear notas en lead
- ❌ Crear tareas para usuarios
- ❌ Añadir comentarios a conversaciones
- ❌ Programar llamadas de seguimiento

### 5. Webhooks de Kommo

**Estado:** ❌ NO IMPLEMENTADA

**Descripción:** No hay endpoint para recibir notificaciones de eventos de Kommo.

**Faltantes:**
- ❌ Configuración de webhooks en Kommo
- ❌ Endpoint receptor de webhooks
- ❌ Verificación de firma HMAC de webhooks
- ❌ Procesamiento de eventos:
  - `leads.add` (nuevo lead creado)
  - `leads.update` (lead actualizado)
  - `leads.status` (cambio de status/etapa)
  - `leads.delete` (lead eliminado)
  - `notes.add` (nueva nota añadida)

### 6. Manejo de Errores y Reintentos

**Estado:** ⚠️ BÁSICO

**Descripción:** El manejo de errores es simple y no hay sistema de reintentos.

**Limitaciones:**
- ❌ No hay reintentos automáticos si falla la llamada a Kommo
- ❌ No hay cola de tareas para procesar después
- ❌ Errores se loggean pero no se notifican
- ❌ No hay dashboard de estado de sincronización

### 7. Refresh de Tokens

**Estado:** ⚠️ IMPLEMENTADO PERO NO FUNCIONAL

**Descripción:** El código para refresh de tokens existe pero no funciona porque `KOMMO_REFRESH_TOKEN` está vacío.

**Riesgo:**
- El token actual expira en 2030, pero si es revocado antes, la integración se rompe
- No hay mecanismo de alerta cuando el token está por expirar
- Requiere intervención manual para renovar

### 8. Validación de Field IDs

**Estado:** ❌ NO IMPLEMENTADA

**Descripción:** Los Field IDs están hardcodeados sin validación.

**Riesgos:**
- Si se cambian campos en Kommo, la integración falla silenciosamente
- No hay verificación de que los campos existen
- No hay mapeo dinámico de campos

### 9. Tests Automatizados

**Estado:** ❌ NO EXISTEN

**Descripción:** No hay tests unitarios ni de integración para la funcionalidad de Kommo.

**Impacto:**
- No hay forma de validar cambios sin probar manualmente
- Riesgo alto de regressions
- Dificulta el mantenimiento

### 10. Documentación de API de Kommo

**Estado:** ⚠️ PARCIAL

**Descripción:** La documentación interna menciona funcionalidades no implementadas.

**Problema:**
- `KOMMO_INTEGRATION.md` describe flujo bidireccional completo
- En realidad solo funciona un sentido
- Puede causar confusión a nuevos desarrolladores

---

## 💡 Recomendaciones Técnicas

### Prioridad Alta 🔴

#### 1. Implementar Endpoint de Webhooks
**Archivo a crear:** `src/app/api/kommo/webhook/route.ts`

**Razón:** Habilitar sincronización Kommo → LogiFlow

**Tareas:**
```typescript
// Estructura sugerida
export async function POST(request: Request) {
  // 1. Verificar firma HMAC
  // 2. Parsear evento
  // 3. Identificar tipo de evento (lead.update, lead.create, etc.)
  // 4. Llamar a getLeadDetails() y getContactDetails()
  // 5. Buscar/Crear/Actualizar en Firestore
  // 6. Retornar 200 OK
}
```

#### 2. Obtener Refresh Token
**Razón:** Evitar dependencia de token de larga duración

**Pasos:**
1. Acceder a integración en Kommo
2. Regenerar credenciales con refresh habilitado
3. Actualizar `KOMMO_REFRESH_TOKEN` en `.env`
4. Probar lógica de refresh

#### 3. Implementar Creación de Leads
**Archivo:** `src/lib/kommo.ts`

**Razón:** Permitir crear leads desde LogiFlow cuando no existen en Kommo

**Función a implementar:**
```typescript
export async function createLead(data: {
  name: string;
  price?: number;
  pipeline_id?: number;
  status_id?: number;
  responsible_user_id?: number;
  custom_fields_values?: any[];
}): Promise<any | null> {
  return kommoApiRequest(`leads`, 'POST', [data]);
}
```

#### 4. Sistema de Monitoreo
**Razón:** Detectar fallos en la sincronización

**Implementar:**
- Log estructurado (Winston o similar)
- Dashboard de estado de sincronización
- Alertas por email/Slack cuando falla
- Métricas: leads sincronizados, errores, latencia

### Prioridad Media 🟡

#### 5. Validación Dinámica de Field IDs
**Razón:** Evitar fallos silenciosos por cambios en Kommo

**Implementar:**
```typescript
// Al iniciar la app, validar que los field IDs existen
async function validateKommoFields() {
  const fields = await kommoApiRequest('leads/custom_fields', 'GET');
  // Comparar con KOMMO_FIELD_IDS
  // Loggear advertencias si no coinciden
}
```

#### 6. Gestión de Notas
**Razón:** Permitir a agentes añadir notas en Kommo desde LogiFlow

**Funciones a implementar:**
```typescript
export async function addNoteToLead(
  leadId: string, 
  noteText: string
): Promise<any | null>;

export async function addNoteToContact(
  contactId: number, 
  noteText: string
): Promise<any | null>;
```

#### 7. Tests Automatizados
**Razón:** Garantizar estabilidad y facilitar mantenimiento

**Tipos de tests:**
- Unit tests para funciones de `kommo.ts`
- Integration tests para endpoints API
- E2E tests para flujo completo de sincronización

**Herramientas sugeridas:**
- Jest para unit tests
- Supertest para API tests
- Playwright para E2E

#### 8. Sistema de Reintentos
**Razón:** Manejar fallos temporales de red/API

**Implementar:**
```typescript
// Wrapper con reintentos exponenciales
async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries = 3
): Promise<T> {
  // Lógica de retry con backoff exponencial
}
```

### Prioridad Baja 🟢

#### 9. Sincronización de Contactos
**Razón:** Mantener datos de contactos consistentes

**Implementar:**
- Creación de contactos en Kommo
- Actualización bidireccional de contactos
- Fusión de contactos duplicados

#### 10. Dashboard de Kommo en LogiFlow
**Razón:** Visibilidad de datos de Kommo sin salir de LogiFlow

**Características:**
- Ver leads de Kommo en interfaz de LogiFlow
- Estadísticas de sincronización
- Últimas actualizaciones
- Estado de la conexión

#### 11. Webhooks de Múltiples Eventos
**Razón:** Reaccionar a más eventos de Kommo

**Eventos a soportar:**
- `leads.delete` → Marcar lead como eliminado en LogiFlow
- `notes.add` → Sincronizar notas
- `tasks.add` → Mostrar tareas en LogiFlow
- `leads.responsible` → Reasignar lead en LogiFlow

#### 12. Migración a TypeScript Estricto
**Razón:** Mejorar type safety

**Pasos:**
- Crear interfaces TypeScript para respuestas de Kommo API
- Eliminar `any` types
- Validar tipos en runtime con Zod

---

## 🔍 Troubleshooting

### Problema 1: "Lead not found" al actualizar

**Síntomas:**
- Error 404: `Could not find a Kommo lead for Shopify order #1234`
- El pedido se guarda en Firestore pero no actualiza Kommo

**Posibles Causas:**
1. El lead no existe en Kommo
2. El nombre del lead en Kommo no incluye el Shopify Order ID
3. El `kommo_lead_id` es incorrecto

**Solución:**
```powershell
# 1. Verificar que el lead existe en Kommo
# Buscar manualmente en Kommo UI por el Order ID

# 2. Probar búsqueda con PowerShell
$headers = @{
    "Authorization" = "Bearer $env:KOMMO_ACCESS_TOKEN"
}
Invoke-RestMethod -Uri "https://blumiperu0102.kommo.com/api/v4/leads?query=%231234" -Headers $headers

# 3. Si el lead existe pero no se encuentra:
# - Verificar que el nombre del lead incluye "#1234"
# - O añadir el kommo_lead_id manualmente al pedido en Firestore
```

### Problema 2: "Invalid token" o "Unauthorized"

**Síntomas:**
- Error 401 en llamadas a Kommo API
- Logs: `Failed to refresh Kommo token`

**Posibles Causas:**
1. `KOMMO_ACCESS_TOKEN` expiró
2. Token fue revocado en Kommo
3. Variables de entorno mal configuradas

**Solución:**
```powershell
# 1. Verificar que el token es válido
$headers = @{
    "Authorization" = "Bearer $env:KOMMO_ACCESS_TOKEN"
}
Invoke-RestMethod -Uri "https://blumiperu0102.kommo.com/api/v4/account" -Headers $headers

# 2. Si falla, regenerar token en Kommo:
# - Ir a Settings → Integrations → [Tu Integración]
# - Regenerate Access Token
# - Actualizar KOMMO_ACCESS_TOKEN en .env

# 3. Reiniciar servidor Next.js
npm run dev
```

### Problema 3: Campos personalizados no se actualizan

**Síntomas:**
- El lead se actualiza pero campos específicos quedan vacíos
- Presupuesto (price) se actualiza pero no los campos custom

**Posibles Causas:**
1. Field IDs incorrectos
2. Tipo de dato incorrecto para el campo
3. Campo no existe en Kommo

**Solución:**
```powershell
# 1. Obtener lista de campos personalizados de leads
$headers = @{
    "Authorization" = "Bearer $env:KOMMO_ACCESS_TOKEN"
}
$fields = Invoke-RestMethod -Uri "https://blumiperu0102.kommo.com/api/v4/leads/custom_fields" -Headers $headers

# 2. Verificar IDs de cada campo
$fields._embedded.custom_fields | Format-Table id, name, type

# 3. Comparar con KOMMO_FIELD_IDS en update-lead/route.ts
# 4. Actualizar IDs si no coinciden
```

### Problema 4: Timeout en llamadas a Kommo

**Síntomas:**
- Request tarda mucho y falla
- Error: `ETIMEDOUT` o `ECONNRESET`

**Posibles Causas:**
1. API de Kommo está lenta o caída
2. Network issues
3. Rate limiting

**Solución:**
```powershell
# 1. Verificar estado de API de Kommo
Invoke-WebRequest -Uri "https://status.kommo.com"

# 2. Verificar rate limits (600 requests por minuto por default)
# Revisar headers de respuesta:
# X-RateLimit-Limit: 600
# X-RateLimit-Remaining: 599

# 3. Implementar retry con backoff exponencial en el código
```

### Problema 5: Status no cambia en Kommo

**Síntomas:**
- Campos custom se actualizan pero el status sigue igual
- Lead no se mueve de etapa en el pipeline

**Posibles Causas:**
1. `KOMMO_STATUS_ID_VENTA_CONFIRMADA` es incorrecto
2. Usuario no tiene permisos para cambiar status
3. Pipeline cambió en Kommo

**Solución:**
```powershell
# 1. Obtener lista de pipelines y statuses
$headers = @{
    "Authorization" = "Bearer $env:KOMMO_ACCESS_TOKEN"
}
$pipelines = Invoke-RestMethod -Uri "https://blumiperu0102.kommo.com/api/v4/leads/pipelines" -Headers $headers

# 2. Buscar el status correcto
$pipelines._embedded.pipelines | ForEach-Object {
    $_.name
    $_._embedded.statuses | Format-Table id, name
}

# 3. Actualizar KOMMO_STATUS_ID_VENTA_CONFIRMADA en route.ts
```

### Problema 6: Servidor no encuentra variables de entorno

**Síntomas:**
- Error: `Kommo environment variables are missing`
- Logs: `KOMMO_SUBDOMAIN is undefined`

**Posibles Causas:**
1. Archivo `.env` no está en la raíz del proyecto
2. Variables no tienen prefijo correcto para cliente/servidor
3. Servidor no se reinició después de cambiar .env

**Solución:**
```powershell
# 1. Verificar ubicación de .env
ls .env

# 2. Verificar contenido
Get-Content .env | Select-String "KOMMO"

# 3. Reiniciar servidor (CTRL+C y npm run dev)
npm run dev

# 4. En producción (Vercel), verificar variables en dashboard
# Settings → Environment Variables
```

---

## 📚 Referencias

### Documentación de Kommo API
- **API Docs:** https://www.kommo.com/developers/api/
- **OAuth 2.0:** https://www.kommo.com/developers/api/oauth/
- **Leads:** https://www.kommo.com/developers/api/leads/
- **Contacts:** https://www.kommo.com/developers/api/contacts/
- **Webhooks:** https://www.kommo.com/developers/api/webhooks/

### Archivos del Proyecto
- **Cliente Kommo:** `src/lib/kommo.ts`
- **Endpoint Update:** `src/app/api/kommo/update-lead/route.ts`
- **Tipos:** `src/lib/types.ts`
- **Create Order Form:** `src/app/(dashboard)/create-order/components/create-order-form.tsx`
- **Documentación Anterior:** `docs/KOMMO_INTEGRATION.md`

### Variables de Entorno
- **Archivo:** `.env` (raíz del proyecto)
- **Variables:** `KOMMO_SUBDOMAIN`, `KOMMO_ACCESS_TOKEN`, `KOMMO_REFRESH_TOKEN`, `KOMMO_INTEGRATION_ID`, `KOMMO_SECRET_KEY`

---

## 🎯 Conclusiones

### Estado General
La integración con Kommo está **funcionalmente operativa** para el flujo principal: actualizar leads en Kommo cuando se confirma un pedido en LogiFlow. Sin embargo, está **incompleta** en comparación con lo descrito en la documentación.

### Fortalezas
- ✅ Código limpio y bien estructurado
- ✅ Logging detallado para debugging
- ✅ Manejo básico de errores
- ✅ Búsqueda inteligente de leads

### Debilidades
- ❌ Sincronización unidireccional (solo LogiFlow → Kommo)
- ❌ No hay webhooks de Kommo
- ❌ Dependencia de token de larga duración sin refresh activo
- ❌ Field IDs hardcodeados sin validación
- ❌ Sin tests automatizados

### Próximos Pasos Recomendados

**Inmediatos (1-2 semanas):**
1. Implementar endpoint de webhooks para sincronización bidireccional
2. Obtener y configurar refresh token
3. Crear página de pruebas de Kommo (siguiente tarea)

**Corto Plazo (1 mes):**
4. Implementar creación de leads
5. Sistema de monitoreo y alertas
6. Tests automatizados básicos

**Mediano Plazo (2-3 meses):**
7. Gestión completa de contactos
8. Dashboard de Kommo en LogiFlow
9. Optimizaciones de performance

---

**Documento generado:** 13 de noviembre de 2025  
**Autor:** GitHub Copilot (análisis automático del código)  
**Próxima revisión:** Después de implementar webhooks y página de pruebas
