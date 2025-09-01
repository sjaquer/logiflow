'use client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OrderDetailsModal } from './order-details-modal';
import type { Order, User, InventoryItem, OrderStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Users, ShoppingBag } from 'lucide-react';

interface KanbanCardProps {
  order: Order;
  users: User[];
  inventory: InventoryItem[];
  onOrderStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onOrderItemsChange: (orderId: string, items: Order['items']) => void;
}

export function KanbanCard({ order, users, inventory, onOrderStatusChange, onOrderItemsChange }: KanbanCardProps) {
  const assignedUser = users.find(u => u.id === order.assignedUserId);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('orderId', order.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <OrderDetailsModal 
      order={order}
      users={users}
      inventory={inventory}
      onOrderStatusChange={onOrderStatusChange}
      onOrderItemsChange={onOrderItemsChange}
    >
      <div draggable onDragStart={handleDragStart} className="cursor-grab active:cursor-grabbing">
        <Card className="hover:bg-card/95 hover:shadow-md transition-all">
          <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-base">{order.id}</h4>
                  <Badge variant={order.estado_pago === 'PAGADO' ? 'success' : 'secondary'} className="capitalize text-xs">
                      {order.estado_pago.toLowerCase()}
                  </Badge>
              </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 pt-1"><Users className="w-4 h-4"/>{order.client.name}</p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingBag className="w-4 h-4" />
              <span>{order.shop}</span>
            </div>
            <div className="mt-2 text-lg font-bold">
              S/ {order.totalAmount.toFixed(2)}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center px-4 pb-4">
            <div className="flex items-center -space-x-2">
               {assignedUser && (
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={assignedUser.avatar} />
                    <AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback>
                  </Avatar>
              )}
              <div className="text-xs text-muted-foreground pl-3">
                {formatDistanceToNow(new Date(order.fecha_creacion), { addSuffix: true })}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </OrderDetailsModal>
  );
}
