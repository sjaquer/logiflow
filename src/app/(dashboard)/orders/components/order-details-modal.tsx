'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Order, User, InventoryItem, OrderStatus, OrderItem, OrderItemStatus } from '@/lib/types';
import { KANBAN_COLUMNS, ITEM_STATUS_BADGE_MAP } from '@/lib/constants';
import { format } from 'date-fns';
import { CheckCircle2, Package, User as UserIcon, Calendar, MapPin, Truck, CreditCard, ShoppingBag, Hash, CircleHelp, AlertCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

interface OrderDetailsModalProps {
  children: React.ReactNode;
  order: Order;
  users: User[];
  inventory: InventoryItem[];
  onOrderStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onOrderItemsChange: (orderId: string, items: Order['items']) => void;
}

export function OrderDetailsModal({ children, order: initialOrder, users, inventory, onOrderStatusChange, onOrderItemsChange }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const { toast } = useToast();

  const assignedUser = users.find(u => u.id === order.assignedUserId);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  const handleStatusChange = (newStatus: OrderStatus) => {
    onOrderStatusChange(order.id, newStatus);
    setOrder(prev => ({...prev, estado_actual: newStatus}));
  };

  const checkStock = () => {
    setIsCheckingStock(true);
    setTimeout(() => { // Simulate API call
      let allConfirmed = true;
      const updatedItems = order.items.map(item => {
        const stockItem = inventory.find(inv => inv.id === item.itemId);
        let newStatus: OrderItemStatus;
        if (!stockItem || stockItem.isDiscontinued) {
          newStatus = 'SIN_STOCK';
          allConfirmed = false;
        } else if (stockItem.stock >= item.quantity) {
          newStatus = 'CONFIRMADO';
        } else if (stockItem.stock > 0) {
          newStatus = 'BACKORDER'; // Partial stock could be a backorder
          allConfirmed = false;
        } else {
          newStatus = 'SIN_STOCK';
          allConfirmed = false;
        }
        return { ...item, estado_item: newStatus };
      });

      onOrderItemsChange(order.id, updatedItems);
      setOrder(prev => ({...prev, items: updatedItems}));
      setIsCheckingStock(false);
      
      toast({
        title: allConfirmed ? "Stock Confirmed" : "Stock Issues Found",
        description: allConfirmed ? "All items are available in stock." : "Some items have stock issues. See details below.",
        variant: allConfirmed ? "default" : "destructive",
      });
    }, 1000);
  };

  const getStatusIcon = (status: OrderItemStatus) => {
    switch (status) {
      case 'CONFIRMADO': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'SIN_STOCK': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'BACKORDER': return <AlertCircle className="w-4 h-4 text-accent" />;
      default: return <CircleHelp className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            Order Details <Badge variant="outline">{order.id}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h4 className="font-medium mb-2 text-primary">Items</h4>
              <div className="space-y-2">
                {order.items.map(item => {
                  const inventoryItem = inventory.find(i => i.id === item.itemId);
                  return (
                    <div key={item.itemId} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                      <div>
                        <p className="font-medium">{inventoryItem?.name || 'Unknown Item'}</p>
                        <p className="text-sm text-muted-foreground">SKU: {inventoryItem?.sku} &bull; Qty: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.estado_item)}
                        <Badge variant={ITEM_STATUS_BADGE_MAP[item.estado_item]} className="capitalize text-xs w-24 justify-center">
                          {item.estado_item.replace('_', ' ').toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <Separator />
            <div>
               <h4 className="font-medium mb-3 text-primary">Actions</h4>
               <div className="flex items-center gap-4">
                <Button onClick={checkStock} disabled={isCheckingStock}>
                  {isCheckingStock ? 'Checking...' : 'Check Stock Availability'}
                </Button>
                 <Select onValueChange={(value: OrderStatus) => handleStatusChange(value)} value={order.estado_actual}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {KANBAN_COLUMNS.map(col => (
                            <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
               </div>
            </div>
          </div>
          <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-primary border-b pb-2">Summary</h4>
            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3"><UserIcon className="w-4 h-4 text-muted-foreground" /> <span>{order.client.name}</span></div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" /> <span>{order.client.address}</span></div>
                <div className="flex items-center gap-3"><ShoppingBag className="w-4 h-4 text-muted-foreground" /> <span>{order.shop}</span></div>
                <Separator />
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-muted-foreground" /> <span>{format(new Date(order.fecha_creacion), 'MMM d, yyyy HH:mm')}</span></div>
                <div className="flex items-center gap-3"><Truck className="w-4 h-4 text-muted-foreground" /> <span>{order.courier}</span></div>
                <div className="flex items-center gap-3"><CreditCard className="w-4 h-4 text-muted-foreground" /> <span>{order.paymentMethod}</span></div>
                {order.trackingNumber && <div className="flex items-center gap-3"><Hash className="w-4 h-4 text-muted-foreground" /> <span>{order.trackingNumber}</span></div>}
                <Separator />
                {assignedUser && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={assignedUser.avatar} />
                        <AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Assigned to</span>
                        <span className="font-medium">{assignedUser.name}</span>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-base font-bold">
                    <span>Total</span>
                    <span>S/ {order.totalAmount.toFixed(2)}</span>
                </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Print Invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
