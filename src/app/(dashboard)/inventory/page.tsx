'use client';
import { useState, useEffect } from 'react';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import type { InventoryItem } from '@/lib/types';
import { InventoryTable } from './components/inventory-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      const inventoryData = await getCollectionData<InventoryItem>('inventory');
      setInventory(inventoryData);
      setLoading(false);
    };
    fetchInventory();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

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
