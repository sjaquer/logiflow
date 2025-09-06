'use client';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import type { User, InventoryItem, Order } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useState, useEffect } from 'react';

interface AppHeaderProps {
  user: User | null;
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

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
        return 'Crear Pedido';
      case pathname.startsWith('/inventory'):
        return 'Inventario';
      case pathname.startsWith('/reports'):
        return 'Reportes';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-10">
      <SidebarTrigger className="flex" />
      <h1 className="text-xl font-semibold tracking-tight">{getTitle()}</h1>
      <div className="ml-auto flex items-center gap-4">
        <NotificationsDropdown inventory={inventory} orders={orders} />
        {user && <UserNav user={user} />}
      </div>
    </header>
  );
}
