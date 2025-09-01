'use client';
import { useState, useMemo } from 'react';
import { Bell, AlertTriangle, Clock, CircleDollarSign, XCircle, Archive, Ban } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryItem, Order } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'Low Stock' | 'Delayed Order' | 'Pending Payment' | 'Held Order' | 'Cancelled Order' | 'Discontinued Product';
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
        type: 'Low Stock',
        message: `${item.name} is low on stock (${item.stock} left).`,
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
        type: 'Delayed Order',
        message: `Order ${order.id} was delivered late.`,
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
        type: 'Pending Payment',
        message: `Order ${order.id} has a pending payment.`,
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
        type: 'Held Order',
        message: `Order ${order.id} is on hold.`,
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
        type: 'Cancelled Order',
        message: `Order ${order.id} has been cancelled.`,
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
        type: 'Discontinued Product',
        message: `${item.name} has been discontinued.`,
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
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
            <h4 className="font-medium text-sm">Notifications</h4>
        </div>
        <ScrollArea className="h-96">
            {allNotifications.length === 0 ? (
                 <div className="text-center text-sm text-muted-foreground py-16">
                    No new notifications
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
                                    {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
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
