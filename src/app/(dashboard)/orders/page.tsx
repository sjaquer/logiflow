'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Search, AlertTriangle, TrendingUp } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  createdBy: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          orderBy('createdAt', 'desc'),
          limit(100)
        );

        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Order[];

        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientPhone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Order['status']) => {
    const variants = {
      pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      processing: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      shipped: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      delivered: 'bg-green-500/10 text-green-700 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-700 border-red-500/20',
    };

    const labels = {
      pending: 'Pendiente',
      processing: 'Procesando',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };

    return (
      <Badge className={`${variants[status]} border`}>
        {labels[status]}
      </Badge>
    );
  };

  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in">
        <Card className="border-border/40 shadow-lg max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Acceso Denegado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Debes iniciar sesión para ver las órdenes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in space-y-6">
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in space-y-6">
      {/* Header con gradiente llamativo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-white">Órdenes</CardTitle>
              <CardDescription className="mt-2 text-white/90 text-base">
                Gestiona y da seguimiento a todas las órdenes procesadas
              </CardDescription>
            </div>
            <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
              <TrendingUp className="h-5 w-5 text-white" />
              <div className="text-right">
                <p className="text-xs text-white/80">Ingresos Totales</p>
                <p className="text-xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-6 space-y-6">
          {/* Filtros mejorados para mobile */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, teléfono o # orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 border-border/60 focus-visible:ring-primary"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 border-border/60">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile: Cards | Desktop: Table */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-lg">No se encontraron órdenes</p>
              </div>
            ) : (
              <>
                {/* Vista Mobile: Cards apiladas */}
                <div className="lg:hidden space-y-3">
                  {filteredOrders.map(order => (
                    <Card key={order.id} className="border-border/40 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-base">{order.clientName}</p>
                            <p className="text-sm text-muted-foreground">#{order.orderNumber}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Teléfono:</span>
                            <span className="font-medium">{order.clientPhone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha:</span>
                            <span>{order.createdAt.toLocaleDateString('es-PE')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Vista Desktop: Tabla */}
                <div className="hidden lg:block rounded-xl border border-border/40 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border/40">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">Orden</th>
                        <th className="text-left p-4 font-semibold text-sm">Cliente</th>
                        <th className="text-left p-4 font-semibold text-sm">Teléfono</th>
                        <th className="text-left p-4 font-semibold text-sm">Total</th>
                        <th className="text-left p-4 font-semibold text-sm">Estado</th>
                        <th className="text-left p-4 font-semibold text-sm">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <span className="font-mono text-sm font-medium">#{order.orderNumber}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-medium">{order.clientName}</span>
                          </td>
                          <td className="p-4 text-muted-foreground">{order.clientPhone}</td>
                          <td className="p-4">
                            <span className="font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
                          </td>
                          <td className="p-4">{getStatusBadge(order.status)}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {order.createdAt.toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
