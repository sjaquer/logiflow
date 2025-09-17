# Propuesta de Evolución y Hoja de Ruta Técnica para LogiFlow

**Para:** Gerencia y Equipo de Desarrollo  
**De:** [Tu Nombre/Departamento]  
**Fecha:** [Fecha Actual]  
**Asunto:** Plan técnico para la siguiente fase de mejoras estratégicas del sistema LogiGlow.

---

## 1. Resumen Ejecutivo

LogiFlow ha demostrado ser una herramienta central para la optimización de nuestro flujo de ventas y logística. La primera fase de integración ha validado la capacidad del sistema para centralizar leads y estandarizar la creación de pedidos.

Esta propuesta detalla la siguiente fase de evolución, enfocada en transformar LogiFlow en un centro de operaciones aún más inteligente y automatizado. Los cambios propuestos se centran en tres pilares: **optimización de la interfaz de usuario para el Call Center**, **sincronización avanzada de inventario y datos**, e **integración profunda con plataformas externas** como Shopify y otros sistemas logísticos.

El objetivo es reducir la carga operativa, automatizar la sincronización de datos de inventario y pedidos, y proporcionar herramientas analíticas para la toma de decisiones.

---

## 2. Plan Técnico de Próximas Mejoras

A continuación, se detalla la hoja de ruta técnica de las funcionalidades a implementar.

### 2.1. Módulo 1: Rediseño de la Interfaz del Call Center y Seguimiento

**Objetivo:** Crear una interfaz unificada y más potente para la gestión de leads y el seguimiento de pedidos, inspirada en la eficiencia de un CRM como Kommo.

-   **Nueva Interfaz de Call Center:**
    -   **Descripción Técnica:** Se reemplazará la tabla actual por una vista de "bandeja de entrada" más interactiva. Se utilizarán componentes de tabla avanzada con funcionalidades de ordenamiento, búsqueda facetada en tiempo real y filtros persistentes en la URL.
    -   **Implementación:**
        -   Se construirá una nueva página o se refactorizará `/call-center-queue`.
        -   Se implementará una tabla utilizando `shadcn/ui/table` con columnas personalizables y renderizado condicional para mostrar información clave (tiempo de espera, agente asignado, tienda, etc.).
        -   Se añadirá una vista de "seguimiento de pedidos" en la misma sección, permitiendo al agente ver el estado de los pedidos que ha generado sin salir de su entorno.

### 2.2. Módulo 2: Aislamiento del Módulo "Procesar Pedido"

**Objetivo:** Refinar la página de "Procesar Pedido" para que sea una herramienta exclusivamente dedicada al llenado inteligente de datos del cliente y a la gestión de los productos del pedido.

-   **Enfoque en Llenado Inteligente:**
    -   **Descripción Técnica:** La página se centrará en la validación y completado de datos. El formulario de cliente será el protagonista, con una búsqueda de DNI/RUC que podría autocompletar datos usando una API externa (como la de SUNAT/RENIEC, si se integra).
    -   **Implementación:**
        -   Se reestructurará la UI de `/create-order` para dar prioridad al formulario del cliente.
        -   La gestión de productos se mantendrá, pero optimizada para una selección y ajuste rápido de cantidades, con validación de stock en tiempo real contra la base de datos.

### 2.3. Módulo 3: Sincronización y Gestión Avanzada de Inventario

**Objetivo:** Unificar el inventario de múltiples fuentes (Excel, Shopify) con la base de datos de LogiFlow, estableciendo el SKU como la clave única y universal.

-   **Unificación de Inventario (Excel y Base de Datos):**
    -   **Descripción Técnica:** Se creará un script o un proceso de backend que pueda leer un archivo Excel (o CSV) y realizar una operación de "upsert" (actualizar o insertar) en la colección `inventory` de Firestore, utilizando el `sku` como la clave de coincidencia.
    -   **Implementación:**
        -   Se desarrollará una función (posiblemente en una Cloud Function o un endpoint de API seguro) que parsee el archivo y ejecute una escritura por lotes (`writeBatch`) en Firestore para actualizar el stock, precios y otros campos.

