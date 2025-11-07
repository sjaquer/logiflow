# Sincronización de Configuración de Tabla

## 📋 Descripción

La configuración de la tabla de leads (columnas visibles, anchos, filtros) ahora se sincroniza automáticamente con la cuenta del usuario a través de Firestore. Esto permite que los usuarios mantengan sus preferencias de visualización al cambiar de dispositivo.

## 🔄 Cómo Funciona

### Almacenamiento Dual

La configuración se almacena en dos lugares:

1. **Firestore (Principal)**: Base de datos en la nube
   - Colección: `user_table_configs`
   - Documento ID: `authUserId` (Firebase Auth UID del usuario)
   - Campos:
     - `visibleColumns`: Object con las columnas visibles
     - `columnWidths`: Object con los anchos personalizados
     - `updatedAt`: Timestamp de última actualización

2. **localStorage (Backup)**: Almacenamiento local del navegador
   - Keys: `cc_visibleColumns`, `cc_columnWidths`
   - Usado como fallback si Firestore falla
   - Sincronizado automáticamente con Firestore

### Flujo de Carga

```
1. Usuario inicia sesión
2. Sistema intenta cargar config desde Firestore
3. Si existe en Firestore:
   ├─ Carga configuración de Firestore
   └─ Guarda copia en localStorage como backup
4. Si NO existe en Firestore:
   ├─ Intenta cargar desde localStorage
   └─ Si existe, usa esa configuración
5. Si ninguno existe:
   └─ Usa configuración por defecto
```

### Flujo de Guardado

```
1. Usuario cambia configuración (columna, ancho, etc)
2. Sistema detecta el cambio (useEffect)
3. Guarda en localStorage (instantáneo)
4. Si usuario está autenticado:
   └─ Guarda en Firestore (sincronización en nube)
```

## 🔒 Seguridad (Firestore Rules)

```javascript
// Cada usuario solo puede leer/escribir su propia configuración
match /user_table_configs/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

- Solo usuarios autenticados pueden acceder
- Cada usuario solo ve su propia configuración
- El `userId` debe coincidir con el `auth.uid` del usuario

## 📦 Datos Guardados

### visibleColumns
```typescript
{
  estado: true,
  fechaCreacion: false,
  nombreLead: true,
  producto: true,
  estatusLead: true,
  provincia: true,
  dni: true,
  // ... más columnas
}
```

### columnWidths
```typescript
{
  nombreLead: 200,
  producto: 250,
  provincia: 180,
  // ... más anchos personalizados
}
```

## 💡 Ventajas

✅ **Persistencia Multi-Dispositivo**: La configuración se mantiene al cambiar de dispositivo
✅ **Backup Automático**: localStorage actúa como fallback si Firestore falla
✅ **Sincronización Automática**: No requiere acción manual del usuario
✅ **Privacidad**: Cada usuario solo ve su propia configuración
✅ **Performance**: Carga rápida desde localStorage mientras se sincroniza con Firestore

## 🔧 Implementación Técnica

### Componente: `CleanLeadsTable`

**Props añadidos:**
- `currentUser`: Información del usuario de la app
- `authUserId`: UID de Firebase Auth (usado para Firestore)

**Estados clave:**
- `isLoadingConfig`: Previene guardados durante la carga inicial
- `visibleColumns`: Columnas visibles
- `columnWidths`: Anchos personalizados

**Hooks useEffect:**
1. **Carga Inicial** (`useEffect` con dep: `authUserId`)
   - Ejecuta al montar o cambiar usuario
   - Carga desde Firestore → fallback a localStorage

2. **Guardado de Columnas** (`useEffect` con dep: `visibleColumns`)
   - Ejecuta cuando cambian las columnas visibles
   - Guarda en localStorage + Firestore

3. **Guardado de Anchos** (`useEffect` con dep: `columnWidths`)
   - Ejecuta cuando cambian los anchos
   - Guarda en localStorage + Firestore

## 🚀 Uso

No requiere configuración adicional por parte del usuario. El sistema funciona automáticamente:

1. Personaliza la tabla (oculta/muestra columnas, ajusta anchos)
2. Los cambios se guardan automáticamente
3. Inicia sesión en otro dispositivo
4. La tabla se carga con tus preferencias

## 🐛 Troubleshooting

### "Mi configuración no se guarda"
- Verifica que estés autenticado
- Revisa la consola del navegador por errores de Firestore
- Verifica las reglas de seguridad en Firebase Console

### "Veo configuración antigua después de limpiar caché"
- La configuración en Firestore prevalece sobre localStorage
- Si limpias localStorage, se recargará desde Firestore

### "Diferentes configuraciones en diferentes dispositivos"
- Asegúrate de usar la misma cuenta en ambos dispositivos
- Espera unos segundos para que Firestore sincronice
- Refresca la página para forzar recarga

## 📝 Notas de Desarrollo

- La columna 'acciones' se elimina automáticamente si existe en configs antiguas
- `setDoc` con `{ merge: true }` evita sobrescribir datos
- Los errores se loguean en consola pero no afectan la UX
- localStorage actúa como caché offline-first
