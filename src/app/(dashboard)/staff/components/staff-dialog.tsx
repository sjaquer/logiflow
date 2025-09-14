
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
import type { User } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { USER_ROLES } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const userSchema = z.object({
  nombre: z.string().min(3, 'El nombre es requerido.'),
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').optional().or(z.literal('')),
  rol: z.enum(USER_ROLES),
  activo: z.boolean(),
  permisos: z.object({
    puede_crear_pedido: z.boolean(),
    puede_preparar: z.boolean(),
    puede_despachar: z.boolean(),
    puede_confirmar_entrega: z.boolean(),
    puede_anular: z.boolean(),
    puede_gestionar_inventario: z.boolean(),
    puede_ver_reportes: z.boolean(),
  }),
});

type UserFormValues = z.infer<typeof userSchema>;

interface StaffDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (userData: Partial<UserFormValues>) => void;
  user: User | null;
  currentUser: User | null;
}

export function StaffDialog({ isOpen, onOpenChange, onSave, user, currentUser }: StaffDialogProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      rol: 'Call Center',
      activo: true,
      permisos: {
        puede_crear_pedido: false,
        puede_preparar: false,
        puede_despachar: false,
        puede_confirmar_entrega: false,
        puede_anular: false,
        puede_gestionar_inventario: false,
        puede_ver_reportes: false,
      },
    },
  });

  const isEditingSelf = user?.id_usuario === currentUser?.id_usuario;

  useEffect(() => {
    if (isOpen) {
        if (user) {
          form.reset({
            nombre: user.nombre,
            email: user.email,
            password: '', // Password is not fetched for editing
            rol: user.rol,
            activo: user.activo,
            permisos: user.permisos
          });
        } else {
          form.reset({
            nombre: '',
            email: '',
            password: '',
            rol: 'Call Center',
            activo: true,
            permisos: {
                puede_crear_pedido: true,
                puede_preparar: false,
                puede_despachar: false,
                puede_confirmar_entrega: false,
                puede_anular: false,
                puede_gestionar_inventario: false,
                puede_ver_reportes: false,
            },
          });
        }
    }
  }, [user, isOpen, form]);
  
  const onSubmit = (data: UserFormValues) => {
    onSave(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            Completa los detalles y permisos del usuario.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="nombre" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl><Input {...field} placeholder="Juan Pérez" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl><Input {...field} placeholder="usuario@example.com" type="email" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 {!user && (
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl><Input {...field} type="password" placeholder="Mínimo 6 caracteres" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="rol" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rol</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isEditingSelf}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {USER_ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {isEditingSelf && <p className="text-xs text-muted-foreground">No puedes cambiar tu propio rol.</p>}
                            <FormMessage />
                        </FormItem>
                     )} />
                     <FormField control={form.control} name="activo" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Estado</FormLabel>
                             <div className="flex items-center space-x-2 h-10">
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isEditingSelf} /></FormControl>
                                <Label>{field.value ? 'Activo' : 'Inactivo'}</Label>
                             </div>
                             {isEditingSelf && <p className="text-xs text-muted-foreground">No puedes desactivar tu propia cuenta.</p>}
                        </FormItem>
                     )}/>
                </div>

                <Separator />

                <div>
                    <h3 className="text-base font-medium mb-4">Permisos Específicos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {Object.keys(form.getValues('permisos')).map((key) => (
                           <FormField
                            key={key}
                            control={form.control}
                            name={`permisos.${key as keyof User['permisos']}`}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <FormLabel className="text-sm capitalize">{key.replace(/_/g, ' ').replace('puede ', '')}</FormLabel>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                           />
                       ))}
                    </div>
                </div>

                 <DialogFooter className="pt-6">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
