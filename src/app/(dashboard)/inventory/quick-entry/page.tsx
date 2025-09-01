'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { BarcodeScanner } from 'react-zxing';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { InventoryItem } from '@/lib/types';
import { Loader2, Minus, Plus, Search, VideoOff, ScanLine, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const quickEntryFormSchema = z.object({
  items: z.array(z.object({
    sku: z.string().min(1, "SKU es requerido"),
    nombre: z.string().min(1, "Nombre es requerido"),
    stock_actual: z.number(),
    ajuste: z.number().int("Debe ser un número entero"),
    precio_venta: z.number().min(0, "El precio no puede ser negativo"),
    ubicacion_almacen: z.string().optional(),
    isNew: z.boolean().optional(),
  }))
});

type QuickEntryFormValues = z.infer<typeof quickEntryFormSchema>;

export default function QuickEntryPage() {
  const [isClient, setIsClient] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [scannedSku, setScannedSku] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<QuickEntryFormValues>({
    resolver: zodResolver(quickEntryFormSchema),
    defaultValues: {
      items: []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const findProductBySku = async (sku: string) => {
    if (!sku) return;
    setIsSearching(true);
    
    const existingItemIndex = fields.findIndex(item => item.sku === sku);
    if (existingItemIndex > -1) {
       toast({ title: "Producto ya en la lista", description: "El producto ya está en la lista de abajo para ser ajustado." });
       setIsSearching(false);
       setScannedSku('');
       return;
    }

    try {
      const inventoryRef = collection(db, 'inventory');
      const q = query(inventoryRef, where('sku', '==', sku));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: "default",
          title: "Producto no encontrado",
          description: `SKU: ${sku} no existe. Se agregará como un nuevo producto.`,
        });
         append({ 
            sku, 
            nombre: "Nuevo Producto", 
            stock_actual: 0, 
            ajuste: 1, 
            precio_venta: 0, 
            ubicacion_almacen: '',
            isNew: true 
        });
      } else {
        const docData = querySnapshot.docs[0].data() as InventoryItem;
        append({
          sku: docData.sku,
          nombre: docData.nombre,
          stock_actual: docData.stock_actual,
          ajuste: 1,
          precio_venta: docData.precios.venta,
          ubicacion_almacen: docData.ubicacion_almacen,
          isNew: false
        });
         toast({ title: "Producto Encontrado", description: `${docData.nombre} añadido a la lista.` });
      }
    } catch (error) {
      console.error("Error searching for product:", error);
      toast({ variant: "destructive", title: "Error de Búsqueda", description: "No se pudo buscar el producto." });
    } finally {
      setIsSearching(false);
      setScannedSku('');
    }
  };

  const processBatchUpdate = async (data: QuickEntryFormValues) => {
    if (data.items.length === 0) {
        toast({ title: "Nada que actualizar", description: "La lista de ajuste está vacía.", variant: "destructive" });
        return;
    }

    const batch = writeBatch(db);
    let updatedCount = 0;

    for (const item of data.items) {
        const itemRef = doc(db, 'inventory', item.sku);
        if (item.isNew) {
            batch.set(itemRef, {
                sku: item.sku,
                nombre: item.nombre,
                stock_actual: item.ajuste,
                precios: { venta: item.precio_venta, compra: 0 },
                ubicacion_almacen: item.ubicacion_almacen || '',
                estado: 'ACTIVO',
                stock_minimo: 0,
                id_producto_base: `P-${Date.now()}`,
                tienda: 'N/A',
                descripcion: '',
                proveedor: { id_proveedor: 'N/A', nombre: 'N/A' },
                variantes: [],
                historial_stock: [],
            });
        } else {
            const newStock = item.stock_actual + item.ajuste;
            batch.update(itemRef, { 
                stock_actual: newStock,
                nombre: item.nombre,
                'precios.venta': item.precio_venta,
                ubicacion_almacen: item.ubicacion_almacen
            });
        }
        updatedCount++;
    }
    
    try {
        await batch.commit();
        toast({
            title: "¡Inventario Actualizado!",
            description: `${updatedCount} producto(s) han sido actualizados/creados correctamente.`,
        });
        form.reset({ items: [] });
    } catch (error) {
        console.error("Error updating inventory:", error);
        toast({
            variant: "destructive",
            title: "Error al Actualizar",
            description: "No se pudo completar la actualización masiva.",
        });
    }
  };

  const adjustStock = (index: number, amount: number) => {
    const currentAjuste = form.getValues(`items.${index}.ajuste`);
    form.setValue(`items.${index}.ajuste`, currentAjuste + amount);
  };
  
  return (
    <div className="grid md:grid-cols-2 gap-8 p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Escáner de Inventario</CardTitle>
          <CardDescription>Use la cámara para escanear códigos de barras o ingrese el SKU manualmente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="flex items-center space-x-2">
                <Switch
                    id="camera-switch"
                    checked={isCameraActive}
                    onCheckedChange={setIsCameraActive}
                    aria-label="Activar/desactivar cámara"
                />
                <Label htmlFor="camera-switch">Activar Cámara</Label>
             </div>

            {isCameraActive && (
                 <div className="relative aspect-video bg-muted rounded-md overflow-hidden border">
                    {isClient ? <BarcodeScanner
                        onResult={(result) => findProductBySku(result.getText())}
                        onError={(error) => {
                            if(error?.name === "NotAllowedError") {
                                setHasCameraPermission(false);
                            }
                        }}
                    /> : <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> }
                    {!hasCameraPermission && isClient && (
                         <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4">
                             <VideoOff className="w-12 h-12 mb-4" />
                            <h3 className="text-lg font-bold">Acceso a la Cámara Denegado</h3>
                            <p className="text-center text-sm">Por favor, habilita los permisos de la cámara en tu navegador para usar el escáner.</p>
                        </div>
                    )}
                 </div>
            )}
           
            <div className="flex w-full items-center space-x-2">
               <form onSubmit={(e) => { e.preventDefault(); findProductBySku(scannedSku);}} className="flex-grow flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="O ingrese SKU manualmente..."
                    value={scannedSku}
                    onChange={(e) => setScannedSku(e.target.value)}
                  />
                  <Button type="submit" disabled={isSearching || !scannedSku}>
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Buscar
                  </Button>
               </form>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Editor Rápido de Inventario</CardTitle>
          <CardDescription>Productos escaneados listos para editar. Los cambios se guardarán en lote.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(processBatchUpdate)} className="flex flex-col flex-grow">
            <CardContent className="flex-grow space-y-4 overflow-y-auto">
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full rounded-md border border-dashed p-8">
                    <ScanLine className="w-12 h-12 mb-4" />
                    <p>Escanee o busque un producto para comenzar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 rounded-md border bg-muted/50 space-y-4">
                       <div className="flex justify-between items-start">
                           <div>
                                <p className="font-semibold text-lg">{field.sku}</p>
                                <p className="text-sm text-muted-foreground">
                                    Stock Actual: {field.stock_actual}
                                    {field.isNew && <span className="text-primary font-medium ml-2">(Nuevo)</span>}
                                </p>
                           </div>
                           <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                               <Trash2 className="w-4 h-4 text-destructive" />
                           </Button>
                       </div>
                       
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <FormField
                                control={form.control}
                                name={`items.${index}.nombre`}
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Nombre del Producto</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                           />
                           <FormField
                                control={form.control}
                                name={`items.${index}.precio_venta`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Venta (S/)</FormLabel>
                                        <FormControl><Input {...field} type="number" step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                           />
                           <FormField
                                control={form.control}
                                name={`items.${index}.ubicacion_almacen`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ubicación</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                           />
                        </div>
                        
                        <Separator />

                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <FormLabel>Ajuste de Stock</FormLabel>
                                <div className="flex items-center gap-1 mt-2">
                                     <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustStock(index, -1)}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.ajuste`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                     <Input {...field} type="number" className="w-20 h-8 text-center" onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustStock(index, 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                             <p className="text-sm">
                                Stock Final: <span className="font-bold">{ form.watch(`items.${index}.stock_actual`) + form.watch(`items.${index}.ajuste`) }</span>
                            </p>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-6">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || fields.length === 0}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios en Lote
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
