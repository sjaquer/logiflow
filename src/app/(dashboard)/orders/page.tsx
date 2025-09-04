'use client';
import { useState, useEffect } from 'react';
import { KanbanBoard } from './components/kanban-board';
import type { Order, User, InventoryItem, Filters } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { listenToCollection } from '@/lib/firebase/firestore-client';

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
    setLoading(true);
    
    const unsubs = [
      listenToCollection<Order>('orders', (data) => {
        data.sort((a, b) => new Date(b.fechas_clave.creacion).getTime() - new Date(a.fechas_clave.creacion).getTime());
        setOrders(data);
      }),
      listenToCollection<User>('users', (data) => {
          setUsers(data);
      }),
      listenToCollection<InventoryItem>('inventory', (data) => {
          setInventory(data);
      }),
    ];
    
    // A simple way to set loading to false once all initial data streams have likely fired once.
    // For a more robust solution, you might check if each state array has length.
    const timer = setTimeout(() => setLoading(false), 1500); 

    return () => {
      clearTimeout(timer);
      unsubs.forEach(unsubscribe => unsubscribe());
    };
  }, []);


  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="flex-1 flex gap-8">
          <Skeleton className="w-[320px] h-full" />
          <Skeleton className="w-[320px] h-full" />
          <Skeleton className="w-[320px] h-full" />
          <Skeleton className="w-[320px] h-full" />
          <Skeleton className="w-[320px] h-full" />
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