-   **Nueva Sección de Importación de Datos (Excel):**
    -   **Descripción Técnica:** Se creará una nueva página en la interfaz, protegida para roles de administrador, que permita subir un archivo Excel.
    -   **Implementación:**
        -   La interfaz tendrá un componente de carga de archivos.
        -   Al subirlo, el frontend enviará el archivo a un endpoint de API que procesará los datos y los sincronizará con la base de datos de inventario.

-   **Actualización de SKU en Shopify:**
    -   **Descripción Técnica:** Se implementará una lógica que, al actualizar un producto en LogiFlow, pueda conectarse a la API de Shopify para actualizar el campo SKU del producto correspondiente, manteniendo la consistencia entre ambas plataformas.

### 2.4. Módulo 4: Integraciones y Automatización de Flujos

**Objetivo:** Crear un ecosistema conectado donde LogiFlow actúe como el orquestador central entre el CRM, el eCommerce y la logística.

-   **Filtro por Rol de Tienda:**
    -   **Descripción Técnica:** Se extenderá el modelo de datos del `User` para incluir un campo `tiendas_asignadas` (un array de strings). Los listados de pedidos y leads se filtrarán automáticamente basándose en las tiendas asignadas al usuario que ha iniciado sesión.
    -   **Implementación:** Se modificarán las consultas a Firestore en las páginas clave (`/orders`, `/call-center-queue`) para incluir una cláusula `where('tienda.nombre', 'in', currentUser.tiendas_asignadas)`.

-   **Actualización de Estado de Pedido en Shopify:**
    -   **Descripción Técnica:** Cuando un pedido originado en Shopify se marque como `VENTA_CONFIRMADA` en LogiFlow, se disparará un webhook o una función de servidor que se conecte a la API de Shopify para actualizar el estado de ese pedido (por ejemplo, añadiendo una etiqueta "Confirmado por Call Center" o cambiando su estado de `fulfillment`).

-   **Conexión con Sistema Logístico Externo:**
    -   **Descripción Técnica:** Se definirá un contrato de API (endpoints, payloads) para la comunicación con el sistema logístico. Cuando un pedido en LogiFlow alcance el estado `EN_PREPARACION` o `DESPACHADO`, se enviará una solicitud POST a un endpoint del sistema logístico con los detalles del pedido.
    -   **Implementación:** Se utilizará la funcionalidad de Webhooks salientes ya existente en LogiFlow, configurando un nuevo webhook para el evento `ORDER_STATUS_CHANGED` que apunte al endpoint del sistema logístico.

### 2.5. Módulo 5: Análisis y Reportes Avanzados

**Objetivo:** Proveer herramientas para identificar cuellos de botella y oportunidades de mejora en el proceso de ventas.

-   **Sección de Análisis de Pedidos Incompletos:**
    -   **Descripción Técnica:** Se creará una nueva página de reportes dedicada a analizar los leads que no se convirtieron en venta.
    -   **Implementación:**
        -   La página mostrará métricas sobre los leads en estados como `NO_CONTESTA`, `NUMERO_EQUIVOCADO`, o `HIBERNACION`.
        -   Se incluirán gráficos que desglosen estos leads por origen (Shopify, Kommo), por tienda y por agente, permitiendo identificar patrones (ej. un producto específico de Shopify que genera muchos leads que no contestan).

---

## 3. Conclusión

Esta hoja de ruta representa una inversión estratégica en la automatización y la inteligencia de negocio. Al completar estas mejoras, LogiFlow no solo optimizará el trabajo del Call Center, sino que se convertirá en el núcleo de un ecosistema de ventas y logística altamente eficiente y sincronizado.
