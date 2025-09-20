
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import type { InventoryItem, Shop } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, FileUp } from 'lucide-react';
import { InventoryCardGrid } from './components/inventory-card-grid';

export type SortConfig = {
  key: keyof InventoryItem | 'precios.venta' | 'precios.compra';
  direction: 'ascending' | 'descending';
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'nombre', direction: 'ascending'});
  
  useEffect(() => {
    setLoading(true);
    const unsub = listenToCollection<InventoryItem>('inventory', (data) => {
        setInventory(data);
        if (loading) setLoading(false);
    });
    return () => unsub();
  }, []);

  const getValue = (object: any, path: string) => {
    return path.split('.').reduce((o, i) => o?.[i], object);
  }

  const sortedAndFilteredInventory = useMemo(() => {
    let sortableItems = [...inventory];

    if (searchQuery) {
        sortableItems = sortableItems.filter(item => 
            item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = getValue(a, sortConfig.key);
        const bValue = getValue(b, sortConfig.key);

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [inventory, searchQuery, sortConfig]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Gestión de Inventario</CardTitle>
            <CardDescription>Ver y gestionar stock, ubicación, precios e información de proveedores.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline">
              <Link href="/inventory/import">
                <FileUp className="mr-2 h-4 w-4" />
                Importar desde Excel
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>
            <InventoryCardGrid inventory={sortedAndFilteredInventory} />
        </CardContent>
      </Card>
    </div>
  );
}
