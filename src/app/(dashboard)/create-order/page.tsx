
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { InventoryItem, Order, User, Shop, PaymentMethod, Courier, UserRole } from '@/lib/types';
import type { CreateOrderFormValues, Client } from './types';
import { SHOPS } from '@/lib/constants';

import { ClientForm } from './components/client-form';
import { ItemsForm } from './components/items-form';
import { PaymentForm } from './components/payment-form';

const createOrderSchema = z.object({
    tienda: z.custom<Shop>(val => SHOPS.includes(val as Shop), { message: "Tienda inválida" }),
    cliente: z.object({
        dni: z.string().min(8, "DNI es requerido").max(8, "DNI debe tener 8 dígitos"),
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
        metodo_pago_previsto: z.custom<PaymentMethod>(),
    }),
    envio: z.object({
        direccion: z.string().min(1, "Dirección es requerida"),
        distrito: z.string().min(1, "Distrito es requerido"),
        provincia: z.string().min(1, "Provincia es requerida"),
        courier: z.custom<Courier>(),
        agencia_shalom: z.string().optional(),
        costo_envio: z.number().min(0),
    }),
    notas: z.object({
        nota_pedido: z.string().optional(),
    })
});

const ALLOWED_ROLES: UserRole[] = ['Call Center', 'Admin', 'Desarrolladores'];

function CreateOrderPageContent() {
    const { user: authUser } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CreateOrderFormValues>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            cliente: { dni: '', nombres: '', celular: '' },
            items: [],
            pago: { subtotal: 0, monto_total: 0 },
            envio: { direccion: '', distrito: '', provincia: 'Lima', costo_envio: 0 },
            notas: { nota_pedido: '' }
        },
    });

    // Function to pre-fill form with client data
    const prefillForm = useCallback((dni: string) => {
        const clientToEdit = clients.find(c => c.dni === dni);
        if (clientToEdit) {
            form.setValue('cliente.dni', clientToEdit.dni);
            form.setValue('cliente.nombres', clientToEdit.nombres);
            form.setValue('cliente.celular', clientToEdit.celular);
            if (clientToEdit.direccion) form.setValue('envio.direccion', clientToEdit.direccion);
            if (clientToEdit.distrito) form.setValue('envio.distrito', clientToEdit.distrito);
            if (clientToEdit.provincia) form.setValue('envio.provincia', clientToEdit.provincia);
             toast({
                title: 'Cliente Precargado',
                description: `Datos de ${clientToEdit.nombres} listos para confirmar.`,
            });
        }
    }, [clients, form, toast]);


    useEffect(() => {
        const unsubs: (() => void)[] = [];
        if (authUser) {
          unsubs.push(listenToCollection<User>('users', (users) => {
            const foundUser = users.find(u => u.email === authUser.email);
            setCurrentUser(foundUser || null);
          }));
        }
        unsubs.push(listenToCollection<InventoryItem>('inventory', setInventory));
        
        const unsubClients = listenToCollection<Client>('clients', (clientsData) => {
            setClients(clientsData);
        });
        unsubs.push(unsubClients);

        return () => unsubs.forEach(unsub => unsub());
    }, [authUser]);

    // Effect to pre-fill form when clients data is loaded and DNI param exists
    useEffect(() => {
        const dniFromParam = searchParams.get('dni');
        if (dniFromParam && clients.length > 0) {
            prefillForm(dniFromParam);
        }
    }, [searchParams, clients, prefillForm]);

    const onSubmit = async (data: CreateOrderFormValues) => {
        if (!currentUser) {
            toast({ title: "Error", description: "No se pudo identificar al usuario. Por favor, re-inicia sesión.", variant: "destructive"});
            return;
        }
        setIsSubmitting(true);

        const newOrder: Omit<Order, 'id_pedido'> = {
            id_interno: `INT-${Date.now()}`,
            tienda: { id_tienda: data.tienda, nombre: data.tienda },
            estado_actual: 'PENDIENTE',
            cliente: data.cliente,
            items: data.items,
            pago: {
                monto_total: data.pago.monto_total,
                monto_pendiente: data.pago.monto_total, // Initially, full amount is pending
                metodo_pago_previsto: data.pago.metodo_pago_previsto,
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
                accion: 'Creación de Pedido',
                detalle: `Pedido creado por ${currentUser.rol}.`
            }],
            fechas_clave: {
                creacion: new Date().toISOString(),
                preparacion: null,
                despacho: null,
                entrega_estimada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
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
            // Save/Update client, and update their call status
            const clientRef = doc(db, 'clients', data.cliente.dni);
            await setDoc(clientRef, { 
                dni: data.cliente.dni,
                nombres: data.cliente.nombres,
                celular: data.cliente.celular,
                direccion: data.envio.direccion,
                distrito: data.envio.distrito,
                provincia: data.envio.provincia,
                estado_llamada: 'VENTA_CONFIRMADA', // Update call status
             }, { merge: true });

            // Save the new order
            const orderCollectionRef = collection(db, 'orders');
            const docRef = await addDoc(orderCollectionRef, newOrder);
            await setDoc(doc(db, 'orders', docRef.id), { id_pedido: docRef.id }, { merge: true });
            
            toast({ title: "¡Éxito!", description: `Pedido ${docRef.id} creado correctamente.` });
            form.reset();

        } catch (error) {
            console.error("Error creating order:", error);
            toast({ title: "Error", description: "No se pudo crear el pedido.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!currentUser || !ALLOWED_ROLES.includes(currentUser.rol)) {
        return (
            <div className="flex-1 flex items-center justify-center">
                 <div className="text-center">
                    <h3 className="text-lg font-semibold">Acceso Denegado</h3>
                    <p className="text-sm text-muted-foreground">
                        Esta sección es exclusiva para usuarios autorizados.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Pedido</h1>
                    <p className="text-muted-foreground">Completa los siguientes pasos para registrar un nuevo pedido en el sistema.</p>
                </div>
             </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <ClientForm form={form} clients={clients} />
                    <ItemsForm form={form} inventory={inventory} />
                    <PaymentForm form={form} />
                    
                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isSubmitting}>
                           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           <Save className="mr-2 h-4 w-4"/>
                            Guardar Pedido
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

// We wrap the component that uses `useSearchParams` with a `Suspense` boundary
export default function CreateOrderPage() {
    return (
        <React.Suspense fallback={<div>Cargando...</div>}>
            <CreateOrderPageContent />
        </React.Suspense>
    );
}
