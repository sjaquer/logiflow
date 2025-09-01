export type UserRole = 'OPERADOR_LOGISTICO' | 'ADMINISTRADOR' | 'GERENTE';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
}

export interface InventoryItem {
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

export type OrderItemStatus = 'CONFIRMADO' | 'SIN_STOCK' | 'BACKORDER' | 'PENDIENTE';

export interface OrderItem {
  itemId: string;
  quantity: number;
  estado_item: OrderItemStatus;
}

export type OrderStatus = 'PENDIENTE' | 'EN_PREPARACION' | 'EN_TRANSITO_LIMA' | 'EN_TRANSITO_PROVINCIA' | 'ENTREGADO' | 'ANULADO' | 'RETENIDO';
export type PaymentMethod = 'Credit Card' | 'Bank Transfer' | 'Cash';
export type Courier = 'URBANO' | 'SHALOM' | 'OLVA' | 'INTERNO';
export type Shop = 'Tienda Online' | 'Tienda Fisica' | 'Marketplace';

export interface Order {
  id: string;
  client: {
    name: string;
    address: string;
  };
  shop: Shop;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  estado_pago: 'PAGADO' | 'PENDIENTE';
  assignedUserId: string;
  courier: Courier;
  fecha_creacion: string;
  fecha_preparacion?: string;
  fecha_transito?: string;
  fecha_estimada_entrega: string;
  fecha_entrega_real?: string;
  estado_actual: OrderStatus;
  trackingNumber?: string;
}
