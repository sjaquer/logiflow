'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import type { InventoryItem } from '@/lib/types';
import { InventoryTable } from './components/inventory-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      const inventoryData = await getCollectionData<InventoryItem>('inventory');
      // Sort inventory alphabetically by name
      inventoryData.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setInventory(inventoryData);
      setLoading(false);
    };
    fetchInventory();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestión de Inventario</CardTitle>
            <CardDescription>Ver y gestionar stock, ubicación, precios e información de proveedores.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/inventory/quick-entry">
                <Edit className="mr-2 h-4 w-4" />
                Editor Rápido de Inventario
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <InventoryTable inventory={inventory} />
        </CardContent>
      </Card>
    </div>
  );
}
