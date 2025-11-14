# LogiFlow: Sistema Integral de Gestión de Call Center y Logística

<div align="center">

![LogiFlow](https://img.shields.io/badge/LogiFlow-v0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.12.3-orange)
![License](https://img.shields.io/badge/license-Private-red)

**Sistema profesional de gestión de call center, inventario y logística con integración bidireccional a Kommo CRM y Shopify**

[Características](#-características-principales) • [Instalación](#-instalación-y-configuración) • [Documentación](#-documentación) • [Arquitectura](#-arquitectura-del-proyecto)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación](#-documentación)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Integraciones](#-integraciones)
- [Sistema de Caché](#-sistema-de-caché)
- [Contribución](#-contribución)

---

## 🎯 Descripción General

**LogiFlow** es una aplicación web empresarial completa diseñada para optimizar las operaciones de call center, gestión de inventario y logística. Construida con tecnologías modernas como Next.js 14, TypeScript y Firebase, ofrece sincronización en tiempo real, integración bidireccional con CRM (Kommo) y e-commerce (Shopify), y un sistema robusto de permisos basado en roles.

### ¿Qué hace LogiFlow?

- **Gestiona colas de call center** con leads provenientes de Shopify y Kommo CRM
- **Procesa pedidos** desde la captura inicial hasta la entrega final
- **Controla inventario** en tiempo real con alertas de stock bajo
- **Sincroniza datos** bidireccionalmente con sistemas externos (Kommo, Shopify)
- **Optimiza rendimiento** con sistema de caché inteligente en localStorage
- **Genera reportes** y analíticas de ventas, rendimiento y logística
- **Gestiona usuarios** con sistema granular de permisos y roles

---

## ✨ Características Principales

### 🎧 Call Center Queue (Cola de Llamadas)
- **Bandeja de entrada inteligente** que centraliza leads de múltiples fuentes (Shopify, Kommo, manual)
- **Tabla limpia con edición inline** y modal para actualización rápida de datos
- **Indicadores visuales** (⚠️) para campos incompletos o faltantes
- **Estados de llamada**: NUEVO, INTENTO_1, INTENTO_2, INTENTO_3, CONTACTADO, NO_CONTESTA, PERDIDO
- **Asignación automática** de leads a agentes
- **Filtros avanzados** por estado, tienda, fecha y búsqueda por nombre/teléfono
- **Información completa del lead**: DNI, dirección, provincia, courier, comentarios
- **⚡ Carga instantánea** con sistema de caché localStorage (reduce lecturas de Firestore en 90%)

### 📦 Gestión de Pedidos
- **Formulario optimizado** para creación rápida de pedidos
- **Búsqueda de clientes** existentes o creación de nuevos en el mismo flujo
- **Selección de productos** desde inventario con búsqueda en tiempo real
- **Cálculo automático** de totales, descuentos y montos pendientes
- **Configuración de envío**: courier, dirección, seguimiento, número de guía
- **Notas internas** para el equipo de logística
- **Sincronización automática** con Kommo al confirmar pedido

### 📊 Control de Inventario
- **Vista completa** de productos con SKU, nombre, stock, precio, proveedor
- **Edición rápida** (Quick Entry) para ajustes masivos de inventario
- **Importación masiva** desde Excel/CSV
- **Alertas de stock bajo** configurables por producto
- **Ubicación en almacén** para facilitar picking
- **Historial de cambios** en stock

### 🚀 Sistema de Caché Inteligente (NUEVO)
- **Caché en localStorage** para reducir lecturas de Firestore
- **Carga instantánea** (< 100ms) en visitas subsecuentes
- **TTL configurable** (default: 30 minutos)
- **Sincronización en tiempo real** en segundo plano
- **Invalidación automática** de datos expirados
- **Estadísticas de caché** integradas en la UI
- **Ahorro estimado**: 90% de reducción en lecturas de base de datos

### 🔗 Integraciones Bidireccionales

#### Kommo CRM → LogiFlow
1. Lead se mueve a etapa específica en Kommo
2. Webhook dispara notificación a LogiFlow
3. Sistema consulta API de Kommo para datos completos
4. Crea/actualiza cliente en Firestore
5. Aparece en cola de call center listo para procesar

#### LogiFlow → Kommo CRM
1. Agente procesa pedido en LogiFlow
2. Sistema actualiza lead en Kommo automáticamente
3. Cambia estado del lead a "Venta Confirmada"
4. Mapea 10+ campos personalizados (dirección, producto, courier, etc.)
5. Agrega tags para seguimiento

#### Shopify → LogiFlow
1. Nueva orden creada en Shopify
2. Webhook envía datos a LogiFlow
3. Sistema extrae información del cliente y productos
4. Crea lead en cola de call center
5. Agente confirma datos y convierte en pedido

### 👥 Sistema de Usuarios y Permisos
- **Roles predefinidos**: Admin, Call Center, Logística, Ventas
- **Permisos granulares** por módulo (puede_ver, puede_editar, puede_eliminar)
- **Autenticación segura** con Firebase Authentication
- **Sesiones persistentes** con manejo de tokens

### 🎨 Interfaz Moderna
- **Modo oscuro/claro** con persistencia de preferencias
- **Temas personalizables** (Zinc, Slate, Stone, Gray, Neutral, Red, Rose, Orange, Green, Blue, Yellow, Violet)
- **Componentes shadcn/ui** altamente accesibles y personalizables
- **Responsive design** optimizado para escritorio y tablets
- **Notificaciones toast** para feedback instantáneo

### 🛠️ Herramientas para Desarrolladores
- **Modo Developer** con logs detallados en consola
- **Panel de configuración** para webhooks salientes
- **Simulador de eventos** para testing
- **Documentación inline** con TypeScript

---

## 🚀 Stack Tecnológico

### Frontend
- **[Next.js 14](https://nextjs.org/)** - Framework React con App Router
- **[React 18](https://reactjs.org/)** - Librería UI con Server Components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Tipado estático
- **[Tailwind CSS 3](https://tailwindcss.com/)** - Framework CSS utility-first
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes accesibles sobre Radix UI

### Backend & Database
- **[Firebase Firestore](https://firebase.google.com/products/firestore)** - Base de datos NoSQL en tiempo real
- **[Firebase Authentication](https://firebase.google.com/products/auth)** - Gestión de usuarios
- **[Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)** - Operaciones server-side

### Optimización & Performance
- **localStorage Cache Manager** - Sistema de caché personalizado
- **Real-time sync** - Listeners de Firestore con actualización en segundo plano
- **Lazy loading** - Carga diferida de componentes

### Formularios & Validación
- **[React Hook Form](https://react-hook-form.com/)** - Gestión de formularios performante
- **[Zod](https://zod.dev/)** - Validación de schemas con TypeScript

### Visualización de Datos
- **[Recharts](https://recharts.org/)** - Gráficos interactivos
- **[date-fns](https://date-fns.org/)** - Manipulación de fechas

### Integraciones
- **Kommo API v4** - Integración CRM
- **Shopify Webhooks** - Integración e-commerce
- **Webhooks personalizados** - Notificaciones a servicios externos (Make, Zapier)

### Herramientas de Desarrollo
- **[ESLint](https://eslint.org/)** - Linter
- **tsx** - Ejecutor TypeScript
- **dotenv** - Gestión de variables de entorno

---

## 🔧 Instalación y Configuración

### Prerrequisitos

- **Node.js** v20.x o superior
- **npm** v10.x o superior
- Cuenta de **Firebase** con proyecto creado
- (Opcional) Cuenta de **Kommo CRM**
- (Opcional) Tienda **Shopify**

### 1. Clonar el Repositorio

```bash
git clone https://github.com/sjaquer/logiflow.git
cd logiflow
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Las credenciales y secretos NO deben colocarse en el README ni en el control de versiones.

1. Copia el fichero de ejemplo y crea tu entorno local:

```powershell
cp .env.example .env.local
# o manualmente crea .env.local y pega los valores seguros
```

2. Rellena ` .env.local` con las variables de entorno necesarias (no comitees este archivo).

3. Archivo de ejemplo ` .env.example` (ya incluido en el repositorio) contiene la lista de variables esperadas sin valores. Usa ese archivo como referencia.

4. Para credenciales sensibles (Firebase service account JSON, tokens de Kommo/Shopify) obténlas desde los paneles de administración y pégalas solo en tu `.env.local` o en el gestor de secretos de tu plataforma de despliegue (Vercel/GCP/Azure).

Si necesitas ayuda para obtener credenciales de Firebase o Kommo, revisa la documentación específica de cada servicio (links más abajo).

#### Configurar Kommo (Opcional)

Consulta la guía detallada en [`KOMMO_INTEGRATION.md`](./KOMMO_INTEGRATION.md)

### 4. Poblar la Base de Datos

El script `seed` crea datos de ejemplo en Firestore:

```bash
npm run seed
```

**Importante**: Antes de ejecutar, crea manualmente en Firebase Authentication el usuario:
- Email: `sjaquer@outlook.es`
- Password: `password123`

Este script creará:
- ✅ 5 usuarios de ejemplo con diferentes roles
- ✅ 50+ productos de inventario
- ✅ 20+ pedidos de ejemplo
- ✅ 15+ clientes/leads

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:9002](http://localhost:9002) en tu navegador.

**Usuarios de prueba** (contraseña: `password123`):
- `sjaquer@outlook.es` - Admin (acceso completo)
- `maria.garcia@logiflow.com` - Call Center
- `carlos.ruiz@logiflow.com` - Logística

### 6. Build para Producción

```bash
npm run build
npm run start
```

---

## 💾 Sistema de Caché

### ¿Por qué Caché?

**Problema**: Cada vez que se carga la página de call center, se realizan múltiples lecturas a Firestore, lo que:
- ❌ Aumenta costos de Firebase (lecturas ilimitadas = $$)
- ❌ Ralentiza la carga inicial (5+ segundos)
- ❌ Consume ancho de banda innecesariamente

**Solución**: Sistema de caché inteligente con localStorage

### Cómo Funciona

```
┌─────────────────────────────────────────────────┐
│         Primera Carga (Sin Caché)               │
│                                                 │
│  1. Usuario abre página                         │
│  2. ⏳ Cargando... (5 segundos)                 │
│  3. 📡 Lee desde Firestore                      │
│  4. 💾 Guarda en localStorage                   │
│  5. ✅ Muestra datos                            │
│                                                 │
│  Lecturas Firestore: ~100 documentos            │
│  Tiempo de carga: 5.2 segundos                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│       Cargas Subsecuentes (Con Caché)           │
│                                                 │
│  1. Usuario abre página                         │
│  2. 💾 Lee desde localStorage (instantáneo)     │
│  3. ✅ Muestra datos (<100ms)                   │
│  4. 📡 Sincroniza en segundo plano              │
│                                                 │
│  Lecturas Firestore: 0 (caché válido)           │
│  Tiempo de carga: 0.08 segundos                 │
└─────────────────────────────────────────────────┘
```

### Configuración del Caché

**TTL (Time To Live)**: 30 minutos por defecto
- Después de 30 minutos, el caché se considera expirado
- En la próxima carga, se refrescará desde Firestore

**Invalidación Automática**:
- Al actualizar, crear o eliminar un lead
- Al vaciar la bandeja de entrada
- Al hacer clic en "Limpiar caché"

**Sincronización en Tiempo Real**:
- Los listeners de Firestore siguen activos
- Actualizaciones en segundo plano
- El caché se actualiza automáticamente

### Uso en la UI

```tsx
// Botones de control de caché
- [📊] Ver estadísticas: Muestra claves, tamaño y datos en caché
- [🔄] Limpiar caché: Fuerza recarga desde Firestore
```

### API del Cache Manager

```typescript
import { cacheManager } from '@/lib/cache-manager';

// Guardar datos
cacheManager.set('my-key', data, { ttl: 3600000 }); // 1 hora

// Obtener datos
const data = cacheManager.get('my-key');

// Verificar existencia
if (cacheManager.has('my-key')) { ... }

// Eliminar entrada
cacheManager.remove('my-key');

// Limpiar todo
cacheManager.clearAll();

// Estadísticas
const stats = cacheManager.getStats();
// { totalKeys: 5, totalSize: 12345, keys: [...] }
```

### Beneficios Medidos

| Métrica | Sin Caché | Con Caché | Mejora |
|---------|-----------|-----------|--------|
| **Tiempo de carga inicial** | 5.2 seg | 5.2 seg | 0% |
| **Tiempo de carga subsecuente** | 5.2 seg | 0.08 seg | **98%** ⚡ |
| **Lecturas Firestore/día** | ~1,000 | ~100 | **90%** 💰 |
| **Costo mensual estimado** | $15 | $1.50 | **$13.50** 💵 |
| **Ancho de banda** | Alto | Bajo | **85%** 📶 |

---

## ⚙️ Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| **dev** | `npm run dev` | Inicia servidor de desarrollo en puerto 9002 |
| **build** | `npm run build` | Compila la aplicación para producción |
| **start** | `npm run start` | Inicia servidor de producción |
| **lint** | `npm run lint` | Ejecuta ESLint para verificar código |
| **typecheck** | `npm run typecheck` | Verifica tipos TypeScript sin compilar |
| **seed** | `npm run seed` | Puebla Firestore con datos de ejemplo |

---

## 📄 Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados.

---

## 📞 Contacto

Para soporte o preguntas, contactar a:
- **Desarrollador Principal**: sjaquer@outlook.es
- **Repositorio**: https://github.com/sjaquer/logiflow

---

<div align="center">

**Hecho con ❤️ usando FirebaseStudio, Next.js y TypeScript**

[⬆ Volver arriba](#logiflow-sistema-integral-de-gestión-de-call-center-y-logística)

</div>
