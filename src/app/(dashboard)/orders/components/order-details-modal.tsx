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
import { es } from 'date-fns/locale';
import { CheckCircle2, Package, User as UserIcon, Calendar, MapPin, Truck, CreditCard, ShoppingBag, Hash, CircleHelp, AlertCircle, XCircle, Send } from 'lucide-react';
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
  const [isNotifying, setIsNotifying] = useState(false);
  const { toast } = useToast();

  const assignedUser = users.find(u => u.id_usuario === order.asignacion.id_usuario_actual);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  const handleStatusChange = (newStatus: OrderStatus) => {
    onOrderStatusChange(order.id_pedido, newStatus);
    setOrder(prev => ({...prev, estado_actual: newStatus}));
  };

  const checkStock = () => {
    setIsCheckingStock(true);
    setTimeout(() => { // Simulate API call
      let allConfirmed = true;
      const updatedItems = order.items.map(item => {
        const stockItem = inventory.find(inv => inv.sku === item.sku);
        let newStatus: OrderItemStatus;
        if (!stockItem || stockItem.estado === 'DESCONTINUADO') {
          newStatus = 'SIN_STOCK';
          allConfirmed = false;
        } else if (stockItem.stock_actual >= item.cantidad) {
          newStatus = 'CONFIRMADO';
        } else if (stockItem.stock_actual > 0) {
          newStatus = 'BACKORDER'; // Partial stock could be a backorder
          allConfirmed = false;
        } else {
          newStatus = 'SIN_STOCK';
          allConfirmed = false;
        }
        return { ...item, estado_item: newStatus };
      });

      onOrderItemsChange(order.id_pedido, updatedItems);
      setOrder(prev => ({...prev, items: updatedItems}));
      setIsCheckingStock(false);
      
      toast({
        title: allConfirmed ? "Stock Confirmado" : "Problemas de Stock Encontrados",
        description: allConfirmed ? "Todos los artículos están disponibles en stock." : "Algunos artículos tienen problemas de stock. Ver detalles abajo.",
        variant: allConfirmed ? "default" : "destructive",
      });
    }, 1000);
  };
  
  const handleNotifyViaMake = async () => {
    setIsNotifying(true);
    toast({ title: 'Enviando notificación...', description: 'Disparando escenario en Make.com.' });

    try {
        const response = await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // El webhook URL ahora se lee del lado del servidor
                payload: {
                    orderId: order.id_pedido,
                    clientName: order.cliente.nombres,
                    total: order.pago.monto_total,
                    status: order.estado_actual,
                }
            })
        });

        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'La respuesta del servidor no fue OK y no contenía JSON.' }));
            throw new Error(errorResult.message || 'Error en la respuesta del servidor.');
        }

        const result = await response.json();

        if (result.success) {
            toast({ title: '¡Éxito!', description: 'El escenario en Make.com fue disparado correctamente.' });
        } else {
            throw new Error(result.message || 'El webhook de Make.com no aceptó la solicitud.');
        }

    } catch (error: any) {
        console.error("Error notifying via Make:", error);
        toast({ title: 'Error de Notificación', description: error.message, variant: 'destructive' });
    } finally {
        setIsNotifying(false);
    }
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
            Detalles del Pedido <Badge variant="outline">{order.id_pedido}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h4 className="font-medium mb-2 text-primary">Artículos</h4>
              <div className="space-y-2">
                {order.items.map(item => {
                  const inventoryItem = inventory.find(i => i.sku === item.sku);
                  return (
                    <div key={item.sku} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                      <div>
                        <p className="font-medium">{inventoryItem?.nombre || 'Artículo Desconocido'}</p>
                        <p className="text-sm text-muted-foreground">SKU: {inventoryItem?.sku} &bull; Cant: {item.cantidad}</p>
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
               <h4 className="font-medium mb-3 text-primary">Acciones</h4>
               <div className="flex flex-wrap items-center gap-4">
                <Button onClick={checkStock} disabled={isCheckingStock}>
                  {isCheckingStock ? 'Verificando...' : 'Verificar Stock'}
                </Button>
                 <Select onValueChange={(value: OrderStatus) => handleStatusChange(value)} value={order.estado_actual}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Cambiar Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        {KANBAN_COLUMNS.map(col => (
                            <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button variant="outline" onClick={handleNotifyViaMake} disabled={isNotifying}>
                   <Send className="mr-2 h-4 w-4" />
                  {isNotifying ? 'Notificando...' : 'Notificar Cliente'}
                </Button>
               </div>
            </div>
          </div>
          <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-primary border-b pb-2">Resumen</h4>
            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3"><UserIcon className="w-4 h-4 text-muted-foreground" /> <span>{order.cliente.nombres}</span></div>
                <div className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" /> <span>{order.envio.direccion}</span></div>
                <div className="flex items-center gap-3"><ShoppingBag className="w-4 h-4 text-muted-foreground" /> <span>{order.tienda.nombre}</span></div>
                <Separator />
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-muted-foreground" /> <span>{format(new Date(order.fechas_clave.creacion), 'd MMM, yyyy HH:mm', { locale: es })}</span></div>
                <div className="flex items-center gap-3"><Truck className="w-4 h-4 text-muted-foreground" /> <span>{order.envio.courier}</span></div>
                <div className="flex items-center gap-3"><CreditCard className="w-4 h-4 text-muted-foreground" /> <span>{order.pago.metodo_pago_previsto}</span></div>
                {order.envio.nro_guia && <div className="flex items-center gap-3"><Hash className="w-4 h-4 text-muted-foreground" /> <span>{order.envio.nro_guia}</span></div>}
                <Separator />
                {assignedUser && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={assignedUser.avatar} />
                        <AvatarFallback>{getInitials(assignedUser.nombre)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Asignado a</span>
                        <span className="font-medium">{assignedUser.nombre}</span>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-base font-bold">
                    <span>Total</span>
                    <span>S/ {order.pago.monto_total.toFixed(2)}</span>
                </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Imprimir Factura</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
