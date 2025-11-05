 'use client';
import { useForm, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_METHODS } from '@/lib/constants';
import type { CreateOrderFormValues } from '../types';

interface PaymentFormProps {
  form: ReturnType<typeof useForm<CreateOrderFormValues>>;
}

export function PaymentForm({ form }: PaymentFormProps) {
  const subtotal = useWatch({ control: form.control, name: 'pago.subtotal' }) || 0;
  const shippingCost = useWatch({ control: form.control, name: 'envio.costo_envio' }) || 0;
  const total = subtotal + shippingCost;

  // Update monto_total reactively without causing uncontrolled repeated updates in render
  useEffect(() => {
    form.setValue('pago.monto_total', total);
  }, [total, form]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pago y Resumen</CardTitle>
        <CardDescription>
          Define los detalles finales del pago.
        </CardDescription>
      </CardHeader>
  <CardContent className="space-y-6 min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <FormField
              control={form.control}
              name="pago.metodo_pago_previsto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un método de pago" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="envio.costo_envio"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Costo de Envío (S/)</FormLabel>
                  <FormControl><Input {...field} className="w-full" type="number" step="0.10" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-md border-b pb-2 mb-2">Resumen del Pedido</h4>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="font-medium">S/ {(subtotal || 0).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Costo de envío:</span>
        <span className="font-medium">S/ {(shippingCost || 0).toFixed(2)}</span>
      </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total a Pagar:</span>
                <span>S/ {total.toFixed(2)}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
