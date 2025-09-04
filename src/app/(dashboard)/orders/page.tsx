'use client';
import { useState } from 'react';
import { KanbanBoard } from './components/kanban-board';
import type { Order, User, InventoryItem, Filters } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface OrdersPageProps {
  orders: Order[];
  users: User[];
  inventory: InventoryItem[];
}

export default function OrdersPage({ orders, users, inventory }: OrdersPageProps) {
  const [filters, setFilters] = useState<Filters>({
    shops: [],
    assignedUserIds: [],
    statuses: [],
    paymentMethods: [],
    couriers: [],
    dateRange: {},
  });

  if (!orders || !users || !inventory) {
    return (
      <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <Skeleton className="w-full h-full" />
          <Skeleton className="w-full h-full" />
          <Skeleton className="w-full h-full" />
          <Skeleton className="w-full h-full" />
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
       <KanbanBoard
        orders={orders}
        users={users}
        inventory={inventory}
        filters={filters}
        onFilterChange={setFilters}
      />
    </div>
  );
}
