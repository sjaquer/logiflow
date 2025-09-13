
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
          console.log("Received initialClient:", initialClient);
          console.log("Received initialOrder:", initialOrder);
        }
        
        // Data from a Shopify Order takes precedence
        if (initialOrder) {
            if(isDevMode) console.log("Populating form from initialOrder...");
            form.setValue('cliente.dni', initialOrder.cliente.dni);
            form.setValue('cliente.nombres', initialOrder.cliente.nombres);
            form.setValue('cliente.celular', initialOrder.cliente.celular);
            form.setValue('envio.direccion', initialOrder.envio.direccion);
            form.setValue('envio.provincia', initialOrder.envio.provincia);
            form.setValue('envio.distrito', initialOrder.envio.distrito);
            form.setValue('tienda', initialOrder.tienda.nombre);
            form.setValue('items', initialOrder.items);

            const subtotal = initialOrder.items.reduce((acc, item) => acc + item.subtotal, 0);
            form.setValue('pago.subtotal', subtotal);
            form.setValue('pago.monto_total', initialOrder.pago.monto_total);
            form.setValue('envio.costo_envio', initialOrder.envio.costo_envio);
            
            toast({ title: 'Pedido de Shopify Cargado', description: `Datos del pedido ${initialOrder.id_interno} listos para confirmar.` });
        }
        // Fallback to client data (from Kommo)
        else if (initialClient) {
            if(isDevMode) console.log("Populating form from initialClient...");
            form.setValue('cliente.dni', initialClient.dni || '');
            form.setValue('cliente.nombres', initialClient.nombres || '');
            form.setValue('cliente.celular', initialClient.celular || '');
            form.setValue('envio.direccion', initialClient.direccion || '');
            form.setValue('envio.provincia', initialClient.provincia || 'Lima');
            form.setValue('envio.distrito', initialClient.distrito || '');
            
            toast({ title: 'Cliente Precargado', description: `Datos de ${initialClient.nombres} listos para confirmar.` });
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

        const orderId = initialOrder ? initialOrder.id_pedido : `PED-${Date.now()}`;
        const isUpdate = !!initialOrder;
        
        const finalOrderData = {
            id_interno: initialOrder?.id_interno || `MANUAL-${Date.now()}`,
            tienda: { id_tienda: data.tienda || 'Trazto', nombre: data.tienda || 'Trazto' },
            estado_actual: 'EN_PREPARACION', // Move to next step after confirmation
            cliente: { ...data.cliente, id_cliente: data.cliente.dni },
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
                    accion: 'Pedido Confirmado (Call Center)',
                    detalle: `Pedido confirmado y procesado por ${currentUser.rol}.`
                }
            ],
            fechas_clave: {
                ...(initialOrder?.fechas_clave || { creacion: new Date().toISOString() }),
                confirmacion_llamada: new Date().toISOString(),
                procesamiento_iniciado: new Date().toISOString(),
            },
            notas: {
                ...data.notas,
                observaciones_internas: initialOrder?.notas?.observaciones_internas || '',
                motivo_anulacion: null,
            },
            source: initialOrder?.source || 'manual'
        };

        try {
            const orderRef = doc(db, 'orders', orderId);
            if (isUpdate) {
                await updateDoc(orderRef, finalOrderData);
            } else {
                 await setDoc(orderRef, { ...finalOrderData, id_pedido: orderId });
            }

            // Update client status
            const clientRef = doc(db, 'clients', data.cliente.dni);
            await updateDoc(clientRef, { call_status: 'VENTA_CONFIRMADA' });
            
            toast({ title: "¡Éxito!", description: `Pedido ${orderId} confirmado y guardado.` });
            router.push('/orders');

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
