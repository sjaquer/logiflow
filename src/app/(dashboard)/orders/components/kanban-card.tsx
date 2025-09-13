
'use client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OrderDetailsModal } from './order-details-modal';
import type { Order, User, InventoryItem, OrderStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, ShoppingBag, PhoneForwarded } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanCardProps {
  order: Order;
  users: User[];
  inventory: InventoryItem[];
  onOrderStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onOrderItemsChange: (orderId: string, items: Order['items']) => void;
  onProcessShopifyOrder: (order: Order) => void;
}

export function KanbanCard({ order, users, inventory, onOrderStatusChange, onOrderItemsChange, onProcessShopifyOrder }: KanbanCardProps) {
  const assignedUser = order.asignacion ? users.find(u => u.id_usuario === order.asignacion.id_usuario_actual) : undefined;

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('') : '?';

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Only allow dragging for non-Shopify orders in "PENDIENTE" state
    if (order.source === 'shopify' && order.estado_actual === 'PENDIENTE') {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('orderId', order.id_pedido);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const isShopifyPending = order.source === 'shopify' && order.estado_actual === 'PENDIENTE';

  return (
    <div draggable={!isShopifyPending} onDragStart={handleDragStart} className={isShopifyPending ? "cursor-default" : "cursor-grab active:cursor-grabbing"}>
      <Card className="hover:bg-card/95 hover:shadow-lg transition-all border-l-4 border-primary/50 relative">
        {isShopifyPending && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
                 <Button onClick={() => onProcessShopifyOrder(order)}>
                    <PhoneForwarded className="mr-2 h-4 w-4" />
                    Procesar Pedido Shopify
                </Button>
            </div>
        )}
        <OrderDetailsModal 
          order={order}
          users={users}
          inventory={inventory}
          onOrderStatusChange={onOrderStatusChange}
          onOrderItemsChange={onOrderItemsChange}
        >
          <div className={isShopifyPending ? 'pointer-events-none' : ''}>
              <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-sm">{order.id_interno}</h4>
                      <Badge variant={order.pago.estado_pago === 'PAGADO' ? 'success' : 'secondary'} className="capitalize text-xs">
                          {order.pago.estado_pago.toLowerCase()}
                      </Badge>
                  </div>
                <p className="text-sm text-muted-foreground pt-1 truncate">{order.cliente.nombres}</p>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{order.tienda.nombre}</span>
                </div>
                <div className="text-xl font-bold">
                  S/ {order.pago.monto_total.toFixed(2)}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center px-4 pb-3">
                 <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(order.fechas_clave.creacion), { addSuffix: true, locale: es })}
                  </div>
                   {assignedUser && (
                      <Avatar className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={assignedUser.avatar} />
                        <AvatarFallback>{getInitials(assignedUser.nombre)}</AvatarFallback>
                      </Avatar>
                  )}
              </CardFooter>
            </div>
        </OrderDetailsModal>
      </Card>
    </div>
  );
}
