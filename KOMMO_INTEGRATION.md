# Documentación de la Integración con Kommo

Este documento detalla el funcionamiento, la configuración y las capacidades de la integración entre la aplicación LogiFlow y la plataforma CRM Kommo.

---

## 1. Visión General de la Integración

El objetivo principal de esta integración es **automatizar la creación y actualización de clientes en LogiFlow** basándose en las acciones que ocurren en un embudo de ventas de Kommo.

El flujo de trabajo es el siguiente:

1.  **Evento en Kommo:** Un usuario mueve un *Lead* (prospecto) a una etapa específica del embudo de ventas (ej. "Venta Confirmada").
2.  **Disparo del Webhook:** Kommo envía automáticamente una notificación (un *webhook*) a un endpoint específico de la aplicación LogiFlow. Esta notificación es mínima y solo contiene el ID del lead que cambió de estado.
3.  **Recepción en LogiFlow:** El endpoint `/api/data-ingestion` de LogiFlow recibe el webhook. Primero, verifica una clave secreta en la URL para asegurarse de que la solicitud es legítima.
4.  **Consulta a la API de Kommo:** Si la solicitud es segura, LogiFlow utiliza el ID del lead para "preguntarle" a la API de Kommo más detalles sobre ese lead.
5.  **Obtención de Datos del Contacto:** La primera consulta revela el ID del contacto principal asociado al lead. LogiFlow realiza una segunda consulta a la API de Kommo para obtener los detalles completos de ese contacto, incluyendo campos personalizados como DNI, dirección, etc.
6.  **Guardado en Firestore:** Con toda la información del cliente, LogiFlow la limpia, la organiza y crea o actualiza un documento en la colección `clients` de la base de datos Firestore.

---

## 2. Componentes Clave y su Funcionamiento

### a) Endpoint de LogiFlow (`/api/data-ingestion`)

-   **Ubicación del código:** `src/app/api/data-ingestion/route.ts`
-   **Función:** Es un *endpoint* (una URL específica) que actúa como el receptor de las notificaciones de Kommo. Está construido como una *Serverless Function* en Vercel.

#### Mecanismo de Seguridad

El endpoint está protegido para evitar que cualquiera pueda enviarle datos.
-   **Método:** Autenticación por **API Key en Parámetro de Consulta (Query Parameter)**.
-   **Implementación:** La URL del webhook configurada en Kommo debe incluir una clave secreta.
    -   `https://[tu-dominio].vercel.app/api/data-ingestion?apiKey=[TU_CLAVE_SECRETA]`
-   **Verificación:** El código del endpoint extrae el valor del parámetro `apiKey` de la URL y lo compara con el valor guardado en la variable de entorno `MAKE_API_KEY` en Vercel. Si no coinciden, la solicitud se rechaza.

### b) Lógica de Interacción con la API de Kommo

-   **Ubicación del código:** `src/lib/kommo.ts`
-   **Función:** Este archivo centraliza toda la comunicación con la API de Kommo.

#### Autenticación

-   **Método:** La aplicación utiliza un **Token de Acceso de Larga Duración** para autenticarse en cada llamada a la API de Kommo.
-   **Credenciales Requeridas:** Para que la autenticación funcione, las siguientes variables de entorno deben estar configuradas en Vercel:
    -   `KOMMO_SUBDOMAIN`: El subdominio de tu cuenta de Kommo (ej: `empresa123`).
    -   `KOMMO_ACCESS_TOKEN`: El token de larga duración.
    -   `KOMMO_INTEGRATION_ID`: El ID de tu integración privada en Kommo.
    -   `KOMMO_SECRET_KEY`: La clave secreta de tu integración privada.

---

## 3. Guía de Configuración para una Nueva Cuenta de Kommo

Para replicar esta integración en una cuenta de Kommo diferente, sigue estos pasos:

### Paso 1: Crear una Integración Privada en Kommo

