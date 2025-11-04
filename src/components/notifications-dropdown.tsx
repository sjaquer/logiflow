
'use client';
import { useState, useMemo, MouseEvent } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, Clock, CircleDollarSign, XCircle, Archive, Ban, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryItem, Order } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'Stock Bajo' | 'Pedido Retrasado' | 'Pago Pendiente' | 'Pedido Retenido' | 'Pedido Anulado' | 'Producto Descontinuado';
  message: string;
  timestamp: Date;
  icon: React.ElementType;
  color: string;
  href: string;
}

const getNotifications = (inventory: InventoryItem[], orders: Order[]): Notification[] => {
  const notifications: Notification[] = [];

  // Low stock
  inventory.forEach(item => {
    if (item.stock_actual > 0 && item.stock_actual <= item.stock_minimo) {
      notifications.push({
        id: `low-stock-${item.sku}`,
        type: 'Stock Bajo',
        message: `${item.nombre} tiene poco stock (${item.stock_actual} restantes).`,
        timestamp: new Date(),
        icon: AlertTriangle,
        color: 'text-yellow-500',
        href: `/inventory/quick-entry?sku=${item.sku}`
      });
    }
  });

  // Delayed orders
  orders.forEach(order => {
    if (order.fechas_clave && order.fechas_clave.entrega_real && new Date(order.fechas_clave.entrega_real) > new Date(order.fechas_clave.entrega_estimada)) {
      notifications.push({
        id: `delayed-${order.id_pedido}`,
        type: 'Pedido Retrasado',
        message: `El pedido ${order.id_pedido} se entregó con retraso.`,
        timestamp: new Date(order.fechas_clave.entrega_real),
        icon: Clock,
        color: 'text-red-500',
  href: '/call-center-queue'
      });
    }
  });

  // Pending payments
  orders.forEach(order => {
    if (order.pago.estado_pago === 'PENDIENTE') {
      notifications.push({
        id: `payment-${order.id_pedido}`,
        type: 'Pago Pendiente',
        message: `El pedido ${order.id_pedido} tiene un pago pendiente.`,
        timestamp: new Date(order.fechas_clave.creacion),
        icon: CircleDollarSign,
        color: 'text-blue-500',
  href: '/call-center-queue'
      });
    }
  });
  
  // Held orders
  orders.forEach(order => {
    if (order.estado_actual === 'RETENIDO') {
      notifications.push({
        id: `held-${order.id_pedido}`,
        type: 'Pedido Retenido',
        message: `El pedido ${order.id_pedido} está retenido.`,
        timestamp: new Date(order.fechas_clave.creacion),
        icon: Archive,
        color: 'text-orange-500',
  href: '/call-center-queue'
      });
    }
  });
  
  // Cancelled orders
  orders.forEach(order => {
    if (order.estado_actual === 'ANULADO') {
      notifications.push({
        id: `cancelled-${order.id_pedido}`,
        type: 'Pedido Anulado',
        message: `El pedido ${order.id_pedido} ha sido anulado.`,
        timestamp: new Date(order.fechas_clave.creacion),
        icon: XCircle,
        color: 'text-gray-500',
  href: '/call-center-queue'
      });
    }
  });

  // Discontinued products
  inventory.forEach(item => {
    if (item.estado === 'DESCONTINUADO') {
      notifications.push({
        id: `discontinued-${item.sku}`,
        type: 'Producto Descontinuado',
        message: `${item.nombre} ha sido descontinuado.`,
        timestamp: new Date(),
        icon: Ban,
        color: 'text-purple-500',
        href: '/inventory'
      });
    }
  });

  return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export function NotificationsDropdown({ inventory, orders }: { inventory: InventoryItem[]; orders: Order[] }) {
  const allNotifications = useMemo(() => getNotifications(inventory, orders), [inventory, orders]);
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  // Sync state with props
  useState(() => {
    setVisibleNotifications(allNotifications);
  });
  
  const dismissNotification = (e: MouseEvent<HTMLButtonElement>, idToDismiss: string) => {
      e.preventDefault(); // Prevent link navigation when clicking the dismiss button
      e.stopPropagation();
      setVisibleNotifications(current => current.filter(n => n.id !== idToDismiss));
  };
  
  const unreadCount = visibleNotifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Alternar notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 flex justify-between items-center">
            <h4 className="font-medium text-sm">Notificaciones</h4>
            {unreadCount > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setVisibleNotifications([])}>Limpiar todo</Button>}
        </div>
        <ScrollArea className="h-96">
            {unreadCount === 0 ? (
                 <div className="text-center text-sm text-muted-foreground py-16">
                    No hay notificaciones nuevas
                 </div>
            ) : (
                <div className="divide-y divide-border">
                    {visibleNotifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.href}
                          className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors group relative cursor-pointer"
                        >
                            <notification.icon className={`h-5 w-5 mt-0.5 shrink-0 ${notification.color}`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{notification.type}</p>
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: es })}
                                </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => dismissNotification(e, notification.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                        </Link>
                    ))}
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
