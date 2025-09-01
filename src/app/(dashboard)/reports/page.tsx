'use client';
import { useState, useEffect } from 'react';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import type { Order, User, InventoryItem } from '@/lib/types';
import { KpiCards } from './components/kpi-cards';
import { OrderSummaryChart } from './components/order-summary-chart';
import { SalesByEntityChart } from './components/sales-by-entity-chart';
import { InventoryLevelsChart } from './components/inventory-levels-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [ordersData, usersData, inventoryData] = await Promise.all([
        getCollectionData<Order>('orders'),
        getCollectionData<User>('users'),
        getCollectionData<InventoryItem>('inventory'),
      ]);
      setOrders(ordersData);
      setUsers(usersData);
      setInventory(inventoryData);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 p-4 md:p-6 lg:p-8">
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
    <div className="grid gap-6 p-4 md:p-6 lg:p-8">
      <KpiCards orders={orders} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Estado de Pedidos</CardTitle>
            <CardDescription>Un resumen de los pedidos por su estado actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderSummaryChart orders={orders} />
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
        </CardHeader>
        <CardContent>
          <SalesByEntityChart orders={orders} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
