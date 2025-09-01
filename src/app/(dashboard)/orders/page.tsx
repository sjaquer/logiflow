import { orders, users, inventory } from '@/lib/data';
import { KanbanBoard } from './components/kanban-board';

export default function OrdersPage() {
  // In a real app, you would fetch this data from an API
  const allOrders = orders;
  const allUsers = users;
  const allInventory = inventory;

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
