
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2, Save, SaveAll } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { collection, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getCollectionData, listenToCollection } from '@/lib/firebase/firestore-client';
import type { Order, User, Shop, PaymentMethod, Courier, UserRole, InventoryItem, CallStatus } from '@/lib/types';
import type { CreateOrderFormValues, Client } from '../types';
import { SHOPS } from '@/lib/constants';
import { useDevMode } from '@/context/dev-mode-context';

import { ClientForm } from './client-form';
import { ItemsForm } from './items-form';
import { PaymentForm } from './payment-form';

const createOrderSchema = z.object({
    tienda: z.custom<Shop>(val => SHOPS.includes(val as Shop), { message: "Tienda inválida" }).optional(),
    cliente: z.object({
        dni: z.string().length(8, "DNI debe tener 8 dígitos"),
        nombres: z.string().min(3, "Nombre es requerido"),
        celular: z.string().min(9, "Celular es requerido"),
    }),
    items: z.array(z.object({
        sku: z.string(),
        nombre: z.string(),
        variante: z.string(),
        cantidad: z.number().min(1),
        precio_unitario: z.number(),
        subtotal: z.number(),
        estado_item: z.literal('PENDIENTE'),
    })).min(1, "Debes agregar al menos un producto."),
    pago: z.object({
        subtotal: z.number(),
        monto_total: z.number(),
        metodo_pago_previsto: z.custom<PaymentMethod>().optional(),
    }),
    envio: z.object({
        direccion: z.string().min(1, "Dirección es requerida"),
        provincia: z.string().min(1, "Provincia es requerida"),
        distrito: z.string().min(1, "Distrito es requerido"),
        courier: z.custom<Courier>().optional(),
        agencia_shalom: z.string().optional(),
        costo_envio: z.number().min(0),
    }),
    notas: z.object({
        nota_pedido: z.string().optional(),
    })
});

const ALLOWED_ROLES: UserRole[] = ['Call Center', 'Admin', 'Desarrolladores'];

interface CreateOrderFormProps {
    inventory: InventoryItem[];
    clients: Client[];
    initialClient: Client | null;
}

