import { getInventory } from '@/lib/firebase/firestore';
import type { LegacyInventoryItem as InventoryItem } from '@/lib/types';
import { InventoryTable } from './components/inventory-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function InventoryPage() {
  const inventory: InventoryItem[] = await getInventory();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Inventario</CardTitle>
          <CardDescription>Ver y gestionar stock, ubicación, precios e información de proveedores.</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTable inventory={inventory} />
        </CardContent>
      </Card>
    </div>
  );
}
