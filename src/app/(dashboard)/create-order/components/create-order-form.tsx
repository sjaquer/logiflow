
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { collection, doc, setDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import type { Order, User, Shop, PaymentMethod, Courier, UserRole, InventoryItem, Client } from '@/lib/types';
import type { CreateOrderFormValues } from '../types';
import { SHOPS } from '@/lib/constants';
import { useDevMode } from '@/context/dev-mode-context';

import { ClientForm } from './client-form';
import { ItemsForm } from './items-form';
import { PaymentForm } from './payment-form';
import { useRouter } from 'next/navigation';

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
    initialOrder: Order | null;
}

export function CreateOrderForm({ inventory, clients, initialClient, initialOrder }: CreateOrderFormProps) {
    const { user: authUser } = useAuth();
    const { toast } = useToast();
    const { isDevMode } = useDevMode();
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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
    
    useEffect(() => {
        if (isDevMode) {
          console.group("DEV MODE: CreateOrderForm Data Population");
          console.log("Timestamp:", new Date().toISOString());
          console.log("Received initialClient prop:", initialClient);
          console.log("Received initialOrder prop:", initialOrder);
        }
        
        let clientToLoad = initialClient;
        let orderToLoad = initialOrder;

        // If an order is passed, its data takes precedence
        if (orderToLoad) {
             if (isDevMode) console.log("Populating form from initialOrder...");
            form.setValue('cliente.dni', orderToLoad.cliente.dni);
            form.setValue('cliente.nombres', orderToLoad.cliente.nombres);
            form.setValue('cliente.celular', orderToLoad.cliente.celular);
            form.setValue('envio.direccion', orderToLoad.envio.direccion);
            form.setValue('envio.provincia', orderToLoad.envio.provincia);
            form.setValue('envio.distrito', orderToLoad.envio.distrito);
            form.setValue('tienda', orderToLoad.tienda.nombre);
            form.setValue('items', orderToLoad.items);

            const subtotal = orderToLoad.items.reduce((acc, item) => acc + item.subtotal, 0);
            form.setValue('pago.subtotal', subtotal);
            form.setValue('pago.monto_total', orderToLoad.pago.monto_total);
            form.setValue('envio.costo_envio', orderToLoad.envio.costo_envio);
            
            toast({ title: 'Pedido de Shopify Cargado', description: `Datos del pedido ${orderToLoad.id_interno} listos para confirmar.` });
        }
        // Fallback to client data (from Kommo)
        else if (clientToLoad) {
            if(isDevMode) console.log("Populating form from initialClient...");
            form.setValue('cliente.dni', clientToLoad.dni || '');
            form.setValue('cliente.nombres', clientToLoad.nombres || '');
            form.setValue('cliente.celular', clientToLoad.celular || '');
            form.setValue('envio.direccion', clientToLoad.direccion || '');
            form.setValue('envio.provincia', clientToLoad.provincia || 'Lima');
            form.setValue('envio.distrito', clientToLoad.distrito || '');
            
            toast({ title: 'Cliente Precargado', description: `Datos de ${clientToLoad.nombres} listos para confirmar.` });
        }

        if (isDevMode) console.groupEnd();
    }, [initialClient, initialOrder, form, toast, isDevMode]);


    useEffect(() => {
        if (authUser) {
          const unsubUser = listenToCollection<User>('users', (users) => {
            const foundUser = users.find(u => u.email === authUser.email);
            setCurrentUser(foundUser || null);
          });
          return () => unsubUser();
        }
      }, [authUser]);


    const onSubmit = async (data: CreateOrderFormValues) => {
        if (!currentUser) {
            toast({ title: "Error de Autenticación", description: "No se pudo identificar al usuario. Por favor, re-inicia sesión.", variant: "destructive"});
            return;
        }

        setIsSubmitting(true);
        const batch = writeBatch(db);

        // --- 1. Client Management ---
        const clientRef = doc(db, 'clients', data.cliente.dni);
        const clientData: Client = {
          id: data.cliente.dni,
          dni: data.cliente.dni,
          nombres: data.cliente.nombres,
          celular: data.cliente.celular,
          direccion: data.envio.direccion,
          distrito: data.envio.distrito,
          provincia: data.envio.provincia,
          // If it came from an initial order, preserve its source, otherwise 'manual' or 'kommo'
          source: initialOrder?.source || initialClient?.source || 'manual',
          last_updated: new Date().toISOString(),
          call_status: 'VENTA_CONFIRMADA',
        };
        // Use set with merge to create or update the client
        batch.set(clientRef, clientData, { merge: true });

        // --- 2. Order Management ---
        const isUpdate = !!initialOrder;
        const orderId = isUpdate ? initialOrder.id_pedido : `PED-${Date.now()}`;
        const orderRef = doc(db, 'orders', orderId);

        const finalOrderData = {
            id_interno: initialOrder?.id_interno || `MANUAL-${Date.now()}`,
            tienda: { id_tienda: data.tienda || 'Trazto', nombre: data.tienda || 'Trazto' },
            estado_actual: 'EN_PREPARACION', // Move to next step after confirmation
            cliente: { // Denormalize client data in order
                id_cliente: data.cliente.dni, 
                dni: data.cliente.dni,
                nombres: data.cliente.nombres,
                celular: data.cliente.celular
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
            historial: [
                ...(initialOrder?.historial || []),
                {
                    fecha: new Date().toISOString(),
                    id_usuario: currentUser.id_usuario,
                    nombre_usuario: currentUser.nombre,
                    accion: isUpdate ? 'Pedido de Shopify Confirmado' : 'Pedido Manual Creado',
                    detalle: `Pedido procesado por ${currentUser.rol}.`
                }
            ],
            fechas_clave: {
                ...initialOrder?.fechas_clave,
                creacion: initialOrder?.fechas_clave.creacion || new Date().toISOString(),
                confirmacion_llamada: new Date().toISOString(),
                procesamiento_iniciado: new Date().toISOString(),
            },
            notas: {
                nota_pedido: data.notas.nota_pedido,
                observaciones_internas: initialOrder?.notas?.observaciones_internas || '',
                motivo_anulacion: null,
            },
            source: initialOrder?.source || initialClient?.source || 'manual',
            shopify_order_id: initialOrder?.shopify_order_id || undefined,
        };

        if (isUpdate) {
            batch.update(orderRef, finalOrderData);
        } else {
            batch.set(orderRef, { ...finalOrderData, id_pedido: orderId });
        }
        
        try {
            await batch.commit();
            
            toast({ title: "¡Éxito!", description: `Pedido ${orderId} confirmado y guardado.` });
            router.push('/orders');

        } catch (error) {
            console.error("Error processing order:", error);
            toast({ title: "Error", description: "No se pudo procesar el pedido. Hubo un error al guardar en la base de datos.", variant: "destructive" });
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
                    <Button type="submit" size="lg" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                        Confirmar y Guardar Pedido
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
