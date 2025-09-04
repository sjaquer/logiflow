export type OrderStatus = 'PENDIENTE' | 'EN_PREPARACION' | 'PREPARADO' | 'EN_TRANSITO_LIMA' | 'EN_TRANSITO_PROVINCIA' | 'ENTREGADO' | 'ANULADO' | 'RETENIDO';
export type PaymentStatus = 'PENDIENTE' | 'PAGADO';
export type PaymentMethod = 'CONTRAENTREGA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA' | 'Tarjeta de Crédito' | 'Efectivo' | 'Transferencia Bancaria';
export type ShippingType = 'LIMA' | 'PROVINCIA';
export type Courier = 'MOTORIZADO INTERNO' | 'SHALOM' | 'OLVA' | 'INTERNO';
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
    dni: string | null;
    celular: string;
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

export type UserRole = 'OPERADOR_LOGISTICO' | 'ADMIN' | 'VENTAS' | 'ADMINISTRADOR' | 'GERENTE';

export const USER_ROLES: UserRole[] = ['OPERADOR_LOGISTICO', 'ADMIN', 'VENTAS', 'ADMINISTRADOR', 'GERENTE'];

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
  avatar?: string;
}
