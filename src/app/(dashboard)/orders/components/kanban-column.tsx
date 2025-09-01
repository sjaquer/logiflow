'use client'
import type { Order, User, InventoryItem, OrderStatus } from '@/lib/types';
import { KanbanCard } from './kanban-card';
import { Droppable } from './droppable';

interface KanbanColumnProps {
  column: { id: OrderStatus; title: string };
  orders: Order[];
  users: User[];
  inventory: InventoryItem[];
  onOrderStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onOrderItemsChange: (orderId: string, items: Order['items']) => void;
}

export function KanbanColumn({ column, orders, users, inventory, onOrderStatusChange, onOrderItemsChange }: KanbanColumnProps) {
  return (
    <Droppable id={column.id} onDrop={onOrderStatusChange}>
      <div className="flex flex-col w-80 shrink-0">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-semibold text-lg">{column.title}</h3>
          <span className="text-sm font-medium bg-primary/10 text-primary rounded-md px-2 py-1">
            {orders.length}
          </span>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto h-full pr-2 -mr-2">
          {orders.map(order => (
            <KanbanCard 
              key={order.id} 
              order={order} 
              users={users} 
              inventory={inventory} 
              onOrderStatusChange={onOrderStatusChange}
              onOrderItemsChange={onOrderItemsChange}
            />
          ))}
        </div>
      </div>
    </Droppable>
  );
}
