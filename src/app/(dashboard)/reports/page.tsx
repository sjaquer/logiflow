'use client';
import { useState, useMemo } from 'react';
import { KpiCards } from './components/kpi-cards';
import { OrderSummaryChart } from './components/order-summary-chart';
import { SalesByEntityChart } from './components/sales-by-entity-chart';
import { InventoryLevelsChart } from './components/inventory-levels-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderFilters } from '../orders/components/order-filters';
import type { Order, User, InventoryItem, Filters } from '@/lib/types';
import { filterOrders } from '@/lib/utils';

interface ReportsPageProps {
  orders: Order[];
  users: User[];
  inventory: InventoryItem[];
}

export default function ReportsPage({ orders, users, inventory }: ReportsPageProps) {
  const [filters, setFilters] = useState<Filters>({
    shops: [],
    assignedUserIds: [],
    statuses: [],
    paymentMethods: [],
    couriers: [],
    dateRange: {},
  });

  const filteredOrders = useMemo(() => {
    return filterOrders(orders, filters);
  }, [orders, filters]);

  if (!orders || !users || !inventory) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-14 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6">
      <OrderFilters 
        users={users} 
        filters={filters} 
        onFilterChange={setFilters} 
        orderCount={filteredOrders.length}
      />
      <div className="grid gap-6 px-4 md:px-6 lg:px-8">
        <KpiCards orders={filteredOrders} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Estado de Pedidos</CardTitle>
              <CardDescription>Un resumen de los pedidos por su estado actual.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderSummaryChart orders={filteredOrders} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Niveles de Inventario</CardTitle>
              <CardDescription>Niveles de stock actuales para todos los productos.</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryLevelsChart inventory={inventory} />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Ventas</CardTitle>
            <CardDescription>Desglose del monto total de ventas por diferentes entidades.</CardDescription>
          </Header>
          <CardContent>
            <SalesByEntityChart orders={filteredOrders} users={users} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
