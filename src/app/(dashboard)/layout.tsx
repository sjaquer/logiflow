'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User, InventoryItem, Order } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
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
      setDataLoading(true);
      
      const unsubscribers = [
        listenToCollection<User>('users', setUsers),
        listenToCollection<InventoryItem>('inventory', setInventory),
        listenToCollection<Order>('orders', (ordersData) => {
            ordersData.sort((a, b) => new Date(b.fechas_clave.creacion).getTime() - new Date(a.fechas_clave.creacion).getTime());
            setOrders(ordersData);
        }),
      ];
      
      const initialLoadCheck = setTimeout(() => {
          setDataLoading(false);
      }, 1500);

      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
        clearTimeout(initialLoadCheck);
      };
    }
  }, [user]);
  
  const currentUser = users.find(u => u.email === user?.email) || null;
  
  // Do not pass props to the reports page, it will handle its own data fetching
  const shouldInjectProps = !pathname.startsWith('/reports');

  const childrenWithProps = React.Children.map(children, child => {
    // For all pages, pass the currentUser
    if (React.isValidElement(child)) {
      const propsToInject: any = { currentUser };

      // For pages other than reports, pass all the data
      if(shouldInjectProps) {
        propsToInject.users = users;
        propsToInject.inventory = inventory;
        propsToInject.orders = orders;
      }
      return React.cloneElement(child, propsToInject);
    }
    return child;
  });

  if (loading || !user || (shouldInjectProps && dataLoading)) {
    return (
        <div className="flex min-h-screen">
            <div className="hidden md:flex flex-col w-64 border-r p-4 space-y-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex-1 p-8">
                <Skeleton className="h-12 w-1/4 mb-8" />
                <Skeleton className="w-full h-[60vh]" />
            </div>
        </div>
    );
  }

  return (
      <div className="flex min-h-screen bg-muted/40">
        <AppSidebar currentUser={currentUser} />
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader user={currentUser} inventory={inventory} orders={orders} />
          <main className="flex-1 flex flex-col overflow-auto">
            {childrenWithProps}
          </main>
        </div>
      </div>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
