export type OrderStatus = 'PENDIENTE' | 'EN_PREPARACION' | 'PREPARADO' | 'EN_TRANSITO_LIMA' | 'EN_TRANSITO_PROVINCIA' | 'ENTREGADO' | 'ANULADO' | 'RETENIDO';
export type PaymentStatus = 'PENDIENTE' | 'PAGADO';
export type PaymentMethod = 'CONTRAENTREGA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA';
export type ShippingType = 'LIMA' | 'PROVINCIA';
export type Courier = 'MOTORIZADO INTERNO' | 'SHALOM' | 'OLVA';

export interface Order {
  id_pedido: string;
  id_interno: string;
  tienda: {
    id_tienda: string;
    nombre: string;
  };
  estado_actual: OrderStatus;
  cliente: {
    id_cliente: string;
    nombres: string;
    dni: string | null;
    celular: string;
  };
  items: {
    sku: string;
    nombre: string;
    variante: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
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

export type UserRole = 'OPERADOR_LOGISTICO' | 'ADMIN' | 'VENTAS';

export interface User {
  id_usuario: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  permisos: {
    puede_crear_pedido: boolean;
    puede_preparar: boolean;
    puede_despachar: boolean;
    puede_confirmar_entrega: boolean;
    puede_anular: boolean;
    puede_gestionar_inventario: boolean;
    puede_ver_reportes: boolean;
  };
  avatar?: string; // Avatar es opcional ahora
}


// --- Tipos antiguos para mantener compatibilidad temporal ---
// --- Serán eliminados una vez la migración se complete ---

export type OrderItemStatus = 'CONFIRMADO' | 'SIN_STOCK' | 'BACKORDER' | 'PENDIENTE';

export interface LegacyOrderItem {
  itemId: string;
  quantity: number;
  estado_item: OrderItemStatus;
}

export type LegacyShop = 'Tienda Online' | 'Tienda Física' | 'Marketplace';
export type LegacyPaymentMethod = 'Tarjeta de Crédito' | 'Transferencia Bancaria' | 'Efectivo';
export type LegacyCourier = 'URBANO' | 'SHALOM' | 'OLVA' | 'INTERNO';

export interface LegacyOrder {
  id: string;
  client: {
    name: string;
    address: string;
  };
  shop: LegacyShop;
  items: LegacyOrderItem[];
  totalAmount: number;
  paymentMethod: LegacyPaymentMethod;
  estado_pago: 'PAGADO' | 'PENDIENTE';
  assignedUserId: string;
  courier: LegacyCourier;
  fecha_creacion: string;
  fecha_preparacion?: string;
  fecha_transito?: string;
  fecha_estimada_entrega: string;
  fecha_entrega_real?: string;
  estado_actual: OrderStatus;
  trackingNumber?: string;
}

export interface LegacyInventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  stock: number;
  lowStockThreshold: number;
  location: string;
  price: number;
  supplier: string;
  isDiscontinued: boolean;
}

export type LegacyUserRole = 'OPERADOR_LOGISTICO' | 'ADMINISTRADOR' | 'GERENTE';

export interface LegacyUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: LegacyUserRole;
}
