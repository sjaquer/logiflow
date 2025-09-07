'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Webhook as WebhookIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { db } from '@/lib/firebase/firebase';
import { collection, doc, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Webhook } from '@/lib/types';
import { WEBHOOK_EVENTS } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const webhookSchema = z.object({
  name: z.string().min(3, 'El nombre es requerido.'),
  url: z.string().url('Debe ser una URL válida.'),
  event: z.enum(['ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'STOCK_CONFIRMED', 'ORDER_CANCELLED']),
  active: z.boolean().default(true),
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const { toast } = useToast();

  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: '',
      url: '',
      event: 'ORDER_CREATED',
      active: true,
    },
  });
  
  useEffect(() => {
    const unsubscribe = listenToCollection<Webhook>('webhooks', (data) => {
      setWebhooks(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenDialog = (webhook: Webhook | null = null) => {
    setEditingWebhook(webhook);
    if (webhook) {
      form.reset({
        name: webhook.name,
        url: webhook.url,
        event: webhook.event,
        active: webhook.active,
      });
    } else {
      form.reset();
    }
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
      if (!confirm('¿Estás seguro de que quieres eliminar este webhook?')) return;
      try {
          await deleteDoc(doc(db, 'webhooks', id));
          toast({ title: 'Éxito', description: 'Webhook eliminado correctamente.' });
      } catch (error) {
          toast({ title: 'Error', description: 'No se pudo eliminar el webhook.', variant: 'destructive' });
      }
  }

  const onSubmit = async (data: WebhookFormValues) => {
    try {
      if (editingWebhook && editingWebhook.id) {
        // Update existing webhook
        const webhookRef = doc(db, 'webhooks', editingWebhook.id);
        await setDoc(webhookRef, data, { merge: true });
        toast({ title: 'Éxito', description: 'Webhook actualizado correctamente.' });
      } else {
        // Create new webhook
        const webhookCollectionRef = collection(db, 'webhooks');
        await addDoc(webhookCollectionRef, { ...data, createdAt: new Date().toISOString() });
        toast({ title: 'Éxito', description: 'Webhook creado correctamente.' });
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el webhook.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Webhooks</h1>
          <p className="text-muted-foreground">Conecta LogiFlow con otras aplicaciones (ej. Make, Zapier) para automatizar flujos.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Webhook
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
          <CardDescription>Estos son los webhooks que se activarán cuando ocurran los eventos especificados en la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Evento Disparador</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
              ) : webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                     <WebhookIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    No hay webhooks configurados. ¡Añade uno para empezar!
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell>
                      <Badge variant={webhook.active ? 'success' : 'secondary'}>
                        {webhook.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell>{WEBHOOK_EVENTS.find(e => e.value === webhook.event)?.label || webhook.event}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{webhook.url}</TableCell>
                    <TableCell>{format(new Date(webhook.createdAt), 'dd/MM/yyyy', { locale: es })}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(webhook)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(webhook.id!)}>
                           <Trash2 className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Dialog for Add/Edit Webhook */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingWebhook ? 'Editar' : 'Añadir'} Webhook</DialogTitle>
                  <DialogDescription>
                      Completa los detalles para configurar tu webhook. Este se activará cuando ocurra el evento seleccionado.
                  </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                      <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Nombre Descriptivo</FormLabel>
                                  <FormControl>
                                      <Input {...field} placeholder="Ej: Actualizar Lead en Kommo" />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="url"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>URL del Webhook</FormLabel>
                                  <FormControl>
                                      <Input {...field} placeholder="Pega la URL de Make, Zapier, etc." />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="event"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Evento Disparador</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                          <SelectTrigger>
                                              <SelectValue placeholder="Selecciona un evento..." />
                                          </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                          {WEBHOOK_EVENTS.map(e => (
                                              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="active"
                          render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                      <FormLabel>Activo</FormLabel>
                                      <FormMessage />
                                  </div>
                                  <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                              </FormItem>
                          )}
                      />
                       <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Webhook
                            </Button>
                        </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>

    </div>
  );
}
