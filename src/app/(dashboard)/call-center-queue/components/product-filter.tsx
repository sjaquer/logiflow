/**
 * Componente de filtro de productos con búsqueda rápida y dropdown
 */

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ProductFilterProps {
  products: string[];
  selectedProducts: string[];
  onApply: (selected: string[]) => void;
  onClear: () => void;
}

export function ProductFilter({
  products,
  selectedProducts,
  onApply,
  onClear
}: ProductFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>(selectedProducts);

  // Sincronizar tempSelected cuando cambien los selectedProducts externos
  useEffect(() => {
    setTempSelected(selectedProducts);
  }, [selectedProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => p.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const handleToggle = (product: string) => {
    setTempSelected(prev =>
      prev.includes(product)
        ? prev.filter(p => p !== product)
        : [...prev, product]
    );
  };

  const handleApply = () => {
    onApply(tempSelected);
  };

  const handleClearAll = () => {
    setTempSelected([]);
    setSearchQuery('');
    onClear();
  };

  const hasActiveFilter = selectedProducts.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-6 w-6 p-0 relative", hasActiveFilter && "text-primary")}
        >
          <Filter className="h-3 w-3" />
          {hasActiveFilter && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={4} className="w-72 bg-popover shadow-md rounded-md border p-0">
        {/* Header con buscador */}
        <div className="p-3 space-y-2 border-b bg-muted/50">
          <h3 className="font-semibold text-sm">Filtrar Productos</h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 text-xs h-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de productos */}
        <ScrollArea className="h-56">
          {filteredProducts.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8 px-3">
              {searchQuery ? 'No se encontraron productos' : 'No hay productos disponibles'}
            </div>
          ) : (
            <div className="p-2">
              {filteredProducts.map(product => (
                <label
                  key={product}
                  className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/20 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={tempSelected.includes(product)}
                    onChange={() => handleToggle(product)}
                  />
                  <span className="flex-1 truncate text-xs" title={product}>
                    {product}
                  </span>
                </label>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Info de selección */}
        {tempSelected.length > 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/20">
            {tempSelected.length} producto{tempSelected.length !== 1 ? 's' : ''} seleccionado{tempSelected.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Botones de acción */}
        <DropdownMenuSeparator />
        <div className="p-2 flex justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Limpiar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleApply}
            className="text-xs"
          >
            Aplicar {tempSelected.length > 0 && `(${tempSelected.length})`}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
