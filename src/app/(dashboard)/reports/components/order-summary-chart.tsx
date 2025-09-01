'use client';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { KANBAN_COLUMNS } from '@/lib/constants';
import type { Order } from '@/lib/types';

const chartConfig = {
  count: {
    label: 'Orders',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function OrderSummaryChart({ orders }: { orders: Order[] }) {
  const data = useMemo(() => {
    const statusCounts = KANBAN_COLUMNS.map(col => ({
      status: col.title,
      count: orders.filter(o => o.estado_actual === col.id).length,
    }));
    return statusCounts;
  }, [orders]);

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="status"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
