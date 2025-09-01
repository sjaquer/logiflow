import type { OrderStatus, OrderItemStatus, Shop, Courier, PaymentMethod } from './types';

export const KANBAN_COLUMNS: { id: OrderStatus; title: string }[] = [
  { id: 'PENDIENTE', title: 'Pending' },
  { id: 'EN_PREPARACION', title: 'In Preparation' },
  { id: 'EN_TRANSITO_LIMA', title: 'In Transit (Lima)' },
  { id: 'EN_TRANSITO_PROVINCIA', title: 'In Transit (Provinces)' },
  { id: 'ENTREGADO', title: 'Delivered' },
  { id: 'RETENIDO', title: 'Held' },
  { id: 'ANULADO', title: 'Cancelled' },
];

export const STATUS_ICON_MAP: Record<OrderStatus, string> = {
  PENDIENTE: 'Hourglass',
  EN_PREPARACION: 'PackageSearch',
  EN_TRANSITO_LIMA: 'Truck',
  EN_TRANSITO_PROVINCIA: 'Plane',
  ENTREGADO: 'PackageCheck',
  ANULADO: 'XCircle',
  RETENIDO: 'PauseCircle',
};

export const ITEM_STATUS_BADGE_MAP: Record<OrderItemStatus, 'default' | 'success' | 'destructive' | 'secondary'> = {
    PENDIENTE: 'default',
    CONFIRMADO: 'success',
    SIN_STOCK: 'destructive',
    BACKORDER: 'secondary',
}

export const SHOPS: Shop[] = ['Tienda Online', 'Tienda Fisica', 'Marketplace'];
export const COURIERS: Courier[] = ['URBANO', 'SHALOM', 'OLVA', 'INTERNO'];
export const PAYMENT_METHODS: PaymentMethod[] = ['Credit Card', 'Bank Transfer', 'Cash'];
