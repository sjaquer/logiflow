import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getUsers, getInventory, getOrders } from '@/lib/firebase/firestore';
import type { Order, LegacyUser as User, LegacyInventoryItem as InventoryItem } from '@/lib/types';


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch initial data from Firestore
  const users: User[] = await getUsers();
  const inventory: InventoryItem[] = await getInventory();
  const orders: Order[] = await getOrders();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <AppHeader users={users} inventory={inventory} orders={orders} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
