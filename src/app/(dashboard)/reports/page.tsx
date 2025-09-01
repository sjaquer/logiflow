import { getOrders, getUsers, getInventory } from '@/lib/firebase/firestore';
import type { Order, LegacyUser as User, LegacyInventoryItem as InventoryItem } from '@/lib/types';
import { KpiCards } from './components/kpi-cards';
import { OrderSummaryChart } from './components/order-summary-chart';
import { SalesByEntityChart } from './components/sales-by-entity-chart';
import { InventoryLevelsChart } from './components/inventory-levels-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ReportsPage() {
  const orders: Order[] = await getOrders();
  const users: User[] = await getUsers();
  const inventory: InventoryItem[] = await getInventory();

  return (
    <div className="grid gap-6">
      <KpiCards orders={orders} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Estado de Pedidos</CardTitle>
            <CardDescription>Un resumen de los pedidos por su estado actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderSummaryChart orders={orders} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Niveles de Inventario</CardTitle>
            <CardDescription>Niveles de stock actuales para todos los productos.</CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryLevelsChart inventory={inventory} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Ventas</CardTitle>
          <CardDescription>Desglose del monto total de ventas por diferentes entidades.</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesByEntityChart orders={orders} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
