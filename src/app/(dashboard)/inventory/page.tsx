
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import type { InventoryItem, Shop } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, FileUp, Box } from 'lucide-react';
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
      <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-in">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 shadow-xl">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl bg-white/20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-1/3 bg-white/20" />
              <Skeleton className="h-5 w-2/3 bg-white/10" />
            </div>
          </div>
        </div>
        <Card className="border-border/40 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-in">
      {/* Header con gradiente vibrante */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent/90 to-accent/70 p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
                <Box className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-white">Gestión de Inventario</CardTitle>
                <CardDescription className="mt-2 text-white/90 text-base">
                  Ver y gestionar stock, ubicación, precios e información de proveedores.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-10 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 shadow-lg">
                <Link href="/inventory/import">
                  <FileUp className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Importar desde </span>Excel
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-6 space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 border-border/60 focus-visible:ring-accent shadow-sm"
                />
            </div>
            <InventoryCardGrid inventory={sortedAndFilteredInventory} />
        </CardContent>
      </Card>
    </div>
  );
}
