'use client';
import { useState, useEffect } from 'react';
import { KanbanBoard } from './components/kanban-board';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import type { Order, User, InventoryItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderFilters } from './components/order-filters';
import type { Filters } from './components/kanban-board';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';


export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    shops: [],
    assignedUserIds: [],
    statuses: [],
    paymentMethods: [],
    couriers: [],
    dateRange: {},
  });

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
        initialOrders={orders}
        users={users}
        inventory={inventory}
        filters={filters}
        onFilterChange={setFilters}
      />
    </div>
  );
}
