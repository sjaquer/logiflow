'use client';
import { useForm, useWatch } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COURIERS, SHOPS } from '@/lib/constants';
import type { CreateOrderFormValues, Client } from '../types';
import { Textarea } from '@/components/ui/textarea';

interface ClientFormProps {
  form: ReturnType<typeof useForm<CreateOrderFormValues>>;
  clients: Client[];
}

export function ClientForm({ form, clients }: ClientFormProps) {
  
  const courier = useWatch({
    control: form.control,
    name: 'envio.courier',
  });
  
  const handleClientChange = (dni: string) => {
    const client = clients.find(c => c.dni === dni);
    if (client) {
        form.setValue('cliente.nombres', client.nombres);
        form.setValue('cliente.celular', client.celular);
        form.setValue('envio.direccion', client.direccion || '');
        form.setValue('envio.distrito', client.distrito || '');
        form.setValue('envio.provincia', client.provincia || 'Lima');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cliente y Envío</CardTitle>
        <CardDescription>
          Busca o ingresa los datos del cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
            control={form.control}
            name="cliente.dni"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>DNI del Cliente</FormLabel>
                    <FormControl>
                        <Input 
                            {...field} 
                            placeholder="Buscar o ingresar DNI..." 
                            list="client-dnis"
                            onChange={(e) => {
                                field.onChange(e);
                                handleClientChange(e.target.value);
                            }}
                        />
                    </FormControl>
                    <datalist id="client-dnis">
                        {clients.map(c => <option key={c.id} value={c.dni} />)}
                    </datalist>
                    <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="cliente.nombres"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl><Input {...field} placeholder="Nombre del cliente" /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="cliente.celular"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl><Input {...field} placeholder="987654321" /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
              control={form.control}
              name="tienda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tienda de Origen</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una tienda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SHOPS.map(shop => (
                            <SelectItem key={shop} value={shop}>{shop}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        <FormField
            control={form.control}
            name="envio.direccion"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Dirección de Entrega</FormLabel>
                    <FormControl><Input {...field} placeholder="Av. Siempre Viva 123" /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="envio.distrito"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Distrito</FormLabel>
                    <FormControl><Input {...field} placeholder="Miraflores" /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="envio.provincia"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl><Input {...field} placeholder="Lima" /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="envio.courier"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Courier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un courier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
         {courier === 'SHALOM' && (
             <FormField
                control={form.control}
                name="envio.agencia_shalom"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Agencia Shalom</FormLabel>
                        <FormControl><Input {...field} placeholder="Agencia de recojo" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
         )}
         <FormField
            control={form.control}
            name="notas.nota_pedido"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Horario de Entrega / Notas del Cliente</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Ej: Entregar de 2pm a 5pm, dejar en portería." /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
      </CardContent>
    </Card>
  );
}