1.  En tu nueva cuenta de Kommo, ve a **Settings > Integrations**.
2.  Haz clic en **"Create Integration"** y selecciona **"Private"**.
3.  **Configura la Integración:**
    -   **Redirect URI:** `https://[tu-nuevo-dominio-vercel].vercel.app`
    -   **Grant access to:** Marca todas las casillas (CRM, Files, Notifications, etc.) para asegurar permisos completos.
    -   **Integration name:** Dale un nombre descriptivo, como "LogiFlow App".
4.  **Guarda y Obtén las Claves:** Al guardar, Kommo te proporcionará:
    -   **Secret key**
    -   **Integration ID**
    -   **Authorization code**

### Paso 2: Generar el Token de Larga Duración

Kommo no proporciona el token de larga duración directamente. Debes generarlo a través de su interfaz.

1.  Dentro de la configuración de la integración que acabas de crear, ve a la pestaña **"Keys and Scopes"**.
2.  Busca la sección para generar un "Long-lived access token".
3.  Copia el token generado. Este será tu `KOMMO_ACCESS_TOKEN`.

### Paso 3: Configurar las Variables de Entorno en Vercel

1.  Ve a tu nuevo proyecto de Vercel.
2.  Navega a **Settings > Environment Variables**.
3.  Añade las siguientes variables:
    -   `KOMMO_SUBDOMAIN`: El subdominio de la nueva cuenta.
    -   `KOMMO_INTEGRATION_ID`: El ID de integración del Paso 1.
    -   `KOMMO_SECRET_KEY`: La clave secreta del Paso 1.
    -   `KOMMO_ACCESS_TOKEN`: El token de larga duración del Paso 2.
    -   `MAKE_API_KEY`: **Crea una nueva clave secreta** (puedes usar un generador de contraseñas online). Esta clave es para la seguridad entre Kommo y tu app, no la que te da Kommo.

### Paso 4: Configurar el Webhook en Kommo

1.  En Kommo, ve a la configuración del embudo de ventas (**Deals > Setup**).
2.  Elige la etapa que disparará la acción (ej. "Venta Confirmada").
3.  Añade una acción automática del tipo **"Webhook"**.
4.  En el campo URL, pega la URL de tu endpoint, incluyendo la `MAKE_API_KEY` que creaste:
    ```
    https://[tu-nuevo-dominio-vercel].vercel.app/api/data-ingestion?apiKey=[tu-nueva-MAKE_API_KEY]
    ```
5.  Guarda todos los cambios.

---

## 4. Capacidades Actuales y Posibles Mejoras

### Lo que la integración SÍ hace:

-   **Crea un nuevo cliente** en Firestore cuando un lead cambia de estado en Kommo.
-   **Actualiza un cliente existente** si el webhook se dispara para un cliente (identificado por DNI) que ya existe en Firestore.
-   **Extrae campos personalizados** del contacto en Kommo (DNI, Celular, Email, Dirección, Distrito).

### Posibles Mejoras y Expansiones (Lo que SE PUEDE hacer):

-   **Sincronización Bidireccional:** Se podría configurar un webhook en LogiFlow (usando la sección de "Gestión de Webhooks") para que, cuando un pedido se marca como "Entregado", se actualice el estado del lead correspondiente en Kommo a "Ganado".
-   **Creación de Pedidos desde Kommo:** Se podría expandir la lógica para que, además de crear el cliente, se cree un "borrador de pedido" en LogiFlow, asignado al cliente recién creado. Esto requeriría campos personalizados adicionales en el lead de Kommo (ej. "SKU del Producto", "Tienda de Origen").
-   **Manejo de Múltiples Contactos:** La lógica actual solo toma el primer contacto asociado al lead. Se podría mejorar para manejar leads que tengan múltiples contactos.
-   **Registro de Errores Avanzado:** Aunque los errores se registran en los logs de Vercel, se podría implementar un sistema para enviar notificaciones (ej. por email) si un webhook falla repetidamente, para alertar a un administrador.
