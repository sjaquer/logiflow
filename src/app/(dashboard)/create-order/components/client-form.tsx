
'use client';
import { useForm, useWatch } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COURIERS, SHOPS } from '@/lib/constants';
import type { CreateOrderFormValues, Client } from '../types';
import { Textarea } from '@/components/ui/textarea';
import { provinces, getDistrictsByProvince } from '@/lib/ubigeo';
import { Combobox } from '@/components/ui/combobox';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface ClientFormProps {
  form: ReturnType<typeof useForm<CreateOrderFormValues>>;
  clients: Client[];
  onSaveClient: () => void;
  isSavingClient: boolean;
}

export function ClientForm({ form, clients, onSaveClient, isSavingClient }: ClientFormProps) {
  
  const courier = useWatch({
    control: form.control,
    name: 'envio.courier',
  });

  const selectedProvince = useWatch({
    control: form.control,
    name: 'envio.provincia'
  });
  
  const [districts, setDistricts] = useState<string[]>([]);
  
  useEffect(() => {
    if (selectedProvince) {
      setDistricts(getDistrictsByProvince(selectedProvince) || []);
    } else {
      setDistricts([]);
    }
  }, [selectedProvince]);

  const handleClientChange = (dni: string) => {
    const client = clients.find(c => c.dni === dni);
    if (client) {
        form.setValue('cliente.id', client.id);
        form.setValue('cliente.nombres', client.nombres);
        form.setValue('cliente.celular', client.celular);
        form.setValue('cliente.email', client.email || '');
        form.setValue('envio.direccion', client.direccion || '');
        form.setValue('envio.provincia', client.provincia || 'Lima');
        // Ensure district is updated after province is set
        setTimeout(() => {
            form.setValue('envio.distrito', client.distrito || '');
        }, 0);
    }
    // If client is not found, do nothing, allowing the agent to fill the form manually.
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const form = (event.target as HTMLElement).closest('form');
      if (!form) return;
      
      const focusable = Array.from(form.querySelectorAll<HTMLElement>('input, button, select, textarea'));
      const index = focusable.indexOf(event.target as HTMLElement);

      if (index > -1 && index < focusable.length - 1) {
        const nextElement = focusable[index + 1];
        nextElement?.focus();
      }
    }
  };

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Cliente y Envío</CardTitle>
                <CardDescription>
                Busca o ingresa los datos del cliente.
                </CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={onSaveClient} disabled={isSavingClient}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cliente
            </Button>
        </div>
  </CardHeader>
  <CardContent className="space-y-6 min-w-0">
        <FormField
            control={form.control}
            name="cliente.dni"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>DNI del Cliente</FormLabel>
          <FormControl>
            <Input 
              {...field} 
              className="w-full"
              placeholder="Buscar o ingresar DNI..." 
              list="client-dnis"
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                field.onChange(e);
                handleClientChange(e.target.value);
              }}
            />
                    </FormControl>
                    <datalist id="client-dnis">
                        {clients.map(c => <option key={c.id} value={c.dni}>{c.nombres}</option>)}
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
                    <FormControl><Input {...field} className="w-full" placeholder="Nombre del cliente" onKeyDown={handleKeyDown} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="cliente.celular"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl><Input {...field} className="w-full" placeholder="987654321" onKeyDown={handleKeyDown} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="cliente.email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email (Opcional)</FormLabel>
                        <FormControl><Input {...field} className="w-full" placeholder="cliente@email.com" onKeyDown={handleKeyDown} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
              control={form.control}
              name="tienda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tienda de Origen</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger onKeyDown={handleKeyDown}>
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
                    <FormControl><Input {...field} className="w-full" placeholder="Av. Siempre Viva 123" onKeyDown={handleKeyDown}/></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="envio.provincia"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Provincia</FormLabel>
                <Combobox
                  options={provinces.map(p => ({ label: p, value: p }))}
                  value={field.value}
                  onChange={(value) => {
                     field.onChange(value);
                     form.setValue('envio.distrito', ''); // Reset district on province change
                  }}
                  placeholder="Selecciona una provincia..."
                  searchPlaceholder="Buscar provincia..."
                  notFoundText="Provincia no encontrada."
                />
                <FormMessage />
              </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="envio.distrito"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Distrito</FormLabel>
                <Combobox
                  options={districts.map(d => ({ label: d, value: d }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecciona un distrito..."
                  searchPlaceholder="Buscar distrito..."
                  notFoundText="Distrito no encontrado."
                  disabled={!selectedProvince}
                />
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
                          <SelectTrigger onKeyDown={handleKeyDown}>
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
              <FormControl>
                <Input
                  className="w-full"
                  placeholder="Agencia de recojo"
                  onKeyDown={handleKeyDown}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
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
                    <FormControl><Textarea {...field} className="w-full" placeholder="Ej: Entregar de 2pm a 5pm, dejar en portería." /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
      </CardContent>
    </Card>
  );
}
