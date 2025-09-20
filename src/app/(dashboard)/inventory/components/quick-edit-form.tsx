
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { InventoryItem } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Loader2, Save, X, Plus, Minus } from 'lucide-react';
import { SHOPS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const editSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  stock_actual: z.number().int('Debe ser un número entero'),
  ajuste: z.number().int('Debe ser un número entero').optional(),
  precio_compra: z.number().min(0),
  precio_venta: z.number().min(0),
  ubicacion_almacen: z.string().optional(),
  tienda: z.string(),
  proveedor_nombre: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface QuickEditFormProps {
  item: InventoryItem;
  onFinished: () => void;
}

export function QuickEditForm({ item, onFinished }: QuickEditFormProps) {
  const { toast } = useToast();
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nombre: item.nombre,
      stock_actual: item.stock_actual,
      ajuste: 0,
      precio_compra: item.precios.compra,
      precio_venta: item.precios.venta,
      ubicacion_almacen: item.ubicacion_almacen,
      tienda: item.tienda,
      proveedor_nombre: item.proveedor.nombre,
    },
  });
  
  const onSubmit = async (data: EditFormValues) => {
    const finalStock = (data.stock_actual || 0) + (data.ajuste || 0);

    try {
        const itemRef = doc(db, 'inventory', item.sku);
        await updateDoc(itemRef, {
            nombre: data.nombre,
            stock_actual: finalStock,
            'precios.compra': data.precio_compra,
            'precios.venta': data.precio_venta,
            ubicacion_almacen: data.ubicacion_almacen,
            tienda: data.tienda,
            'proveedor.nombre': data.proveedor_nombre,
        });
        toast({ title: "Éxito", description: `${item.nombre} actualizado correctamente.` });
        onFinished();
    } catch (error) {
        console.error("Error updating item:", error);
        toast({ title: "Error", description: "No se pudo actualizar el producto.", variant: "destructive" });
    }
  };
  
  const adjustStock = (amount: number) => {
      const currentAjuste = form.getValues('ajuste') || 0;
      form.setValue('ajuste', currentAjuste + amount);
  }
  
  const finalStockPreview = (form.watch('stock_actual') || 0) + (form.watch('ajuste') || 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 text-left">
         <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-xs">Nombre</FormLabel>
                    <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                </FormItem>
            )}
        />
        <div className="grid grid-cols-2 gap-x-2 gap-y-3">
             <FormField
                control={form.control}
                name="precio_compra"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">P. Compra</FormLabel>
                        <FormControl><Input {...field} type="number" step="0.01" className="h-8 text-xs" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="precio_venta"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">P. Venta</FormLabel>
                        <FormControl><Input {...field} type="number" step="0.01" className="h-8 text-xs" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="tienda"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">Tienda</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Tienda" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {SHOPS.map(shop => (
                                    <SelectItem key={shop} value={shop} className="text-xs">{shop}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="proveedor_nombre"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">Proveedor</FormLabel>
                        <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="ubicacion_almacen"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                        <FormLabel className="text-xs">Ubicación</FormLabel>
                        <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                    </FormItem>
                )}
            />
        </div>

        <div>
            <FormLabel className="text-xs">Ajuste de Stock</FormLabel>
            <div className="flex items-center gap-1 mt-1">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustStock(-1)}>
                    <Minus className="h-4 w-4" />
                </Button>
                <FormField
                    control={form.control}
                    name="ajuste"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input {...field} type="number" className="w-14 h-8 text-center text-xs" onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustStock(1)}>
                    <Plus className="h-4 w-4" />
                </Button>
                 <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Stock Final</p>
                    <p className="font-bold text-lg leading-tight">{finalStockPreview}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onFinished}>
             <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  );
}
