# 🛡️ Estrategia de Protección de Datos en Firestore

**Fecha**: 6 de noviembre de 2025  
**Versión**: 1.0  
**Problema**: Plugin externo sobrescribe campos críticos en `shopify_leads`

---

## 🚨 Problema Identificado

### Síntoma
```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
```

### Causa Raíz
Un plugin externo con permisos de escritura en Firestore está actualizando documentos en `shopify_leads` y **sobrescribiendo campos críticos** como:
- ❌ `nombres` → Se vuelve `undefined`
- ❌ `celular` → Se pierde
- ❌ `direccion` → Se pierde
- ❌ Otros campos personalizados

El plugin solo actualiza:
- ✅ `call_status` → "VISTO"
- ✅ `visto_por` → "usuario"
- ✅ `last_updated` → timestamp

**Pero usa `.set()` en lugar de `.update()`, borrando todo lo demás.**

---

## ✅ Solución Implementada (Multi-capa)

### 1. 🔒 Protección en el Frontend (Validación Defensiva)

**Archivo**: `src/app/(dashboard)/call-center-queue/page.tsx`

Se agregaron validaciones para prevenir errores cuando los campos están `undefined`:

```typescript
// Antes (causaba error)
const matchesSearch = lead.nombres.toLowerCase().includes(searchInput)

// Después (seguro)
const matchesSearch = (lead.nombres || '').toLowerCase().includes(searchInput)
```

### 2. 🛠️ Utilitario de Protección de Datos

**Archivo**: `src/lib/firestore-protection.ts`

Funciones para actualizar documentos de forma segura:

```typescript
// Actualización segura que preserva campos críticos
safeUpdateLead(docId, updates, collection)

// Validación de documento
validateLeadData(lead)

// Reparación de documentos corruptos
repairLeadDocument(docId, collection)
```

### 3. 📋 Reglas de Firestore (Pendiente Implementar)

**Archivo**: `firestore.rules`

Prevenir que el plugin sobrescriba campos críticos:

```javascript
// Solo permitir actualización de campos específicos
match /shopify_leads/{leadId} {
  allow update: if request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['call_status', 'visto_por', 'last_updated', 'assigned_agent_id', 
              'assigned_agent_name', 'notas_agente']);
}
```

### 4. 🔄 Sistema de Versionado (Opcional)

Agregar campo `_version` para detectar conflictos:

```typescript
{
  _version: 2,
  _last_updated_by: 'webhook_v5.0.0',
  _protected_fields: ['nombres', 'celular', 'direccion', ...],
  // ... resto de campos
}
```

---

## 🚀 Implementación Paso a Paso

### Paso 1: Validación Defensiva en Frontend ✅

Ya implementado en los archivos:
- `src/app/(dashboard)/call-center-queue/page.tsx`
- `src/app/(dashboard)/call-center-queue/components/clean-leads-table.tsx`

### Paso 2: Crear Utilitarios de Protección

Ver archivo `src/lib/firestore-protection.ts` (creado en este cambio)

### Paso 3: Actualizar Webhooks para Usar Protección

Los webhooks ya usan `set(..., { merge: true })` que es correcto.

### Paso 4: Configurar Reglas de Firestore

**Acción Requerida**: Actualizar `firestore.rules` con las reglas de protección.

---

## 📝 Código de Protección

### Uso en el Frontend

```typescript
import { safeUpdateLead, validateLeadData } from '@/lib/firestore-protection';

// En lugar de updateDoc directo
await safeUpdateLead(lead.id, {
  call_status: 'VISTO',
  visto_por: currentUser.nombre
}, 'shopify_leads');
```

### Uso en Cloud Functions / Plugin Externo

```typescript
import { FieldValue } from 'firebase-admin/firestore';

// ❌ MAL: Sobrescribe todo
await docRef.set({
  call_status: 'VISTO',
  visto_por: 'usuario',
  last_updated: new Date()
});

// ✅ BIEN: Solo actualiza campos específicos
await docRef.update({
  call_status: 'VISTO',
  visto_por: 'usuario',
  last_updated: FieldValue.serverTimestamp()
});

// ✅ MEJOR: Con merge
await docRef.set({
  call_status: 'VISTO',
  visto_por: 'usuario',
  last_updated: new Date()
}, { merge: true });
```

---

## 🔍 Detección de Documentos Corruptos

