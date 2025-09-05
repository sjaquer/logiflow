'use client';
import { useMemo } from 'react';
import type { Order, User, InventoryItem, OrderStatus, Shop, Courier, PaymentMethod } from '@/lib/types';
import { KANBAN_COLUMNS } from '@/lib/constants';
import { KanbanColumn } from './kanban-column';
import { OrderFilters } from './order-filters';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { filterOrders } from '@/lib/utils';
import type { Filters } from '@/lib/types';

interface KanbanBoardProps {
  orders: Order[];
  users: User[];
  inventory: InventoryItem[];
  shops: Shop[];
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export function KanbanBoard({ orders, users, inventory, shops, filters, onFilterChange }: KanbanBoardProps) {

  const filteredOrders = useMemo(() => {
    return filterOrders(orders, filters);
  }, [orders, filters]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { estado_actual: newStatus });
  };
  
  const updateOrderItems = async (orderId: string, updatedItems: Order['items']) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { items: updatedItems });
  };

  return (
    <div className="flex flex-col h-full">
      <OrderFilters
        users={users}
        shops={shops}
        filters={filters}
        onFilterChange={onFilterChange}
        orderCount={filteredOrders.length}
      />
      <ScrollArea className="flex-grow w-full" type="always">
        <div className="flex gap-8 p-4 md:p-6 lg:p-8 pt-4">
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
