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
    <div className="flex flex-col w-[320px] shrink-0">
        <Droppable id={column.id} onDrop={onOrderStatusChange}>
        <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-semibold text-lg tracking-tight">{column.title}</h3>
            <span className="text-sm font-medium bg-primary/10 text-primary rounded-md px-2 py-0.5">
                {orders.length}
            </span>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto h-full pr-2 -mr-3 bg-muted/50 p-4 rounded-xl">
            {orders.map(order => (
            <KanbanCard 
                key={order.id_pedido} 
                order={order} 
                users={users} 
                inventory={inventory} 
                onOrderStatusChange={onOrderStatusChange}
                onOrderItemsChange={onOrderItemsChange}
            />
            ))}
            {orders.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                    Arrastra un pedido aquí
                </div>
            )}
        </div>
        </Droppable>
    </div>
  );
}
