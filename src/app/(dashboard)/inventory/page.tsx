'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getCollectionData, listenToCollection } from '@/lib/firebase/firestore-client';
import type { InventoryItem, Shop } from '@/lib/types';
import { InventoryTable } from './components/inventory-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Edit, Settings, Search, Plus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';


export type SortConfig = {
  key: keyof InventoryItem | 'precios.venta' | 'precios.compra';
  direction: 'ascending' | 'descending';
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'nombre', direction: 'ascending'});
  const [newShopName, setNewShopName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubs: (() => void)[] = [];
    unsubs.push(listenToCollection<InventoryItem>('inventory', (data) => {
        setInventory(data);
        if (loading) setLoading(false);
    }));
    unsubs.push(listenToCollection<Shop>('shops', (data) => setShops(data)));

    return () => unsubs.forEach(unsub => unsub());
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

  const handleAddShop = async () => {
    if (!newShopName.trim()) return;
    try {
      const newShopRef = doc(db, 'shops', newShopName.trim());
      await setDoc(newShopRef, { name: newShopName.trim() });
      toast({ title: "Tienda Agregada", description: `La tienda "${newShopName}" ha sido creada.` });
      setNewShopName('');
    } catch (error) {
      console.error("Error adding shop:", error);
      toast({ title: "Error", description: "No se pudo agregar la tienda.", variant: "destructive" });
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la tienda "${shopId}"? Esta acción no se puede deshacer.`)) return;
    try {
        await deleteDoc(doc(db, 'shops', shopId));
        toast({ title: "Tienda Eliminada", description: `La tienda "${shopId}" ha sido eliminada.` });
    } catch (error) {
        console.error("Error deleting shop:", error);
        toast({ title: "Error", description: "No se pudo eliminar la tienda.", variant: "destructive" });
    }
  };


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
                    Agrega, edita o elimina las tiendas disponibles en el sistema.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nombre de la nueva tienda..." 
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                    />
                    <Button onClick={handleAddShop}>
                        <Plus className="h-4 w-4"/>
                    </Button>
                  </div>
                  <ul className="mt-4 space-y-2">
                      {shops.map(shop => (
                        <li key={shop.id} className="flex justify-between items-center p-2 rounded-md bg-muted">
                           <span>{shop.name}</span>
                           <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteShop(shop.id)}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </li>
                      ))}
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
