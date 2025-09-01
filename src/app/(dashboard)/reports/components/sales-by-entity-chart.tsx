'use client';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Order, User, Shop, Courier } from '@/lib/types';

const chartConfig = {
  sales: {
    label: 'Ventas',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

function SalesChart({ data }: { data: { name: string; sales: number }[] }) {
    return (
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart accessibilityLayer data={data}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                <YAxis
                    tickFormatter={(value) => `S/${Number(value) / 1000}k`}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        formatter={(value) => `S/ ${Number(value).toLocaleString('es-PE')}`}
                    />}
                />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}

export function SalesByEntityChart({ orders, users }: { orders: Order[]; users: User[] }) {
  const salesByShop = useMemo(() => {
    const sales = orders.reduce((acc, order) => {
      acc[order.shop] = (acc[order.shop] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<Shop, number>);
    return Object.entries(sales).map(([name, sales]) => ({ name, sales }));
  }, [orders]);

  const salesByUser = useMemo(() => {
    const sales = orders.reduce((acc, order) => {
      const user = users.find(u => u.id === order.assignedUserId);
      const userName = user ? user.name : 'No asignado';
      acc[userName] = (acc[userName] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(sales).map(([name, sales]) => ({ name, sales }));
  }, [orders, users]);
  
  const salesByCourier = useMemo(() => {
    const sales = orders.reduce((acc, order) => {
      acc[order.courier] = (acc[order.courier] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<Courier, number>);
    return Object.entries(sales).map(([name, sales]) => ({ name, sales }));
  }, [orders]);


  return (
    <Tabs defaultValue="shop">
      <TabsList>
        <TabsTrigger value="shop">Por Tienda</TabsTrigger>
        <TabsTrigger value="user">Por Usuario</TabsTrigger>
        <TabsTrigger value="courier">Por Courier</TabsTrigger>
      </TabsList>
      <TabsContent value="shop">
        <SalesChart data={salesByShop} />
      </TabsContent>
      <TabsContent value="user">
        <SalesChart data={salesByUser} />
      </TabsContent>
      <TabsContent value="courier">
        <SalesChart data={salesByCourier} />
      </TabsContent>
    </Tabs>
  );
}
