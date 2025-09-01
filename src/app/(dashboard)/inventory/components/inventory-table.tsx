'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/lib/types';

interface InventoryTableProps {
  inventory: InventoryItem[];
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  const getStockStatus = (item: InventoryItem): { text: string; variant: 'success' | 'destructive' | 'secondary' | 'outline' } => {
    if (item.isDiscontinued) {
      return { text: 'Discontinued', variant: 'outline' };
    }
    if (item.stock === 0) {
      return { text: 'Out of Stock', variant: 'destructive' };
    }
    if (item.stock <= item.lowStockThreshold) {
      return { text: 'Low Stock', variant: 'secondary' };
    }
    return { text: 'In Stock', variant: 'success' };
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Location</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>Supplier</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.map((item) => {
          const status = getStockStatus(item);
          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.sku}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-right">{item.stock}</TableCell>
              <TableCell>
                <Badge variant={status.variant} className="capitalize">{status.text}</Badge>
              </TableCell>
              <TableCell>{item.location}</TableCell>
              <TableCell className="text-right">S/ {item.price.toFixed(2)}</TableCell>
              <TableCell>{item.supplier}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
