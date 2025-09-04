'use client';
import { useState, useMemo } from 'react';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import { KpiCards } from './components/kpi-cards';
import { OrderSummaryChart } from './components/order-summary-chart';
import { SalesByEntityChart } from './components/sales-by-entity-chart';
import { InventoryLevelsChart } from './components/inventory-levels-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderFilters } from '../orders/components/order-filters';
import type { Order, User, InventoryItem, Filters } from '@/lib/types';
import { filterOrders } from '@/lib/utils';
import { Loader2, LineChart } from 'lucide-react';

interface ReportsData {
  orders: Order[];
  users: User[];
  inventory: InventoryItem[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    shops: [],
    assignedUserIds: [],
    statuses: [],
    paymentMethods: [],
    couriers: [],
    dateRange: {},
  });

  const handleFetchData = async () => {
    setIsLoading(true);
    try {
      const [orders, users, inventory] = await Promise.all([
        getCollectionData<Order>('orders'),
        getCollectionData<User>('users'),
        getCollectionData<InventoryItem>('inventory'),
      ]);
      setData({ orders, users, inventory });
    } catch (error) {
      console.error("Failed to fetch reports data:", error);
      // You could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    return filterOrders(data.orders, filters);
  }, [data, filters]);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <LineChart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Análisis Avanzado de Reportes</h3>
          <p className="mt-2 text-sm text-muted-foreground">Carga los datos de tu operación para generar insights.</p>
          <Button onClick={handleFetchData} disabled={isLoading} className="mt-6">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cargar Datos para Análisis'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <OrderFilters 
        users={data.users} 
        filters={filters} 
        onFilterChange={setFilters} 
        orderCount={filteredOrders.length}
      />
      <div className="grid gap-6 px-4 md:px-6 lg:px-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-max">
        {/* Bento Grid Layout */}
        <div className="lg:col-span-4">
          <KpiCards orders={filteredOrders} />
        </div>
        
        <Card className="lg:col-span-2 lg:row-span-2">
          <CardHeader>
            <CardTitle>Análisis de Ventas</CardTitle>
            <CardDescription>Desglose del monto total de ventas por diferentes entidades.</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesByEntityChart orders={filteredOrders} users={data.users} />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen de Estado de Pedidos</CardTitle>
            <CardDescription>Un resumen de los pedidos por su estado actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderSummaryChart orders={filteredOrders} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Niveles de Inventario</CardTitle>
            <CardDescription>Niveles de stock actuales para todos los productos.</CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryLevelsChart inventory={data.inventory} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}