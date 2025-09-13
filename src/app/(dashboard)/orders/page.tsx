'use client';
import { useState, useEffect } from 'react';
import { KanbanBoard } from './components/kanban-board';
import type { Order, User, InventoryItem, Filters, Shop } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


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
        setLoading(false);
      }),
      listenToCollection<User>('users', (data) => {
          setUsers(data);
      }),
      listenToCollection<InventoryItem>('inventory', (data) => {
          setInventory(data);
      }),
       listenToCollection<Shop>('shops', (data) => {
          setShops(data);
      }),
    ];
    
    // Safety timeout to prevent infinite loading screen
    const timer = setTimeout(() => {
        if (loading) {
            console.warn("Loading timeout exceeded, forcing render.");
            setLoading(false);
        }
    }, 5000); 

    return () => {
      clearTimeout(timer);
      unsubs.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const handleProcessShopifyOrder = (order: Order) => {
      router.push(`/create-order?orderId=${order.id_pedido}`);
  }


  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="flex-1 flex gap-8 overflow-x-auto pb-4">
          <Skeleton className="w-[320px] shrink-0 h-full" />
          <Skeleton className="w-[320px] shrink-0 h-full" />
          <Skeleton className="w-[320px] shrink-0 h-full" />
          <Skeleton className="w-[320px] shrink-0 h-full" />
          <Skeleton className="w-[320px] shrink-0 h-full" />
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
        shops={shops}
        filters={filters}
        onFilterChange={setFilters}
        onProcessShopifyOrder={handleProcessShopifyOrder}
      />
    </div>
  );
}
