
'use client';
import { useState } from 'react';
import type { InventoryItem } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import { QuickEditForm } from './quick-edit-form';

interface InventoryCardProps {
  item: InventoryItem;
}

export function InventoryCard({ item }: InventoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getStockStatus = (item: InventoryItem): { text: string; variant: 'success' | 'destructive' | 'secondary' | 'outline' | 'accent' } => {
    if (item.estado === 'DESCONTINUADO') return { text: 'Descontinuado', variant: 'outline' };
    if (item.stock_actual === 0) return { text: 'Sin Stock', variant: 'destructive' };
    if (item.stock_actual <= item.stock_minimo) return { text: 'Stock Bajo', variant: 'accent' };
    return { text: 'En Stock', variant: 'success' };
  };

  const status = getStockStatus(item);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-base leading-tight">{item.nombre}</CardTitle>
            <Badge variant="secondary">{item.sku}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {isEditing ? (
            <QuickEditForm item={item} onFinished={() => setIsEditing(false)} />
        ) : (
            <>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stock Actual</span>
                    <span className="font-bold text-lg">{item.stock_actual}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tienda</span>
                    <span className="font-medium">{item.tienda}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ubicación</span>
                    <span className="font-mono text-sm">{item.ubicacion_almacen || 'N/A'}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Proveedor</span>
                    <span className="font-medium text-sm">{item.proveedor.nombre || 'N/A'}</span>
                </div>
            </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 pt-4">
         {!isEditing && (
            <>
                <div className="flex justify-between items-baseline">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Compra</span>
                        <span className="font-semibold">S/ {item.precios.compra.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-muted-foreground">Venta</span>
                        <span className="font-bold text-lg text-primary">S/ {item.precios.venta.toFixed(2)}</span>
                    </div>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edición Rápida
                </Button>
            </>
         )}
      </CardFooter>
    </Card>
  );
}
