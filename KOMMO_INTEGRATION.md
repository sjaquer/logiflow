# Documentación de la Integración con Kommo

Este documento detalla el funcionamiento, la configuración y las capacidades de la integración entre la aplicación LogiFlow y la plataforma CRM Kommo.

---

## 1. Visión General de la Integración

El objetivo principal de esta integración es lograr una **sincronización bidireccional inteligente** entre Kommo y LogiFlow.

### Flujo 1: Kommo -> LogiFlow (Recepción y Actualización de Leads)

1.  **Evento en Kommo:** Un usuario mueve un *Lead* a una etapa específica (ej. "Para Llamar") o se crea un nuevo lead "No Clasificado".
2.  **Disparo del Webhook:** Kommo envía una notificación (en formato `application/x-www-form-urlencoded` o `JSON`) al endpoint central de LogiFlow.
3.  **Recepción y Enriquecimiento en LogiFlow:**
    *   El endpoint `/api/data-ingestion` de LogiFlow recibe el webhook.
    *   Extrae el `leadId` de la notificación, sin importar el formato del webhook (`status`, `update` o `unsorted`).
    *   **Consulta a la API de Kommo (Paso Clave):** LogiFlow realiza una llamada a `GET /api/v4/leads/{id}` para obtener los detalles completos y actualizados del lead.
    *   De la respuesta, extrae el `contactId` del contacto principal asociado.
    *   Realiza una segunda llamada a `GET /api/v4/contacts/{id}` para obtener los detalles completos del contacto (nombre, teléfono, email, y todos los campos personalizados como DNI, Dirección, etc.).
4.  **Creación/Actualización en LogiFlow:**
    *   Con los datos completos y fiables de la API, LogiFlow busca en su base de datos si ya existe un cliente con el `kommo_lead_id` correspondiente.
    *   Si existe, **actualiza** sus datos con la información más reciente.
    *   Si no existe, **crea un nuevo cliente** en la base de datos de LogiFlow, que aparecerá en la bandeja de entrada del Call Center.

### Flujo 2: LogiFlow -> Kommo (Actualización Directa tras Procesar Pedido)

1.  **Evento en LogiFlow:** Un agente confirma y guarda un nuevo pedido en el formulario "Procesar Pedido" (`/create-order`).
2.  **Llamada a API Interna:** Inmediatamente después de guardar el pedido en Firebase, la aplicación realiza una llamada `fetch` interna al endpoint `/api/kommo/update-lead`. Esta llamada envía el `payload` completo del pedido recién creado.
3.  **Endpoint de Actualización (`/api/kommo/update-lead`):**
    *   Este endpoint está diseñado exclusivamente para comunicarse con la API de Kommo.
    *   Recibe los datos del pedido y verifica que exista un `kommo_lead_id`.
    *   **Mapeo de Datos:** Construye un `payload` para la API de Kommo, asignando los valores de LogiFlow (ej: `pago.monto_total`) a los campos correspondientes en Kommo (ej: `price` y campos personalizados).
4.  **Acción Directa en Kommo:**
    *   El endpoint realiza una llamada `PATCH` a `/api/v4/leads` en la API de Kommo.
    *   Esta llamada actualiza el lead correspondiente con la nueva información y, crucialmente, puede **cambiar la etapa del lead** a una nueva (ej. "Venta Confirmada" o "En Preparación").

---

## 2. Componentes Clave y su Funcionamiento

### a) Endpoint de Ingreso (`/api/data-ingestion`)

-   **Ubicación:** `src/app/api/data-ingestion/route.ts`
-   **Función:** Receptor central de webhooks desde Kommo. Su lógica es robusta para manejar múltiples formatos (`status`, `update`, `unsorted`) y siempre recurre a la API de Kommo para enriquecer los datos.

### b) Lógica de Interacción con la API de Kommo (`/lib/kommo.ts`)

-   **Función:** Centraliza toda la comunicación con la API de Kommo, incluyendo la gestión de tokens, la obtención de detalles de leads/contactos y la actualización de leads.
-   **Credenciales Requeridas:** Para que funcione, las siguientes variables de entorno deben estar configuradas:
    -   `KOMMO_SUBDOMAIN`, `KOMMO_ACCESS_TOKEN`, `KOMMO_INTEGRATION_ID`, `KOMMO_SECRET_KEY`.

### c) Endpoint de Salida (`/api/kommo/update-lead`)

-   **Ubicación:** `src/app/api/kommo/update-lead/route.ts`
-   **Función:** Endpoint interno que se encarga de enviar las actualizaciones directamente a la API de Kommo después de que un pedido es procesado en LogiFlow.

---

## 3. Guía de Configuración

Para configurar todo el sistema desde cero, sigue los pasos de los archivos `README.md` (para la configuración general de Firebase) y la guía detallada en este mismo archivo para obtener las credenciales de Kommo y configurar los webhooks.

### Mapeo de Campos para la Sincronización (LogiFlow -> Kommo)

Cuando se procesa un pedido en LogiFlow, el endpoint `/api/kommo/update-lead` utiliza el siguiente mapeo para actualizar Kommo.

| Campo en Kommo (según tu imagen) | Dato en LogiFlow (Payload del Pedido)             | ID de Campo Personalizado (Ejemplo) |
| -------------------------------- | ------------------------------------------------- | ----------------------------------- |
| `Presupuesto`                    | `pago.monto_total`                                | (Campo Estándar `price`)            |
| `PEDIDO`                         | `id_pedido`                                       | `985570`                            |
| `DIRECCION`                      | `envio.direccion`                                 | `630092`                            |
| `PRODUCTO`                       | (Iterar sobre `items` y unir los `nombre`)        | `630096`                            |
| `TIENDA`                         | `tienda.nombre`                                   | `1002512`                           |
| `PROVINCIA`                      | `envio.provincia`                                 | `630094`                            |
| `COURIER`                        | `envio.courier`                                   | `630104`                            |
| `MONTO PEN...` (Monto Pendiente) | `pago.monto_pendiente`                            | `1002220`                           |
| `NOTA`                           | `notas.nota_pedido`                               | `630108`                            |
| `LINK SHALOM`                    | `envio.link_seguimiento`                          | `1002224`                           |
| `BOLETA SHALOM`                  | `envio.nro_guia`                                  | `1002226`                           |

**Acción Clave:** Además de mapear estos campos, la lógica en `/api/kommo/update-lead` se encarga de cambiar el `status_id` del lead para moverlo a la fase correspondiente de tu embudo (ej. "Venta Confirmada en LogiFlow").
