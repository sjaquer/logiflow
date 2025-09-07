
'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { Client } from '@/lib/types';

const clientSchema = z.object({
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos.'),
  nombres: z.string().min(3, 'El nombre es requerido.'),
  celular: z.string().min(9, 'El celular es requerido.'),
  email: z.string().email('Email inválido.').optional().or(z.literal('')),
  direccion: z.string().optional(),
  distrito: z.string().optional(),
  provincia: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (clientData: ClientFormValues) => void;
  client: Client | null;
}

export function ClientDialog({ isOpen, onOpenChange, onSave, client }: ClientDialogProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      dni: '',
      nombres: '',
      celular: '',
      email: '',
      direccion: '',
      distrito: '',
      provincia: 'Lima',
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        dni: client.dni,
        nombres: client.nombres,
        celular: client.celular,
        email: client.email || '',
        direccion: client.direccion || '',
        distrito: client.distrito || '',
        provincia: client.provincia || 'Lima',
      });
    } else {
      form.reset({
        dni: '',
        nombres: '',
        celular: '',
        email: '',
        direccion: '',
        distrito: '',
        provincia: 'Lima',
      });
    }
  }, [client, isOpen, form]);
  
  const onSubmit = (data: ClientFormValues) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</DialogTitle>
          <DialogDescription>
            Completa los detalles del cliente. Haz clic en guardar para aplicar los cambios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="12345678" disabled={!!client} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nombres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl><Input {...field} placeholder="Juan Pérez" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="celular"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Opcional)</FormLabel>
                  <FormControl><Input {...field} placeholder="cliente@email.com" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección (Opcional)</FormLabel>
                  <FormControl><Input {...field} placeholder="Av. Siempre Viva 123" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="distrito"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distrito (Opcional)</FormLabel>
                  <FormControl><Input {...field} placeholder="Miraflores" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cliente
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