export function CreateOrderForm({ inventory, clients, initialClient }: CreateOrderFormProps) {
    const { user: authUser } = useAuth();
    const { toast } = useToast();
    const { isDevMode } = useDevMode();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    const form = useForm<CreateOrderFormValues>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            cliente: { dni: '', nombres: '', celular: '' },
            items: [],
            pago: { subtotal: 0, monto_total: 0 },
            envio: { direccion: '', provincia: 'Lima', distrito: '', costo_envio: 0 },
            notas: { nota_pedido: '' }
        },
    });
    
    // This useEffect is now responsible for populating the form when a client is pre-loaded
    useEffect(() => {
        if (isDevMode) {
          console.group("DEV MODE: CreateOrderForm Data Population");
          console.log("Timestamp:", new Date().toISOString());
          console.log("Received initialClient prop:", initialClient);
        }

        if (initialClient) {
            if (isDevMode) console.log("Attempting to populate form with initialClient data...");
            // Use setValue for each field to ensure robust update in all environments
            form.setValue('cliente.dni', initialClient.dni || '');
            form.setValue('cliente.nombres', initialClient.nombres || '');
            form.setValue('cliente.celular', initialClient.celular || '');
            form.setValue('envio.direccion', initialClient.direccion || '');
            form.setValue('envio.provincia', initialClient.provincia || 'Lima');
            form.setValue('envio.distrito', initialClient.distrito || '');
            
            if (initialClient.tienda_origen) {
              form.setValue('tienda', initialClient.tienda_origen);
            }
            
            if (initialClient.shopify_items && initialClient.shopify_items.length > 0) {
              if(isDevMode) console.log("Populating items from shopify_items:", initialClient.shopify_items);
              const subtotal = initialClient.shopify_items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
              form.setValue('items', initialClient.shopify_items);
              form.setValue('pago.subtotal', subtotal);
              form.setValue('pago.monto_total', subtotal + (form.getValues('envio.costo_envio') || 0));
            } else {
              if(isDevMode) console.log("No shopify_items found, setting items to empty array.");
              form.setValue('items', []);
            }
            
             toast({
                title: 'Cliente Precargado',
                description: `Datos de ${initialClient.nombres} listos para confirmar.`,
            });
        }
        if (isDevMode) console.groupEnd();
    }, [initialClient, form, toast, isDevMode]);


    useEffect(() => {
        if (authUser) {
          const unsubUser = listenToCollection<User>('users', (users) => {
            const foundUser = users.find(u => u.email === authUser.email);
            setCurrentUser(foundUser || null);
          });
          return () => unsubUser();
        }
      }, [authUser]);
    
    const handleSaveDraft = async () => {
        setIsSavingDraft(true);
        const data = form.getValues();

        if (!initialClient?.id) {
            toast({ title: "Error", description: "No se puede guardar el borrador sin un cliente de origen.", variant: "destructive" });
            setIsSavingDraft(false);
            return;
        }
        
        try {
            const clientRef = doc(db, 'clients', initialClient.id);
            await updateDoc(clientRef, {
                dni: data.cliente.dni,
                nombres: data.cliente.nombres,
                celular: data.cliente.celular,
                direccion: data.envio.direccion,
                distrito: data.envio.distrito,
                provincia: data.envio.provincia,
                estado_llamada: 'EN_SEGUIMIENTO',
                shopify_items: data.items, // Guardar el carrito actual
                id_agente_asignado: null, // Liberar agente para que otro pueda tomarlo
                nombre_agente_asignado: null,
                avatar_agente_asignado: null,
            });
            toast({ title: "Borrador Guardado", description: "El progreso se ha guardado. El lead está disponible en la cola." });
        } catch (error) {
            console.error("Error saving draft:", error);
            toast({ title: "Error", description: "No se pudo guardar el borrador.", variant: "destructive" });
        } finally {
            setIsSavingDraft(false);
        }
    };


    const onSubmit = async (data: CreateOrderFormValues) => {
        if (!currentUser) {
            toast({ title: "Error", description: "No se pudo identificar al usuario. Por favor, re-inicia sesión.", variant: "destructive"});
            return;
        }
        
        if (!data.cliente.dni || data.cliente.dni.length !== 8) {
             toast({ title: "DNI Requerido", description: "El DNI del cliente es obligatorio y debe tener 8 dígitos.", variant: "destructive"});
             return;
        }

        setIsSubmitting(true);

        const newOrder: Omit<Order, 'id_pedido'> = {
            id_interno: `INT-${Date.now()}`,
            tienda: { id_tienda: data.tienda || 'Trazto', nombre: data.tienda || 'Trazto' },
            estado_actual: 'PENDIENTE',
            cliente: {
                ...data.cliente,
                dni: data.cliente.dni,
            },
            items: data.items,
            pago: {
                monto_total: data.pago.monto_total,
                monto_pendiente: data.pago.monto_total,
                metodo_pago_previsto: data.pago.metodo_pago_previsto!,
                estado_pago: 'PENDIENTE',
                comprobante_url: null,
                fecha_pago: null,
            },
            envio: {
                ...data.envio,
                tipo: data.envio.provincia.toLowerCase() === 'lima' ? 'LIMA' : 'PROVINCIA',
                nro_guia: null,
                link_seguimiento: null,
            },
            asignacion: {
                id_usuario_actual: currentUser.id_usuario,
                nombre_usuario_actual: currentUser.nombre,
            },
            historial: [{
                fecha: new Date().toISOString(),
                id_usuario: currentUser.id_usuario,
                nombre_usuario: currentUser.nombre,
                accion: 'Pedido Confirmado',
                detalle: `Pedido confirmado y procesado por ${currentUser.rol}.`
            }],
            fechas_clave: {
                creacion: new Date().toISOString(),
                preparacion: null,
                despacho: null,
                entrega_estimada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                entrega_real: null,
                anulacion: null,
            },
            notas: {
                ...data.notas,
                observaciones_internas: '',
                motivo_anulacion: null,
            }
        };

        try {
            // It's crucial to have an initialClient ID to update its status
            if (initialClient?.id) {
                 const clientRef = doc(db, 'clients', initialClient.id);
                 await updateDoc(clientRef, { 
                     estado_llamada: 'VENTA_CONFIRMADA',
                 });
            } else {
                 console.warn("No initialClient found to update status. This might happen for manually created orders.");
            }

            const orderCollectionRef = collection(db, 'orders');
            const docRef = await addDoc(orderCollectionRef, newOrder);
            await setDoc(doc(db, 'orders', docRef.id), { id_pedido: docRef.id }, { merge: true });
            
            toast({ title: "¡Éxito!", description: `Pedido ${docRef.id} confirmado y guardado.` });
            form.reset();

        } catch (error) {
            console.error("Error processing order:", error);
            toast({ title: "Error", description: "No se pudo procesar el pedido.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
          event.preventDefault();
        }
      };
    
    if (currentUser && !ALLOWED_ROLES.includes(currentUser.rol)) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                 <div className="text-center bg-card p-8 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">Acceso Denegado</h3>
                    <p className="text-sm text-muted-foreground">
                        Esta sección es exclusiva para usuarios autorizados.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Procesar Pedido</h1>
                    <p className="text-muted-foreground">Confirma los datos del cliente, verifica los productos y guarda el pedido.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="lg" disabled={isSavingDraft || isSubmitting} onClick={handleSaveDraft}>
                       {isSavingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       <SaveAll className="mr-2 h-4 w-4"/>
                       Guardar Borrador
                    </Button>
                    <Button type="submit" size="lg" disabled={isSubmitting || isSavingDraft} onClick={form.handleSubmit(onSubmit)}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4"/>
                        Guardar Pedido Confirmado
                    </Button>
                </div>
             </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 space-y-8">
                         <ItemsForm form={form} inventory={inventory} />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <ClientForm form={form} clients={clients} />
                        <PaymentForm form={form} />
                    </div>
                </form>
            </Form>
        </div>
    );
}

    
