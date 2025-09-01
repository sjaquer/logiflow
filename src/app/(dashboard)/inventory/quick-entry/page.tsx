'use client';
import { useState, useEffect, useCallback } from 'react';
import { BarcodeScanner } from 'react-zxing';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { InventoryItem } from '@/lib/types';
import { AlertCircle, CheckCircle, Loader2, Minus, Plus, Search, Video, VideoOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const quickEntryFormSchema = z.object({
  items: z.array(z.object({
    sku: z.string().min(1, "SKU es requerido"),
    nombre: z.string().min(1, "Nombre es requerido"),
    stock_actual: z.number(),
    ajuste: z.number().int("Debe ser un número entero"),
  }))
});

type QuickEntryFormValues = z.infer<typeof quickEntryFormSchema>;

export default function QuickEntryPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [scannedSku, setScannedSku] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const form = useForm<QuickEntryFormValues>({
    resolver: zodResolver(quickEntryFormSchema),
    defaultValues: {
      items: []
    },
  });

  const { fields, append, update, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const findProductBySku = async (sku: string) => {
    if (!sku) return;
    setIsSearching(true);
    setScannedSku(sku);

    const existingItemIndex = fields.findIndex(item => item.sku === sku);
    if (existingItemIndex > -1) {
       toast({ title: "Producto ya en la lista", description: "El producto ya está en la lista de abajo para ser ajustado." });
       setIsSearching(false);
       return;
    }

    try {
      const inventoryRef = collection(db, 'inventory');
      const q = query(inventoryRef, where('sku', '==', sku));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Producto no encontrado",
          description: `No se encontró ningún producto con el SKU: ${sku}. Puede agregarlo como nuevo.`,
        });
         append({ sku, nombre: "Nuevo Producto", stock_actual: 0, ajuste: 1 });
      } else {
        const docData = querySnapshot.docs[0].data() as InventoryItem;
        append({
          sku: docData.sku,
          nombre: docData.nombre,
          stock_actual: docData.stock_actual,
          ajuste: 1
        });
         toast({ title: "Producto Encontrado", description: `${docData.nombre} añadido a la lista.` });
      }
    } catch (error) {
      console.error("Error searching for product:", error);
      toast({ variant: "destructive", title: "Error de Búsqueda", description: "No se pudo buscar el producto." });
    } finally {
      setIsSearching(false);
    }
  };

  const processBatchUpdate = async (data: QuickEntryFormValues) => {
    if (data.items.length === 0) {
        toast({ title: "Nada que actualizar", description: "La lista de ajuste está vacía.", variant: "destructive" });
        return;
    }

    const batch = writeBatch(db);
    let successfulUpdates = 0;

    for (const item of data.items) {
        if (item.ajuste !== 0) {
            const newStock = item.stock_actual + item.ajuste;
            const itemRef = doc(db, 'inventory', item.sku);
            batch.update(itemRef, { stock_actual: newStock });
            successfulUpdates++;
        }
    }
    
    if(successfulUpdates === 0) {
        toast({ title: "No hay cambios", description: "Ningún producto tenía un ajuste para aplicar.", variant: "default" });
        return;
    }

    try {
        await batch.commit();
        toast({
            title: "¡Inventario Actualizado!",
            description: `${successfulUpdates} producto(s) han sido actualizados correctamente.`,
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
                    <BarcodeScanner
                        onResult={(result) => findProductBySku(result.getText())}
                        onError={(error) => {
                            if(error.name === "NotAllowedError") {
                                setHasCameraPermission(false);
                            }
                        }}
                    />
                    {!hasCameraPermission && (
                         <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4">
                             <VideoOff className="w-12 h-12 mb-4" />
                            <h3 className="text-lg font-bold">Acceso a la Cámara Denegado</h3>
                            <p className="text-center text-sm">Por favor, habilita los permisos de la cámara en tu navegador para usar el escáner.</p>
                        </div>
                    )}
                 </div>
            )}
           
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="O ingrese SKU manualmente..."
                value={scannedSku || ''}
                onChange={(e) => setScannedSku(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter') {
                        findProductBySku(scannedSku!);
                    }
                }}
              />
              <Button type="button" onClick={() => findProductBySku(scannedSku!)} disabled={isSearching}>
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Ajuste de Stock</CardTitle>
          <CardDescription>Productos escaneados listos para ajustar. El ajuste se suma al stock actual.</CardDescription>
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
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
                        <div className="flex-1">
                            <p className="font-semibold">{field.nombre}</p>
                            <p className="text-sm text-muted-foreground">SKU: {field.sku} &bull; Stock Actual: {field.stock_actual}</p>
                        </div>
                        <div className="flex items-center gap-1">
                             <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustStock(index, -1)}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <FormField
                                control={form.control}
                                name={`items.${index}.ajuste`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                             <Input {...field} type="number" className="w-16 h-8 text-center" onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustStock(index, 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || fields.length === 0}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aplicar Ajustes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
