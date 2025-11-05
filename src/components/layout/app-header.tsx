'use client';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import type { User, InventoryItem, Order } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useState, useEffect } from 'react';
import { useDevMode } from '@/context/dev-mode-context';
import { Separator } from '@/components/ui/separator';

interface AppHeaderProps {
  user: User | null;
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const { isDevMode } = useDevMode();

  useEffect(() => {
    if (isDevMode) {
      console.group("🔧 DEV MODE: AppHeader Diagnostics");
      console.log("⏰ Timestamp:", new Date().toISOString());
      console.log("📍 Current Pathname:", pathname);
      console.log("👤 Current User:", user);
      console.groupEnd();
    }
  }, [isDevMode, user, pathname]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    unsubs.push(listenToCollection<InventoryItem>('inventory', setInventory));
    unsubs.push(listenToCollection<Order>('orders', setOrders));
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const getTitle = () => {
    switch (true) {
      case pathname.startsWith('/orders'):
        return 'Pedidos';
      case pathname.startsWith('/create-order'):
        return 'Procesar Pedido';
      case pathname.startsWith('/clients'):
        return 'Clientes';
      case pathname.startsWith('/inventory'):
        return 'Inventario';
      case pathname.startsWith('/reports'):
        return 'Reportes';
      case pathname.startsWith('/call-center-queue'):
        return 'Call Center';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sticky top-0 z-10 shadow-sm">
      <SidebarTrigger className="flex -ml-2" />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-foreground">{getTitle()}</h1>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <NotificationsDropdown inventory={inventory} orders={orders} />
        {user && <UserNav user={user} />}
      </div>
    </header>
  );
}
