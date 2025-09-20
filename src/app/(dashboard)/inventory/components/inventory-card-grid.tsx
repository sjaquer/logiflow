
'use client';
import type { InventoryItem } from '@/lib/types';
import { InventoryCard } from './inventory-table';

interface InventoryCardGridProps {
  inventory: InventoryItem[];
}

export function InventoryCardGrid({ inventory }: InventoryCardGridProps) {
  if (inventory.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16">
        No se encontraron productos con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {inventory.map((item) => (
        <InventoryCard key={item.sku} item={item} />
      ))}
    </div>
  );
}
