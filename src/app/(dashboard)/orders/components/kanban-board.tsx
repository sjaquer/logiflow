'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Order, User, InventoryItem, OrderStatus, Shop, Courier, PaymentMethod } from '@/lib/types';
import { KANBAN_COLUMNS } from '@/lib/constants';
import { KanbanColumn } from './kanban-column';
import { OrderFilters } from './order-filters';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface KanbanBoardProps {
  initialOrders: Order[];
  users: User[];
  inventory: InventoryItem[];
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export interface Filters {
  shops: Shop[];
  assignedUserIds: string[];
  statuses: OrderStatus[];
  paymentMethods: PaymentMethod[];
  couriers: Courier[];
  dateRange: { from?: Date; to?: Date };
}

export function KanbanBoard({ initialOrders, users, inventory, filters, onFilterChange }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const newOrders = snapshot.docs.map(doc => ({ ...doc.data() } as Order));
      setOrders(newOrders);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const { shops, assignedUserIds, statuses, paymentMethods, couriers, dateRange } = filters;
      const orderDate = new Date(order.fechas_clave.creacion);

      if (shops.length > 0 && !shops.includes(order.tienda.nombre)) return false;
      if (assignedUserIds.length > 0 && !assignedUserIds.includes(order.asignacion.id_usuario_actual)) return false;
      if (statuses.length > 0 && !statuses.includes(order.estado_actual)) return false;
      if (paymentMethods.length > 0 && !paymentMethods.includes(order.pago.metodo_pago_previsto)) return false;
      if (couriers.length > 0 && !couriers.includes(order.envio.courier)) return false;
      if (dateRange.from && orderDate < dateRange.from) return false;
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Include the whole day
        if (orderDate > toDate) return false;
      }
      return true;
    });
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
        filters={filters}
        onFilterChange={onFilterChange}
        orderCount={filteredOrders.length}
      />
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="flex gap-6 py-4">
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
