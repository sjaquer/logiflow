



export type OrderStatus = 'PENDIENTE' | 'EN_PREPARACION' | 'EN_TRANSITO_LIMA' | 'EN_TRANSITO_PROVINCIA' | 'ENTREGADO' | 'ANULADO' | 'RETENIDO';
export type PaymentStatus = 'PENDIENTE' | 'PAGADO';
export type PaymentMethod = 'CONTRAENTREGA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA' | 'Tarjeta de Crédito' | 'Efectivo' | 'Transferencia Bancaria' | 'Desconocido';
export type ShippingType = 'LIMA' | 'PROVINCIA';
export type Courier = 'URBANO' | 'SHALOM' | 'OLVA' | 'INTERNO';
export type Shop = 'Blumi' | 'Cumbre' | 'Dearel' | 'Trazto';
export type OrderItemStatus = 'CONFIRMADO' | 'SIN_STOCK' | 'BACKORDER' | 'PENDIENTE';


export interface OrderItem {
  sku: string;
  nombre: string;
  variante: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  estado_item: OrderItemStatus;
}

export interface Order {
  id_pedido: string;
  id_interno: string;
  tienda: {
    id_tienda: string;
    nombre: Shop;
  };
  estado_actual: OrderStatus;
  cliente: {
    id_cliente: string; 
    nombres: string;
    dni: string;
    celular: string;
    email?: string;
  };
  items: OrderItem[];
  pago: {
    monto_total: number;
    monto_pendiente: number;
    metodo_pago_previsto: PaymentMethod;
    estado_pago: PaymentStatus;
    comprobante_url: string | null;
    fecha_pago: string | null;
  };
  envio: {
    tipo: ShippingType;
    provincia: string;
    distrito: string;
    direccion: string;
    courier: Courier;
    agencia_shalom: string | null;
    nro_guia: string | null;
    link_seguimiento: string | null;
    costo_envio: number;
  };
  asignacion: {
    id_usuario_actual: string;
    nombre_usuario_actual: string;
  };
  historial: {
    fecha: string;
    id_usuario: string;
    nombre_usuario: string;
    accion: string;
    detalle: string;
  }[];
  fechas_clave: {
    creacion: string;
    confirmacion_llamada: string | null;
    procesamiento_iniciado: string | null;
    preparacion: string | null;
    despacho: string | null;
    entrega_estimada: string;
    entrega_real: string | null;
    anulacion: string | null;
  };
  notas: {
    nota_pedido: string;
    observaciones_internas: string;
    motivo_anulacion: string | null;
  };
  source: 'shopify' | 'kommo' | 'manual';
  kommo_lead_id?: string;
  shopify_order_id?: string;
}

export type InventoryStatus = 'ACTIVO' | 'DESCONTINUADO' | 'SIN_STOCK';
export type StockHistoryType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface InventoryItem {
  sku: string;
  id_producto_base: string;
  nombre: string;
  tienda: string;
  descripcion: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion_almacen: string;
  precios: {
    compra: number;
    venta: number;
  };
  proveedor: {
    id_proveedor: string;
    nombre: string;
  };
  estado: InventoryStatus;
  variantes: {
    sku: string;
    talla: string;
    color: string;
    stock: number;
  }[];
  historial_stock: {
    fecha: string;
    tipo: StockHistoryType;
    cantidad: number;
    motivo: string;
  }[];
}

export type UserRole = 'Call Center' | 'Logistica' | 'Empacado' | 'Desarrolladores' | 'Marketing' | 'Jefatura' | 'Admin';

export const USER_ROLES: UserRole[] = ['Call Center', 'Logistica', 'Empacado', 'Desarrolladores', 'Marketing', 'Jefatura', 'Admin'];

export interface User {
  id_usuario: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  permisos: {
    // Permisos de acciones
    puede_crear_pedido: boolean;
    puede_preparar: boolean;
    puede_despachar: boolean;
    puede_confirmar_entrega: boolean;
    puede_anular: boolean;
    puede_gestionar_inventario: boolean;
    puede_ver_reportes: boolean;
    // Permisos de visibilidad de secciones
    puede_ver?: {
      pedidos?: boolean;
      call_center?: boolean;
      procesar_pedido?: boolean;
      clientes?: boolean;
      inventario?: boolean;
      reportes?: boolean;
      staff?: boolean;
    };
  };
  avatar?: string;
}

export type CallStatus = 
  | 'NUEVO' 
  | 'CONTACTADO' 
  | 'NO_CONTESTA' 
  | 'NUMERO_EQUIVOCADO' 
  | 'EN_SEGUIMIENTO' 
  | 'VENTA_CONFIRMADA' 
  | 'HIBERNACION'
  | 'INTENTO_1'
  | 'INTENTO_2'
  | 'INTENTO_3'
  | 'INTENTO_4'
  | 'LEAD_NO_CONTACTABLE'
  | 'LEAD_PERDIDO';


export interface Client {
    id: string; // Document ID from Firestore (unique, auto-generated)
    dni?: string;
    nombres: string;
    celular: string;
    email?: string;
    direccion?: string;
    distrito?: string;
    provincia?: string;
    source: 'kommo' | 'manual' | 'shopify';
    last_updated: string;
    tienda_origen?: Shop;
    
    // Fields for Call Center workflow
    call_status: CallStatus;
    assigned_agent_id?: string;
    assigned_agent_name?: string;
    assigned_agent_avatar?: string;
    first_interaction_at?: string; 
    
    // For leads coming from Kommo
    kommo_lead_id?: string;
    kommo_contact_id?: number;
    etapa_kommo?: string; // e.g. "Llamada inicial"

    // For leads coming from Shopify
    shopify_order_id?: string;
    shopify_items?: OrderItem[];
    shopify_payment_details?: {
      total_price: number;
      subtotal_price: number;
      total_shipping: number;
      payment_gateway: string;
    }
    etapa_shopify?: string; // e.g. "unfulfilled"

    // Generic fields
    producto?: string;
    notas_agente?: string;
}


// --- FILTERS ---
export interface Filters {
  shops: Shop[];
  assignedUserIds: string[];
  statuses: OrderStatus[];
  paymentMethods: PaymentMethod[];
  couriers: Courier[];
  dateRange: { from?: Date; to?: Date };
}

// --- WEBHOOKS ---
export type WebhookEvent = 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'STOCK_CONFIRMED' | 'ORDER_CANCELLED';

export const WEBHOOK_EVENTS: { value: WebhookEvent, label: string }[] = [
    { value: 'ORDER_CREATED', label: 'Pedido Creado' },
    { value: 'ORDER_STATUS_CHANGED', label: 'Cambio de Estado de Pedido' },
    { value: 'ORDER_CANCELLED', label: 'Pedido Anulado' },
    { value: 'STOCK_CONFIRMED', label: 'Stock Confirmado' },
];

export interface Webhook {
    id?: string;
    name: string;
    url: string;
    event: WebhookEvent;
    active: boolean;
    createdAt: string;
}


    

    