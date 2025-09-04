'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import type { SortConfig } from '../page';

interface InventoryTableProps {
  inventory: InventoryItem[];
  requestSort: (key: keyof InventoryItem | 'precios.venta' | 'precios.compra') => void;
  sortConfig: SortConfig | null;
}

export function InventoryTable({ inventory, requestSort, sortConfig }: InventoryTableProps) {
  const getStockStatus = (item: InventoryItem): { text: string; variant: 'success' | 'destructive' | 'secondary' | 'outline' | 'accent' } => {
    if (item.estado === 'DESCONTINUADO') {
      return { text: 'Descontinuado', variant: 'outline' };
    }
    if (item.stock_actual === 0) {
      return { text: 'Sin Stock', variant: 'destructive' };
    }
    if (item.stock_actual < 5) {
      return { text: 'Stock Crítico', variant: 'destructive' };
    }
    if (item.stock_actual <= item.stock_minimo) {
      return { text: 'Stock Bajo', variant: 'accent' }; 
    }
    return { text: 'En Stock', variant: 'success' };
  };

  const getSortIndicator = (key: keyof InventoryItem | 'precios.venta' | 'precios.compra') => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
             <Button variant="ghost" onClick={() => requestSort('sku')}>
                SKU <ArrowUpDown className="ml-2 h-4 w-4" />
             </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => requestSort('nombre')}>
                Nombre <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => requestSort('tienda')}>
                Tienda <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead className="text-right">
            <Button variant="ghost" onClick={() => requestSort('stock_actual')}>
                Stock <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">
            <Button variant="ghost" onClick={() => requestSort('precios.compra')}>
                Precio Compra <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button variant="ghost" onClick={() => requestSort('precios.venta')}>
                Precio Venta <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.map((item) => {
          const status = getStockStatus(item);
          return (
            <TableRow key={item.sku}>
              <TableCell className="font-medium">{item.sku}</TableCell>
              <TableCell>{item.nombre}</TableCell>
              <TableCell>{item.tienda}</TableCell>
              <TableCell>{item.proveedor.nombre}</TableCell>
              <TableCell className="text-right">{item.stock_actual}</TableCell>
              <TableCell>
                <Badge variant={status.variant} className="capitalize">{status.text}</Badge>
              </TableCell>
              <TableCell className="text-right">S/ {item.precios.compra.toFixed(2)}</TableCell>
              <TableCell className="text-right">S/ {item.precios.venta.toFixed(2)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
