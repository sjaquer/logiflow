'use client';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { InventoryItem } from '@/lib/types';

const chartConfig = {
  stock: {
    label: 'Stock',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function InventoryLevelsChart({ inventory }: { inventory: InventoryItem[] }) {
  const data = useMemo(() => {
    return inventory.map(item => ({
      name: item.nombre,
      stock: item.stock_actual,
    }));
  }, [inventory]);

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data} layout="vertical">
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.length > 20 ? `${value.slice(0, 20)}...` : value}
          width={120}
        />
        <XAxis type="number" dataKey="stock" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="stock" fill="var(--color-stock)" radius={4} layout="vertical" />
      </BarChart>
    </ChartContainer>
  );
}
