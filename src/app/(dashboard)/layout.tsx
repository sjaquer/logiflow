'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User, InventoryItem, Order } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const unsub = listenToCollection<User>('users', (usersData) => {
        const foundUser = usersData.find(u => u.email === user.email) || null;
        setCurrentUser(foundUser);
        if (foundUser) {
          setDataLoading(false);
        }
      });
      return () => unsub();
    }
  }, [user]);
  
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // Cloning the element and adding the currentUser prop
      return React.cloneElement(child, { currentUser } as { currentUser: User | null });
    }
    return child;
  });

  if (authLoading || dataLoading || !currentUser) {
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
          {/* We pass an empty array for orders/inventory to header, as they are not critical for it */}
          <AppHeader user={currentUser} inventory={[]} orders={[]} />
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
