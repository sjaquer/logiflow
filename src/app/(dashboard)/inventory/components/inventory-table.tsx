'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/lib/types';

interface InventoryTableProps {
  inventory: InventoryItem[];
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  const getStockStatus = (item: InventoryItem): { text: string; variant: 'success' | 'destructive' | 'secondary' | 'outline' } => {
    if (item.estado === 'DESCONTINUADO') {
      return { text: 'Descontinuado', variant: 'outline' };
    }
    if (item.stock_actual === 0) {
      return { text: 'Sin Stock', variant: 'destructive' };
    }
    if (item.stock_actual <= item.stock_minimo) {
      return { text: 'Stock Bajo', variant: 'secondary' };
    }
    return { text: 'En Stock', variant: 'success' };
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Ubicación</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead>Proveedor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.map((item) => {
          const status = getStockStatus(item);
          return (
            <TableRow key={item.sku}>
              <TableCell className="font-medium">{item.sku}</TableCell>
              <TableCell>{item.nombre}</TableCell>
              <TableCell className="text-right">{item.stock_actual}</TableCell>
              <TableCell>
                <Badge variant={status.variant} className="capitalize">{status.text}</Badge>
              </TableCell>
              <TableCell>{item.ubicacion_almacen}</TableCell>
              <TableCell className="text-right">S/ {item.precios.venta.toFixed(2)}</TableCell>
              <TableCell>{item.proveedor.nombre}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
