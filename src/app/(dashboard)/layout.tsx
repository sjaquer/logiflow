
'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { Skeleton } from '@/components/ui/skeleton';
import { DevModeProvider } from '@/context/dev-mode-context';

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
      const unsubs: (() => void)[] = [];
      
      unsubs.push(listenToCollection<User>('users', (usersData) => {
        const foundUser = usersData.find(u => u.email === user.email) || null;
        setCurrentUser(foundUser);
        setDataLoading(false);
      }));

      return () => unsubs.forEach(unsub => unsub());
    } else if (!authLoading) {
        setDataLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || dataLoading) {
    return (
        <div className="flex min-h-screen bg-muted/30">
            <div className="flex flex-col w-64 border-r bg-background p-4 space-y-3">
                <Skeleton className="h-8 w-32 mb-4" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <div className="flex-1" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="flex-1 flex flex-col">
                <div className="h-16 border-b bg-background px-6 flex items-center">
                    <Skeleton className="h-6 w-40" />
                </div>
                <div className="flex-1 p-6 space-y-6">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="w-full h-[60vh] rounded-xl" />
                </div>
            </div>
        </div>
    );
  }

  const pathname = usePathname();

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { currentUser } as { currentUser: User | null });
    }
    return child;
  });

  return (
      <div className="min-h-screen bg-muted/30">
        {/* Sidebar como overlay - no consume espacio */}
        <AppSidebar currentUser={currentUser} />
        
        {/* Contenido principal ocupa todo el ancho */}
        <div className="flex flex-col min-h-screen w-full">
          <AppHeader user={currentUser} />
          <main className="flex-1 overflow-auto p-6">
            <div className={pathname?.startsWith('/call-center-queue') ? 'w-full' : 'mx-auto max-w-7xl'}>
              {childrenWithProps}
            </div>
          </main>
          <AppFooter />
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
    <SidebarProvider defaultOpen={false}>
      <DevModeProvider>
        <DashboardContent>{children}</DashboardContent>
      </DevModeProvider>
    </SidebarProvider>
  );
}
