'use client';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { NotificationsDropdown } from '@/components/notifications-dropdown';
import type { User, InventoryItem, Order } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

interface AppHeaderProps {
  user: User | null;
  inventory: InventoryItem[];
  orders: Order[];
}

export function AppHeader({ user, inventory, orders }: AppHeaderProps) {
  const pathname = usePathname();
  const getTitle = () => {
    switch (pathname) {
      case '/orders':
        return 'Pedidos';
      case '/inventory':
        return 'Inventario';
      case '/reports':
        return 'Reportes';
      case '/users':
        return 'Usuarios';
      default:
        return 'Dashboard';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{getTitle()}</h1>
        <div className="ml-auto flex items-center gap-4">
          <NotificationsDropdown inventory={inventory} orders={orders} />
          {user && <UserNav user={user} />}
        </div>
      </header>
    </>
  );
}
