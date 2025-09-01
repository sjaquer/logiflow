'use client';
import { useState, useMemo } from 'react';
import type { Order, User, InventoryItem, OrderStatus, Shop, Courier, PaymentMethod } from '@/lib/types';
import { KANBAN_COLUMNS } from '@/lib/constants';
import { KanbanColumn } from './kanban-column';
import { OrderFilters } from './order-filters';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KanbanBoardProps {
  initialOrders: Order[];
  users: User[];
  inventory: InventoryItem[];
}

export interface Filters {
  shops: Shop[];
  assignedUserIds: string[];
  statuses: OrderStatus[];
  paymentMethods: PaymentMethod[];
  couriers: Courier[];
  dateRange: { from?: Date; to?: Date };
}

export function KanbanBoard({ initialOrders, users, inventory }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filters, setFilters] = useState<Filters>({
    shops: [],
    assignedUserIds: [],
    statuses: [],
    paymentMethods: [],
    couriers: [],
    dateRange: {},
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const { shops, assignedUserIds, statuses, paymentMethods, couriers, dateRange } = filters;
      const orderDate = new Date(order.fecha_creacion);

      if (shops.length > 0 && !shops.includes(order.shop)) return false;
      if (assignedUserIds.length > 0 && !assignedUserIds.includes(order.assignedUserId)) return false;
      if (statuses.length > 0 && !statuses.includes(order.estado_actual)) return false;
      if (paymentMethods.length > 0 && !paymentMethods.includes(order.paymentMethod)) return false;
      if (couriers.length > 0 && !couriers.includes(order.courier)) return false;
      if (dateRange.from && orderDate < dateRange.from) return false;
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Include the whole day
        if (orderDate > toDate) return false;
      }
      return true;
    });
  }, [orders, filters]);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(currentOrders =>
      currentOrders.map(order =>
        order.id === orderId ? { ...order, estado_actual: newStatus } : order
      )
    );
  };
  
  const updateOrderItems = (orderId: string, updatedItems: Order['items']) => {
    setOrders(currentOrders =>
      currentOrders.map(order =>
        order.id === orderId ? { ...order, items: updatedItems } : order
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      <OrderFilters
        users={users}
        filters={filters}
        onFilterChange={setFilters}
        orderCount={filteredOrders.length}
      />
      <ScrollArea className="flex-1">
        <div className="flex gap-6 p-1 pb-4">
          {KANBAN_COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              orders={filteredOrders.filter(order => order.estado_actual === column.id)}
              users={users}
              inventory={inventory}
              onOrderStatusChange={updateOrderStatus}
              onOrderItemsChange={updateOrderItems}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
