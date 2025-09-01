'use client';
import { useState, useMemo } from 'react';
import { Bell, AlertTriangle, Clock, CircleDollarSign, XCircle, Archive, Ban } from 'lucide-react';
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
}

const getNotifications = (inventory: InventoryItem[], orders: Order[]): Notification[] => {
  const notifications: Notification[] = [];

  // Low stock
  inventory.forEach(item => {
    if (item.stock > 0 && item.stock <= item.lowStockThreshold) {
      notifications.push({
        id: `low-stock-${item.id}`,
        type: 'Stock Bajo',
        message: `${item.name} tiene poco stock (${item.stock} restantes).`,
        timestamp: new Date(),
        icon: AlertTriangle,
        color: 'text-yellow-500'
      });
    }
  });

  // Delayed orders
  orders.forEach(order => {
    if (order.fecha_entrega_real && new Date(order.fecha_entrega_real) > new Date(order.fecha_estimada_entrega)) {
      notifications.push({
        id: `delayed-${order.id}`,
        type: 'Pedido Retrasado',
        message: `El pedido ${order.id} se entregó con retraso.`,
        timestamp: new Date(order.fecha_entrega_real),
        icon: Clock,
        color: 'text-red-500'
      });
    }
  });

  // Pending payments
  orders.forEach(order => {
    if (order.estado_pago === 'PENDIENTE') {
      notifications.push({
        id: `payment-${order.id}`,
        type: 'Pago Pendiente',
        message: `El pedido ${order.id} tiene un pago pendiente.`,
        timestamp: new Date(order.fecha_creacion),
        icon: CircleDollarSign,
        color: 'text-blue-500'
      });
    }
  });
  
  // Held orders
  orders.forEach(order => {
    if (order.estado_actual === 'RETENIDO') {
      notifications.push({
        id: `held-${order.id}`,
        type: 'Pedido Retenido',
        message: `El pedido ${order.id} está retenido.`,
        timestamp: new Date(order.fecha_creacion),
        icon: Archive,
        color: 'text-orange-500'
      });
    }
  });
  
  // Cancelled orders
  orders.forEach(order => {
    if (order.estado_actual === 'ANULADO') {
      notifications.push({
        id: `cancelled-${order.id}`,
        type: 'Pedido Anulado',
        message: `El pedido ${order.id} ha sido anulado.`,
        timestamp: new Date(order.fecha_creacion),
        icon: XCircle,
        color: 'text-gray-500'
      });
    }
  });

  // Discontinued products
  inventory.forEach(item => {
    if (item.isDiscontinued) {
      notifications.push({
        id: `discontinued-${item.id}`,
        type: 'Producto Descontinuado',
        message: `${item.name} ha sido descontinuado.`,
        timestamp: new Date(),
        icon: Ban,
        color: 'text-purple-500'
      });
    }
  });

  return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export function NotificationsDropdown({ inventory, orders }: { inventory: InventoryItem[]; orders: Order[] }) {
  const allNotifications = useMemo(() => getNotifications(inventory, orders), [inventory, orders]);
  const unreadCount = allNotifications.length;

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
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
            <h4 className="font-medium text-sm">Notificaciones</h4>
        </div>
        <ScrollArea className="h-96">
            {allNotifications.length === 0 ? (
                 <div className="text-center text-sm text-muted-foreground py-16">
                    No hay notificaciones nuevas
                 </div>
            ) : (
                <div className="divide-y divide-border">
                    {allNotifications.map((notification) => (
                        <div key={notification.id} className="p-4 flex items-start gap-4 hover:bg-muted/50">
                            <notification.icon className={`h-5 w-5 mt-0.5 shrink-0 ${notification.color}`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{notification.type}</p>
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: es })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
