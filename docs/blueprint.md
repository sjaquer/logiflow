# **App Name**: Logistics Flow

## Core Features:

- Order Management (Kanban): Display orders in a Kanban board. Columns map to JSON states: 'Pending' (estado_actual = 'PENDIENTE'), 'In Preparation' (estado_actual = 'EN_PREPARACION'), 'In Transit (Lima)' (estado_actual = 'EN_TRANSITO_LIMA'), 'In Transit (Provinces)' (estado_actual = 'EN_TRANSITO_PROVINCIA'), 'Delivered' (estado_actual = 'ENTREGADO'), 'Cancelled' (estado_actual = 'ANULADO'), 'Held' (estado_actual = 'RETENIDO'). Automatically move cards between columns based on the 'estado_actual' field in the order JSON.
- Inventory Management: Allow users to view and manage inventory levels. Display stock, location, prices, and supplier information for each item.
- User Role Management: Implement user role and permission management. Define roles such as 'OPERADOR_LOGISTICO' with specific permissions like creating orders, preparing shipments, managing inventory, etc.
- Order Stock Checker Tool: A tool will compare a new order to the current stock, in order to advise users with the `puede_preparar` permission regarding whether to fulfill it. This may assist operators in determining if stock levels are sufficient, or whether partial fulfillment or backorders need to be considered. The recommendation can be reflected in the JSON of items within the order using 'estado_item': 'CONFIRMADO' // options: CONFIRMADO, SIN_STOCK, BACKORDER. Firestore is the primary data source; the tool provides decision support and is not a source of truth.
- Dynamic Filtering: Implement dynamic filtering on the Orders view by shop, responsible user, status, payment method, courier, and date. Filtering results are derived directly from the JSON data.
- Real-time Notifications: Implement real-time notifications for events like low stock, delayed orders (detected by comparing fecha_estimada_entrega vs fecha_entrega_real), pending payments, held orders, cancelled orders, and discontinued products. Pull directly from the JSON objects to create.
- Reporting: Provide dynamic reports such as order summaries (created, delivered, cancelled), sales by shop/user/courier, inventory levels and turn-over, and average process times (creation to preparation, preparation to transit, transit to delivery), and inventory rotation (sales ÷ stock average). These reports are generated directly from the JSON objects.
- Order Card Details: Display minimal information on order cards in the Kanban board (e.g., client, shop, products, amount due, assigned user). Show additional details in a modal or expandable section.

## Style Guidelines:

- Primary color: Vivid blue (#29ABE2) to convey trust, efficiency, and reliability, as appropriate for logistical operations.
- Background color: Light gray (#F0F8FF), a very pale blue tone that is easy on the eyes and gives the interface a clean, modern feel.
- Accent color: Bright orange (#FFA500), contrasting well with the blue to highlight important actions and notifications.
- Body and headline font: 'Inter' (sans-serif), a modern, neutral typeface ensuring readability and a professional aesthetic.
- Use clear, simple icons to represent order status, inventory items, and user roles. Icons should be consistent and easily recognizable.
- The layout will focus on maximizing data density and usability. The Kanban board should be the central element, with clear column headers and concise information on each card.
- Use subtle transitions and animations to provide feedback on user interactions. For example, cards smoothly transition between columns on status updates. This maintains clarity while helping guide the user's attention.