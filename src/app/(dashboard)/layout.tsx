'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User, InventoryItem, Order } from '@/lib/types';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setDataLoading(true);
        const [usersData, inventoryData, ordersData] = await Promise.all([
          getCollectionData<User>('users'),
          getCollectionData<InventoryItem>('inventory'),
          getCollectionData<Order>('orders')
        ]);
        setUsers(usersData);
        setInventory(inventoryData);
        setOrders(ordersData);
        setDataLoading(false);
      };
      fetchData();
    }
  }, [user]);
  
  const currentUser = users.find(u => u.email === user?.email) || null;
  
  // Pass currentUser to children via React.cloneElement
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { currentUser } as { currentUser: User | null });
    }
    return child;
  });

  if (loading || !user || dataLoading) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden md:block border-r">
                <div className="flex flex-col space-y-4 p-4">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
            <div className="flex-1 p-8">
                <Skeleton className="h-12 w-1/4 mb-8" />
                <Skeleton className="w-full h-[60vh]" />
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar currentUser={currentUser} />
        <div className="flex flex-col flex-1">
          <AppHeader user={currentUser} inventory={inventory} orders={orders} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
            {childrenWithProps}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
