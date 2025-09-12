# Guía de Integración de Webhooks

Este documento proporciona las URLs y las instrucciones necesarias para integrar servicios externos con la aplicación LogiFlow a través de webhooks.

---

## 1. URL del Endpoint Principal

La aplicación utiliza un único endpoint centralizado para recibir datos de diferentes servicios. Este endpoint es:

`/api/data-ingestion`

---

## 2. Mecanismo de Seguridad: API Key

Para garantizar que solo los servicios autorizados puedan enviar datos a tu aplicación, todas las solicitudes de webhook deben incluir una clave secreta en la URL.

*   **Parámetro:** `apiKey`
*   **Variable de Entorno:** El valor de esta clave secreta se almacena en la variable de entorno `MAKE_API_KEY` en tu proyecto de Vercel.

---

## 3. Formato de la URL Completa

Para construir la URL completa que debes pegar en el servicio externo (Kommo, Shopify, etc.), sigue este formato:

**`https://[TU_DOMINIO_VERCEL]/api/data-ingestion?apiKey=[TU_CLAVE_SECRETA]`**

### Desglose:

*   **`https://[TU_DOMINIO_VERCEL]`**: Reemplaza esto con el dominio principal de tu aplicación desplegada en Vercel.
    *   *Ejemplo:* `https://flujologistico.vercel.app`

*   **`[TU_CLAVE_SECRETA]`**: Reemplaza esto con el valor exacto que tienes guardado en la variable de entorno `MAKE_API_KEY`.

---

## 4. Ejemplos de URLs para Servicios

Aquí tienes las URLs listas para copiar y pegar en la configuración de cada servicio, asumiendo que tu dominio es `flujologistico.vercel.app` y tu API Key es la que está en Vercel. **Solo necesitas verificar y usar tu propia API Key.**

### a) Para Kommo

*   **Evento recomendado:** "Cuando un lead cambia de etapa" (ej. al moverlo a "Para Llamar").
*   **URL a usar en Kommo:**
    ```
    https://flujologistico.vercel.app/api/data-ingestion?apiKey=[TU_CLAVE_SECRETA]
    ```

### b) Para Shopify

*   **Evento recomendado:** "Creación de pedido" (Order creation).
*   **Formato:** JSON
*   **URL a usar en Shopify:**
    ```
    https://flujologistico.vercel.app/api/data-ingestion?apiKey=[TU_CLAVE_SECRETA]
    ```

Con este archivo, tendrás un lugar central y seguro para consultar cómo conectar nuevos servicios a tu aplicación.