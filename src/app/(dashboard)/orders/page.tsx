import { KanbanBoard } from './components/kanban-board';
import { getUsers, getInventory, getOrders } from '@/lib/firebase/firestore';
import type { Order, LegacyUser as User, LegacyInventoryItem as InventoryItem } from '@/lib/types';

export default async function OrdersPage() {
  // In a real app, you would fetch this data from an API
  const allOrders: Order[] = await getOrders();
  const allUsers: User[] = await getUsers();
  const allInventory: InventoryItem[] = await getInventory();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <KanbanBoard
        initialOrders={allOrders}
        users={allUsers}
        inventory={allInventory}
      />
    </div>
  );
}
