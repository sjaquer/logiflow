'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import type { InventoryItem } from '@/lib/types';
import { InventoryTable } from './components/inventory-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Edit, Settings, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SHOPS } from '@/lib/constants';

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
    const fetchInventory = async () => {
      setLoading(true);
      const inventoryData = await getCollectionData<InventoryItem>('inventory');
      setInventory(inventoryData);
      setLoading(false);
    };
    fetchInventory();
  }, []);

  const requestSort = (key: keyof InventoryItem | 'precios.venta' | 'precios.compra') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
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
            <Skeleton className="h-96 w-full" />
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Gestionar Tiendas
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Gestionar Tiendas</SheetTitle>
                  <SheetDescription>
                    Aquí puedes ver la lista de tiendas actualmente en el sistema.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Para agregar o eliminar una tienda, por favor modifica la lista en el siguiente archivo de configuración del proyecto:
                  </p>
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                    src/lib/constants.ts
                  </code>
                   <ul className="mt-4 list-disc list-inside space-y-2">
                      {SHOPS.map(shop => <li key={shop}>{shop}</li>)}
                   </ul>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button asChild>
              <Link href="/inventory/quick-entry">
                <Edit className="mr-2 h-4 w-4" />
                Editor Rápido de Inventario
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
            <div className="overflow-x-auto">
              <InventoryTable 
                inventory={sortedAndFilteredInventory} 
                requestSort={requestSort}
                sortConfig={sortConfig}
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
