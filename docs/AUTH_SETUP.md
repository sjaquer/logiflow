# 🔐 Sistema de Autenticación - Logiflow

## Resumen

El sistema de autenticación de Logiflow utiliza **Firebase Authentication** para gestionar usuarios y sesiones de manera segura.

---

## 📋 Credenciales de Administrador

### Usuario Principal
```
Email:    sjaquer@outlook.es
Password: A901230b
UID:      cX43uvEXHBfYRQngtPkImjhOeTq2
Rol:      Administrador
```

Este usuario tiene acceso completo a todas las funcionalidades del sistema.

---

## 🛠️ Configuración Inicial

### 1. Variables de Entorno Requeridas

Asegúrate de tener estas variables configuradas en tu archivo `.env`:

```bash
# Firebase Client (para autenticación web)
NEXT_PUBLIC_FIREBASE_API_KEY="tu-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-proyecto-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# Firebase Admin (para operaciones del servidor)
FIREBASE_PROJECT_ID="tu-proyecto-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com"
```

### 2. Inicializar/Resetear Usuario Admin

Si necesitas crear o resetear la contraseña del usuario administrador:

```powershell
# Ejecutar el script de inicialización
npx ts-node --project tsconfig.scripts.json scripts/init-admin-user.ts
```

El script:
- ✅ Verifica si el usuario existe
- ✅ Si existe, actualiza la contraseña a `A901230b`
- ✅ Si no existe, crea el usuario con las credenciales especificadas
- ✅ Marca el email como verificado

---

## 🔑 Flujo de Autenticación

### Inicio de Sesión

1. Usuario accede a `/login`
2. Ingresa email y contraseña
3. Firebase Auth valida las credenciales
4. Si es correcto, redirige a `/call-center-queue`
5. Si falla, muestra mensaje de error

### Persistencia de Sesión

- **Método**: Firebase Auth con tokens JWT
- **Duración**: Hasta que el usuario cierre sesión manualmente
- **Storage**: Token almacenado en `localStorage` del navegador
- **Validación**: Automática en cada petición con `onAuthStateChanged`

### Cierre de Sesión

- Click en botón de logout en el header
- Llama a `signOut(auth)` de Firebase
- Limpia el token del navegador
- Redirige a `/login`

---

## 🔐 Seguridad

### Características Implementadas

- ✅ **Contraseñas Hasheadas**: Firebase maneja hash automático (bcrypt)
- ✅ **Tokens JWT**: Autenticación sin estado con tokens firmados
- ✅ **HTTPS Only**: En producción, solo conexiones seguras
- ✅ **Email Verificado**: Usuario admin marcado como verificado
- ✅ **Session Timeout**: Tokens expiran automáticamente (1 hora por defecto)

### Mejores Prácticas

1. **Nunca commitear credenciales** al repositorio
2. **Rotar contraseñas** cada 90 días (recomendado)
3. **Usar variables de entorno** para todos los secrets
4. **Habilitar 2FA** en Firebase Console (próximamente)
5. **Monitorear intentos fallidos** de login en Firebase Console

---

## 🚀 Uso del Sistema

### Iniciar Sesión

1. Ve a: `http://localhost:3000/login` (dev) o `https://tu-dominio.com/login` (prod)
2. Ingresa:
   - **Email**: `sjaquer@outlook.es`
   - **Contraseña**: `A901230b`
3. Click en **"Ingresar"**

### Agregar Nuevos Usuarios

**Opción A - Firebase Console (Recomendado)**:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Authentication → Users → Add user
4. Ingresa email y contraseña
5. (Opcional) Marca "Email verified"

**Opción B - Script Personalizado**:
Crear un script similar a `init-admin-user.ts` con las credenciales del nuevo usuario.

**Opción C - Endpoint API** (futuro):
Crear endpoint `/api/auth/create-user` para admins (requiere implementación).

---

## 🧪 Testing

### Probar Login Localmente

```powershell
# 1. Levantar servidor de desarrollo
npm run dev

# 2. Abrir navegador en http://localhost:3000/login

# 3. Ingresar credenciales:
#    Email: sjaquer@outlook.es
#    Password: A901230b

# 4. Verificar redirección a /call-center-queue
```

### Probar Logout

1. Una vez autenticado, click en avatar/nombre en header
2. Click en "Cerrar Sesión"
3. Verificar redirección a `/login`
4. Intentar acceder a `/call-center-queue` → debe redirigir a login

---

## 🐛 Troubleshooting

### Error: "Las credenciales son incorrectas"

**Causas posibles**:
1. Email o contraseña incorrectos
2. Usuario no existe en Firebase Auth
3. Variables de Firebase mal configuradas

**Solución**:
```powershell
# Resetear usuario admin
npx ts-node --project tsconfig.scripts.json scripts/init-admin-user.ts

# Verificar variables en .env
# NEXT_PUBLIC_FIREBASE_* deben estar configuradas
```

### Error: "Firebase: Error (auth/user-not-found)"

**Causa**: El usuario no existe en Firebase Authentication

**Solución**:
```powershell
# Ejecutar script de inicialización
npx ts-node --project tsconfig.scripts.json scripts/init-admin-user.ts
```

### Error: "Firebase Admin environment variables are not set"

**Causa**: Variables de entorno de Firebase Admin no configuradas

**Solución**:
1. Verifica que `.env` tenga:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
2. Reinicia el servidor después de cambiar `.env`

### La sesión no persiste al recargar

**Causa**: Problema con `localStorage` o configuración de Firebase

**Solución**:
1. Verifica que `NEXT_PUBLIC_FIREBASE_*` estén configuradas
2. Limpia caché del navegador
3. Revisa consola del navegador para errores

---

## 📊 Monitoreo

### Ver Usuarios en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Authentication → Users
4. Verás lista de todos los usuarios registrados

### Ver Intentos de Login

1. Firebase Console → Authentication → Users
2. Click en un usuario específico
3. Ver historial de sesiones y dispositivos

### Logs de Autenticación

En desarrollo, los logs aparecen en:
- **Consola del navegador**: Errores de cliente
- **Terminal del servidor**: Logs de Firebase Admin SDK

---

## 🔄 Rotación de Contraseñas

Para cambiar la contraseña del usuario admin:

**Opción 1 - Modificar script**:
```typescript
// En scripts/init-admin-user.ts
const ADMIN_PASSWORD = 'NuevaContraseñaSegura123!';
```

Luego ejecutar:
```powershell
npx ts-node --project tsconfig.scripts.json scripts/init-admin-user.ts
```

**Opción 2 - Firebase Console**:
1. Firebase Console → Authentication → Users
2. Click en el usuario
3. Acciones → Reset password
4. Ingresar nueva contraseña

---

## 📚 Recursos Adicionales

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## ✅ Checklist de Configuración

- [x] Variables de entorno configuradas en `.env`
- [x] Usuario admin creado en Firebase Auth
- [x] Contraseña del admin configurada: `A901230b`
- [x] Email verificado
- [ ] Testing de login completado
- [ ] Testing de logout completado
- [ ] Configuración de 2FA (opcional)
- [ ] Documentación compartida con el equipo

---

**Última actualización**: 4 de noviembre de 2025  
**Usuario Admin**: sjaquer@outlook.es  
**Script de Inicialización**: `scripts/init-admin-user.ts`
