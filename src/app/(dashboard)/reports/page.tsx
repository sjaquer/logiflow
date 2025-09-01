import { orders, users, inventory } from '@/lib/data';
import { KpiCards } from './components/kpi-cards';
import { OrderSummaryChart } from './components/order-summary-chart';
import { SalesByEntityChart } from './components/sales-by-entity-chart';
import { InventoryLevelsChart } from './components/inventory-levels-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div className="grid gap-6">
      <KpiCards orders={orders} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Summary</CardTitle>
            <CardDescription>A summary of orders by their current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderSummaryChart orders={orders} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventory Levels</CardTitle>
            <CardDescription>Current stock levels for all products.</CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryLevelsChart inventory={inventory} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sales Analysis</CardTitle>
          <CardDescription>Breakdown of total sales amount by different entities.</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesByEntityChart orders={orders} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