### Script de Validación

Ejecutar para encontrar documentos con datos faltantes:

```typescript
import { validateAllLeads, generateValidationReport } from '@/lib/firestore-protection';

// Validar todos los leads
const report = await generateValidationReport('shopify_leads');

console.log(`
Documentos analizados: ${report.total}
Con problemas: ${report.withIssues}
Campos faltantes más comunes: ${JSON.stringify(report.missingFields)}
`);
```

### Reparación Automática

```typescript
import { repairAllLeads } from '@/lib/firestore-protection';

// Reparar documentos usando datos de respaldo
await repairAllLeads('shopify_leads', {
  useShopifyAPI: true,  // Intentar obtener datos de Shopify
  backfillDefaults: true // Usar valores por defecto
});
```

---

## 🎯 Campos Críticos Protegidos

### Nivel 1: Inmutables (nunca deben cambiar)
- `shopify_order_id`
- `shopify_customer_id`
- `source`
- `tienda_origen`
- `store_name`
- `created_time`
- `first_interaction_at`

### Nivel 2: Solo Actualización Controlada
- `nombres`
- `apellidos`
- `celular`
- `email`
- `direccion`
- `distrito`
- `provincia`

### Nivel 3: Actualización Libre
- `call_status`
- `visto_por`
- `last_updated`
- `assigned_agent_id`
- `assigned_agent_name`
- `notas_agente`

---

## 🔧 Configuración del Plugin Externo

### Instrucciones para el Desarrollador del Plugin

Si tienes acceso al código del plugin, **cambia esto**:

```javascript
// ❌ INCORRECTO
firestore.collection('shopify_leads').doc(leadId).set({
  call_status: 'VISTO',
  visto_por: userName,
  last_updated: new Date()
})

// ✅ CORRECTO
firestore.collection('shopify_leads').doc(leadId).update({
  call_status: 'VISTO',
  visto_por: userName,
  last_updated: firebase.firestore.FieldValue.serverTimestamp()
})
```

### Si No Tienes Acceso al Código del Plugin

**Opción 1**: Configurar Cloud Function Trigger que "repara" el documento después de cada escritura

**Opción 2**: Implementar reglas de Firestore estrictas (pueden romper el plugin)

**Opción 3**: Usar un campo de "lock" temporal durante actualizaciones

---

## 📊 Monitoreo y Alertas

### Métricas a Monitorear

1. **Documentos con campos undefined**
   ```typescript
   leads.filter(l => !l.nombres || !l.celular).length
   ```

2. **Actualizaciones del plugin**
   ```typescript
   leads.filter(l => l.visto_por && l.last_updated > Date.now() - 60000)
   ```

3. **Errores en el frontend**
   ```typescript
   // Capturar errores de undefined
   window.addEventListener('error', (e) => {
     if (e.message.includes('toLowerCase')) {
       logCorruptedLead(currentLead);
     }
   });
   ```

---

## 🚨 Plan de Respuesta a Incidentes

### Si Ocurre Corrupción de Datos

1. **Identificar leads afectados**
   ```bash
   # Ejecutar script de validación
   npm run validate:leads
   ```

2. **Obtener respaldo**
   ```typescript
   // Los webhooks guardan datos originales completos
   // Buscar en logs o en colección de audit
   ```

3. **Restaurar datos**
   ```typescript
   await repairLeadDocument(leadId, 'shopify_leads')
   ```

4. **Prevenir recurrencia**
   - Implementar reglas de Firestore más estrictas
   - Contactar al desarrollador del plugin
   - Configurar trigger de Cloud Function

---

## ✅ Checklist de Implementación

- [x] Validaciones defensivas en frontend
- [x] Utilitarios de protección creados
- [x] Documentación completa
- [ ] Reglas de Firestore actualizadas
- [ ] Script de validación ejecutado
- [ ] Cloud Function de reparación desplegada
- [ ] Plugin externo actualizado (si es posible)
- [ ] Sistema de monitoreo configurado
- [ ] Plan de respuesta documentado

---

## 📞 Soporte

Si encuentras más documentos corruptos:
1. No eliminar el documento
2. Capturar el ID del documento
3. Ejecutar script de reparación
4. Revisar logs del plugin externo

---

**Estado**: ✅ Protecciones básicas implementadas  
**Próximo Paso**: Implementar reglas de Firestore y monitoreo
