# LogiFlow: Sistema de Gestión Logística y de Ventas

LogiFlow es una aplicación web integral diseñada para optimizar y centralizar las operaciones de logística y ventas. Construida con un stack tecnológico moderno sobre Next.js y Firebase, ofrece una interfaz de usuario potente e intuitiva para el seguimiento de pedidos, gestión de inventario, un pipeline de call center, y analíticas de negocio.

![Captura de Pantalla de LogiFlow](https://i.imgur.com/gO2kY8a.png)

---

## ✨ Características Principales

-   **Gestión de Pedidos (Kanban):** Visualiza y administra el ciclo de vida de los pedidos en un tablero Kanban interactivo. Las tarjetas de pedido se mueven entre columnas que representan su estado actual (`PENDIENTE`, `EN_PREPARACION`, `ENTREGADO`, etc.).
-   **Pipeline de Call Center:** Una bandeja de entrada dedicada para agentes de call center, donde los leads de **Kommo** y **Shopify** son recibidos y gestionados. Los agentes pueden procesar estos leads para confirmar datos y convertirlos en pedidos.
-   **Creación de Pedidos Optimizada:** Un formulario de creación de pedidos que permite a los agentes buscar clientes existentes o registrar nuevos, añadir productos del inventario en tiempo real y configurar los detalles de envío y pago.
-   **Control de Inventario:** Mantén un registro detallado del stock de productos, precios, proveedores y ubicación en el almacén. Incluye un "Editor Rápido" para ajustes de inventario en lote.
-   **Reportes y Analíticas:** Un dashboard con KPIs clave (Ingresos, Pedidos Totales), gráficos de estado de pedidos, análisis de ventas por tienda/usuario/courier, y niveles de inventario.
-   **Gestión de Usuarios y Roles:** Sistema de permisos basado en roles (`Admin`, `Call Center`, `Logistica`, etc.) para controlar el acceso a las diferentes funcionalidades de la aplicación.
-   **Integraciones Externas vía Webhooks:**
    -   **Kommo:** Captura leads automáticamente cuando se mueven a una etapa específica del embudo de ventas.
    -   **Shopify:** Crea leads en la cola del call center cuando se genera un nuevo pedido en la tienda.
    -   **Sistema de Webhooks Salientes:** Permite notificar a servicios externos (como Make o Zapier) sobre eventos dentro de la aplicación (ej. `ORDER_CREATED`).
-   **Interfaz Personalizable y Modo Oscuro:** Elige entre diferentes temas de color y alterna entre modo claro/oscuro. Las preferencias se guardan localmente.
-   **Modo Desarrollador:** Un interruptor especial para desarrolladores que activa logs detallados en la consola para facilitar el debugging del flujo de datos.

---

## 🚀 Stack Tecnológico

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
-   **Base de Datos:** [Firebase Firestore](https://firebase.google.com/products/firestore) (Base de datos NoSQL en tiempo real)
-   **Autenticación:** [Firebase Authentication](https://firebase.google.com/products/auth)
-   **UI:** [React](https://reactjs.org/)
-   **Componentes UI:** [ShadCN UI](https://ui.shadcn.com/) (Construido sobre Radix UI y Tailwind CSS)
-   **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
-   **Gestión de Formularios:** [React Hook Form](https://react-hook-form.com/) con [Zod](https://zod.dev/) para validación.
-   **Gráficos:** [Recharts](https://recharts.org/)

---

## 🔧 Instalación y Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

-   [Node.js](https://nodejs.org/) (versión 20.x o superior)
-   [npm](https://www.npmjs.com/) (o un gestor de paquetes compatible como Yarn o pnpm)
-   Una cuenta de Firebase.

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/logiflow.git
cd logiflow
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto. Puedes usar el archivo `.env.example` como plantilla. Este archivo contendrá todas las claves de API necesarias.

#### a) Configuración de Firebase

1.  Ve a la [Consola de Firebase](https://console.firebase.google.com/), crea un nuevo proyecto y una aplicación web.
2.  Copia las credenciales de configuración de tu aplicación (el objeto `firebaseConfig`) y pégalas en tu archivo `.env.local` con los siguientes nombres:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:...
    ```

3.  Habilita **Firestore Database** y **Authentication** (con el proveedor de Email/Contraseña).
4.  **Credenciales de Admin (para el script de `seed`):**
    *   En Firebase, ve a **Configuración del proyecto > Cuentas de servicio**.
    *   Haz clic en **"Generar nueva clave privada"**. Esto descargará un archivo JSON.
    *   Usa el contenido de ese archivo para definir las siguientes variables en `.env.local`:
        ```env
        FIREBASE_PROJECT_ID="..."
        FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
        FIREBASE_CLIENT_EMAIL="..."
        ```

#### b) Configuración de API Keys para Webhooks

1.  **Clave para Webhooks Entrantes:**
    Define una clave secreta para proteger tu endpoint de ingesta de datos. Puede ser cualquier cadena de texto segura.

    ```env
    MAKE_API_KEY="tu-clave-secreta-muy-segura"
    ```
    Esta es la clave que usarás en las URLs de los webhooks que configures en Kommo y Shopify.

2.  **Credenciales de Kommo (Opcional):**
    Si deseas que la aplicación pueda consultar la API de Kommo, sigue los pasos en `KOMMO_INTEGRATION.md` y añade las siguientes variables:
    ```env
    KOMMO_SUBDOMAIN=...
    KOMMO_ACCESS_TOKEN=...
    KOMMO_REFRESH_TOKEN=...
    KOMMO_INTEGRATION_ID=...
    KOMMO_SECRET_KEY=...
    ```

### 4. Poblar la Base de Datos con Datos de Ejemplo (`seed`)

Para llenar tu base de datos de Firestore con datos de ejemplo (usuarios, inventario, pedidos y clientes), ejecuta el siguiente script:

**Importante:** Antes de ejecutar, asegúrate de haber creado manualmente en Firebase Authentication el usuario administrador definido en `src/lib/data.ts` (por defecto: `sjaquer@outlook.es`).

```bash
npm run seed
```

### 5. Ejecutar la Aplicación

Una vez completados los pasos anteriores, puedes iniciar la aplicación en modo de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:9002](http://localhost:9002) en tu navegador. Puedes iniciar sesión con las credenciales de los usuarios de ejemplo (la contraseña para todos es `password123`).

---

## ⚙️ Scripts Disponibles

-   `npm run dev`: Inicia el servidor de desarrollo en `http://localhost:9002`.
-   `npm run build`: Compila la aplicación para producción.
-   `npm run start`: Inicia un servidor de producción.
-   `npm run seed`: Puebla la base de datos de Firestore con datos de ejemplo.
-   `npm run lint`: Ejecuta el linter de Next.js para verificar la calidad del código.

---

##  архитектура Arquitectura y Flujo de Datos

### Flujo de Datos Entrantes (Webhooks)

La aplicación centraliza la recepción de datos de servicios externos a través de un único endpoint: `/api/data-ingestion`.

1.  **Autenticación:** El endpoint se protege mediante una `apiKey` en la URL. El valor debe coincidir con la variable de entorno `MAKE_API_KEY`.
2.  **Detección de Origen:** La lógica del endpoint inspecciona la estructura del `payload` JSON para determinar si proviene de **Shopify** (buscando campos como `line_items`) o **Kommo** (buscando `leads[status][0][id]`).
3.  **Procesamiento:**
    *   **Shopify:** Extrae los detalles del cliente y los productos del pedido y crea (o actualiza) un `Client` en Firestore con `source: 'shopify'` y `call_status: 'NUEVO'`. Los productos se guardan en `shopify_items` dentro del documento del cliente.
    *   **Kommo:** Recibe el ID de un lead, consulta la API de Kommo para obtener los detalles completos del contacto asociado, y crea (o actualiza) un `Client` en Firestore con `source: 'kommo'` y `call_status: 'NUEVO'`.
4.  **Cola de Call Center:** Los nuevos documentos en la colección `clients` con estado `NUEVO` aparecen automáticamente en la página `/call-center-queue`, listos para ser procesados por un agente.
