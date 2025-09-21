# Documentación de la Integración con Kommo

Este documento detalla el funcionamiento, la configuración y las capacidades de la integración entre la aplicación LogiFlow y la plataforma CRM Kommo.

---

## 1. Visión General de la Integración

El objetivo principal de esta integración es lograr una **sincronización bidireccional inteligente** entre Kommo y LogiFlow.

### Flujo 1: Kommo -> LogiFlow (Nuevos Leads)

1.  **Evento en Kommo:** Un usuario mueve un *Lead* a una etapa específica (ej. "Para Llamar") o se crea un nuevo lead "No Clasificado".
2.  **Disparo del Webhook:** Kommo envía una notificación a LogiFlow. Esta notificación puede ser mínima.
3.  **Recepción y Enriquecimiento en LogiFlow:**
    *   El endpoint `/api/data-ingestion` de LogiFlow recibe el webhook.
    *   Extrae el `leadId` de la notificación.
    *   **Consulta a la API de Kommo:** LogiFlow realiza llamadas a la API de Kommo para obtener los detalles completos y actualizados tanto del lead como del contacto principal asociado.
4.  **Creación/Actualización en LogiFlow:**
    *   Con los datos completos, LogiFlow busca si ya existe un cliente con el `kommo_lead_id` correspondiente.
    *   Si existe, **actualiza** sus datos.
    *   Si no existe, **crea un nuevo cliente** en la base de datos de LogiFlow, que aparecerá en la bandeja de entrada del Call Center.

### Flujo 2: LogiFlow -> Kommo (Pedidos Procesados)

1.  **Evento en LogiFlow:** Un agente confirma y guarda un nuevo pedido en el formulario "Procesar Pedido". Esto dispara el evento `ORDER_CREATED`.
2.  **Webhook de Salida de LogiFlow:** LogiFlow envía una notificación a un servicio intermediario (como Make.com o Zapier). Este webhook incluye todos los detalles del pedido, **incluyendo el `kommo_lead_id`** que se guardó en el flujo anterior.
3.  **Acción en Kommo vía Make/Zapier:**
    *   El escenario en Make/Zapier recibe los datos.
    *   Utiliza el `kommo_lead_id` para encontrar el lead correcto en Kommo.
    *   **Actualiza el lead en Kommo:**
        *   Rellena campos personalizados con la información de LogiFlow (ej. `Courier`, `Monto Total`, `Estado del Pedido`).
        *   **Cambia la etapa del lead** a una nueva (ej. "Venta Confirmada" o "En Preparación").

---

## 2. Componentes Clave y su Funcionamiento

### a) Endpoint de LogiFlow (`/api/data-ingestion`)

-   **Ubicación:** `src/app/api/data-ingestion/route.ts`
-   **Función:** Receptor central de webhooks. Su lógica es robusta para manejar múltiples formatos de Kommo (`status`, `update`, `unsorted`) y también de Shopify.

### b) Lógica de Interacción con la API de Kommo (`/lib/kommo.ts`)

-   **Función:** Centraliza toda la comunicación con la API de Kommo, incluyendo la gestión de tokens de acceso y las llamadas para obtener detalles de leads y contactos.
-   **Credenciales Requeridas:** Para que funcione, las siguientes variables de entorno deben estar configuradas:
    -   `KOMMO_SUBDOMAIN`, `KOMMO_ACCESS_TOKEN`, `KOMMO_INTEGRATION_ID`, `KOMMO_SECRET_KEY`.

---

## 3. Mapeo de Campos para la Sincronización (LogiFlow -> Kommo)

Cuando configures tu escenario en **Make/Zapier** para actualizar Kommo, utiliza el siguiente mapeo como referencia. Estos son los datos que LogiFlow envía en el evento `ORDER_CREATED`.

| Campo en Kommo (según tu imagen) | Dato en LogiFlow (Payload del Webhook)            | Ejemplo de Valor         |
| -------------------------------- | ------------------------------------------------- | ------------------------ |
| `Usuario resp.`                  | `asignacion.nombre_usuario_actual`                | "Carlos Solis"           |
| `Presupuesto`                    | `pago.monto_total`                                | 185.00                   |
| `PEDIDO`                         | `id_pedido`                                       | "PED-1700000000"         |
| `DIRECCION`                      | `envio.direccion`                                 | "Av. La Marina 123"      |
| `PRODUCTO`                       | (Iterar sobre `items` y unir los `nombre`)        | "Zapatilla, Mochila"     |
| `TIENDA`                         | `tienda.nombre`                                   | "Trazto"                 |
| `NOMBRE`                         | `cliente.nombres`                                 | "Juan Pérez"             |
| `PROVINCIA`                      | `envio.provincia`                                 | "Lima"                   |
| `DNI`                            | `cliente.dni`                                     | "45678912"               |
| `OFIC. SHALOM`                   | `envio.agencia_shalom`                            | "Agencia Arequipa Centro"|
| `COURIER`                        | `envio.courier`                                   | "SHALOM"                 |
| `ATENDIDO`                       | `asignacion.nombre_usuario_actual`                | "Carlos Solis"           |
| `MONTO PEN...` (Monto Pendiente) | `pago.monto_pendiente`                            | 185.00                   |
| `NOTA`                           | `notas.nota_pedido`                               | "Entregar en portería."  |
| `LINK SHALOM`                    | `envio.link_seguimiento`                          | "https://shalom.com/..." |
| `BOLETA SHALOM`                  | `envio.nro_guia`                                  | "SH-55-2023-9876"        |
| `ETIQUETA 1`                     | `tienda.nombre` (o un campo específico si se crea) | "Trazto"                 |

**Acción Clave:** Además de mapear estos campos, el paso más importante en Make/Zapier es añadir una acción para **"Cambiar la Etapa de un Lead"**, moviéndolo a la fase correspondiente de tu embudo (ej. "Venta Confirmada en LogiFlow").

---

## 4. Guía de Configuración

Para configurar todo el sistema desde cero, sigue los pasos de los archivos `README.md` (para la configuración general de Firebase) y la guía detallada en este mismo archivo para obtener las credenciales de Kommo y configurar los webhooks.

    