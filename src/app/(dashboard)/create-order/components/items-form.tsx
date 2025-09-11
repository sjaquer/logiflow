'use client';
import { useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import type { InventoryItem } from '@/lib/types';
import type { CreateOrderFormValues } from '../types';

interface ItemsFormProps {
  form: ReturnType<typeof useForm<CreateOrderFormValues>>;
  inventory: InventoryItem[];
}

export function ItemsForm({ form, inventory }: ItemsFormProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const filteredInventory = inventory.filter(
    (item) =>
      item.stock_actual > 0 &&
      (item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const itemsInCart = useWatch({
      control: form.control,
      name: 'items',
  });

  const addProductToOrder = (item: InventoryItem) => {
    const existingItemIndex = fields.findIndex((field) => field.sku === item.sku);
    if (existingItemIndex !== -1) {
      const currentItem = fields[existingItemIndex];
      update(existingItemIndex, {
        ...currentItem,
        cantidad: currentItem.cantidad + 1,
        subtotal: (currentItem.cantidad + 1) * currentItem.precio_unitario,
      });
    } else {
      append({
        sku: item.sku,
        nombre: item.nombre,
        variante: '',
        cantidad: 1,
        precio_unitario: item.precios.venta,
        subtotal: item.precios.venta,
        estado_item: 'PENDIENTE',
      });
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    const item = fields[index];
    if (newQuantity > 0) {
      update(index, {
        ...item,
        cantidad: newQuantity,
        subtotal: newQuantity * item.precio_unitario,
      });
    }
  };
  
  const subtotal = itemsInCart.reduce((acc, item) => acc + item.subtotal, 0);
  form.setValue('pago.subtotal', subtotal);


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Artículos del Pedido</CardTitle>
        <CardDescription>Busca y agrega los productos que el cliente desea comprar.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Search Section */}
        <div className="space-y-4 flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-grow h-[300px] overflow-y-auto border rounded-md">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredInventory.length > 0 ? (
                    filteredInventory.map(item => (
                        <TableRow key={item.sku}>
                            <TableCell>
                                <p className="font-medium">{item.nombre}</p>
                                <p className="text-xs text-muted-foreground">{item.sku}</p>
                            </TableCell>
                            <TableCell className="text-right">{item.stock_actual}</TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" onClick={() => addProductToOrder(item)}>Agregar</Button>
                            </TableCell>
                        </TableRow>
                    ))
                   ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
                           {searchTerm ? 'No se encontraron productos.' : 'Busca un producto para empezar.'}
                        </TableCell>
                    </TableRow>
                   )}
                </TableBody>
            </Table>
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4 flex flex-col">
          <h4 className="font-medium">Carrito de Compras</h4>
          <div className="flex-grow h-[300px] overflow-y-auto border rounded-md p-2 space-y-2">
            {fields.length > 0 ? (
                fields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div>
                            <p className="font-medium">{field.nombre}</p>
                            <p className="text-sm text-muted-foreground">S/ {field.precio_unitario.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(index, field.cantidad - 1)}>
                                <Minus className="w-3 h-3"/>
                            </Button>
                            <Input
                                type="number"
                                className="w-14 h-8 text-center"
                                value={field.cantidad}
                                onChange={(e) => updateQuantity(index, parseInt(e.target.value, 10) || 1)}
                            />
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(index, field.cantidad + 1)}>
                                <Plus className="w-3 h-3"/>
                            </Button>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove(index)}>
                                <Trash2 className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
                    <ShoppingCart className="w-12 h-12 mb-4" />
                    <p>El carrito está vacío.</p>
                </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
