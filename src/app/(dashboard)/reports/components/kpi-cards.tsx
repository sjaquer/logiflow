'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order } from '@/lib/types';
import { DollarSign, Package, ShoppingCart, Truck } from 'lucide-react';

export function KpiCards({ orders }: { orders: Order[] }) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const deliveredOrders = orders.filter(o => o.estado_actual === 'ENTREGADO').length;
  const inTransitOrders = orders.filter(o => o.estado_actual.startsWith('EN_TRANSITO')).length;

  const kpiData = [
    { title: 'Total Revenue', value: `S/ ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign },
    { title: 'Total Orders', value: totalOrders.toString(), icon: ShoppingCart },
    { title: 'Delivered', value: deliveredOrders.toString(), icon: Package },
    { title: 'In Transit', value: inTransitOrders.toString(), icon: Truck },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map(kpi => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
