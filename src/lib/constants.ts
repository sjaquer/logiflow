
import type { OrderStatus, OrderItemStatus, Shop, Courier, PaymentMethod, CallStatus } from './types';

export const KANBAN_COLUMNS: { id: OrderStatus; title: string }[] = [
  { id: 'PENDIENTE', title: 'Pendiente' },
  { id: 'EN_PREPARACION', title: 'En Preparación' },
  { id: 'EN_TRANSITO_LIMA', title: 'En Tránsito (Lima)' },
  { id: 'EN_TRANSITO_PROVINCIA', title: 'En Tránsito (Provincias)' },
  { id: 'ENTREGADO', title: 'Entregado' },
  { id: 'RETENIDO', title: 'Retenido' },
  { id: 'ANULADO', title: 'Anulado' },
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

export const CALL_STATUS_BADGE_MAP: Record<CallStatus, 'default' | 'success' | 'destructive' | 'secondary' | 'accent' | 'outline'> = {
    NUEVO: 'accent',
    CONTACTADO: 'default',
    NO_CONTESTA: 'secondary',
    NUMERO_EQUIVOCADO: 'destructive',
    EN_SEGUIMIENTO: 'outline',
    VENTA_CONFIRMADA: 'success',
    HIBERNACION: 'secondary',
};

export const SHOPS: Shop[] = ['Blumi', 'Cumbre', 'Dearel', 'Trazto'];
export const COURIERS: Courier[] = ['URBANO', 'SHALOM', 'OLVA', 'INTERNO'];
export const PAYMENT_METHODS: PaymentMethod[] = ['YAPE', 'PLIN', 'Transferencia Bancaria', 'Efectivo', 'Tarjeta de Crédito', 'Desconocido'];
