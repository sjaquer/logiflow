
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
import { collection, doc, setDoc, updateDoc, writeBatch, getDocs, query, where, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { listenToCollection, getCollectionData, getDocumentData } from '@/lib/firebase/firestore-client';
import type { Order, User, Shop, PaymentMethod, Courier, UserRole, InventoryItem, Client } from '@/lib/types';
import type { CreateOrderFormValues } from '../types';
import { SHOPS } from '@/lib/constants';
import { useDevMode } from '@/context/dev-mode-context';

import { ClientForm } from './client-form';
import { ItemsForm } from './items-form';
import { PaymentForm } from './payment-form';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';


const createOrderSchema = z.object({
    tienda: z.custom<Shop>(val => SHOPS.includes(val as Shop), { message: "Tienda inválida" }).optional(),
    cliente: z.object({
        id: z.string().optional(),
        dni: z.string().min(3, "DNI/CE/RUC es requerido"),
        nombres: z.string().min(3, "Nombre es requerido"),
        celular: z.string().min(9, "Celular es requerido"),
        email: z.string().email('Email inválido.').optional().or(z.literal('')),
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
    initialClientId: string | null;
    initialClientData: string | null; // From call-center flow
}

export function CreateOrderForm({ initialClientId, initialClientData }: CreateOrderFormProps) {
    const { user: authUser } = useAuth();
    const { toast } = useToast();
    const { isDevMode } = useDevMode();
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingClient, setIsSavingClient] = useState(false);

    // Data state
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const form = useForm<CreateOrderFormValues>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            cliente: { id: '', dni: '', nombres: '', celular: '', email: '' },
            items: [],
            pago: { subtotal: 0, monto_total: 0 },
            envio: { direccion: '', provincia: 'Lima', distrito: '', costo_envio: 0 },
            notas: { nota_pedido: '' }
        },
    });

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            
            if (isDevMode) {
              console.group("DEV MODE: CreateOrderForm Data Fetching");
              console.log("Timestamp:", new Date().toISOString());
              console.log("Received initialClientId:", initialClientId);
              console.log("Received initialClientData:", initialClientData);
            }

            try {
                const inventoryPromise = getCollectionData<InventoryItem>('inventory');
                const clientsPromise = getCollectionData<Client>('clients');
                
                let parsedClient: Client | null = null;
                
                if (initialClientData) { // From Call Center Queue
                    try {
                        parsedClient = JSON.parse(decodeURIComponent(initialClientData));
                        if (isDevMode) console.log("SUCCESS: Using passed client data from Call Center flow:", parsedClient);
                    } catch (e) {
                        if (isDevMode) console.warn("Could not parse clientData, falling back to fetch by ID:", e);
                    }
                }
                
                let initialClientPromise: Promise<Client | null> = Promise.resolve(parsedClient);
                if (!parsedClient && initialClientId) { // From Kanban Board (Shopify Order)
                    if (isDevMode) console.log("Fetching client by ID as fallback...");
                    initialClientPromise = getDocumentData<Client>('clients', initialClientId);
                }

                const [inventoryData, clientsData, clientDoc] = await Promise.all([
                    inventoryPromise,
                    clientsPromise,
                    initialClientPromise
                ]);

                setInventory(inventoryData);
                setClients(clientsData);

                if (clientDoc) {
                    if (isDevMode) console.log("SUCCESS: Found initial client document:", clientDoc);
                     // This is the client to pre-fill the form
                    form.setValue('cliente.id', clientDoc.id);
                    form.setValue('cliente.dni', clientDoc.dni || '');
                    form.setValue('cliente.nombres', clientDoc.nombres || '');
                    form.setValue('cliente.celular', clientDoc.celular || '');
                    form.setValue('cliente.email', clientDoc.email || '');
                    form.setValue('envio.direccion', clientDoc.direccion || '');
                    form.setValue('envio.provincia', clientDoc.provincia || 'Lima');
                    form.setValue('envio.distrito', clientDoc.distrito || '');
                    form.setValue('tienda', clientDoc.tienda_origen);
                    
                    // Specific logic for Call Center flow (which passes the full client data)
                    if (parsedClient && parsedClient.source === 'shopify' && parsedClient.shopify_items) {
                        if(isDevMode) console.log("Shopify items found, populating cart:", parsedClient.shopify_items);
                        form.setValue('items', parsedClient.shopify_items);
                        const subtotal = parsedClient.shopify_items.reduce((acc, item) => acc + item.subtotal, 0);
                        form.setValue('pago.subtotal', subtotal);
                        if (parsedClient.shopify_payment_details) {
                            const shipping = parsedClient.shopify_payment_details.total_shipping;
                            form.setValue('envio.costo_envio', shipping);
                            form.setValue('pago.monto_total', subtotal + shipping);
                        }
                        toast({ title: 'Lead de Shopify Cargado', description: `Datos y productos de ${clientDoc.nombres} listos para confirmar.` });
                    } else if (clientDoc.source === 'shopify') {
                         // Logic for Shopify orders coming from Kanban (must fetch order details separately)
                        const orderId = `SHOPIFY-${clientDoc.shopify_order_id?.replace('gid://shopify/Order/', '')}`; // Reconstruct order ID if needed
                        const orderSnapshot = await getDocumentData<Order>('orders', `SHOPIFY-${clientDoc.shopify_order_id}`);
                        if(orderSnapshot) {
                            form.setValue('items', orderSnapshot.items);
                            const subtotal = orderSnapshot.items.reduce((acc, item) => acc + item.subtotal, 0);
                            form.setValue('pago.subtotal', subtotal);
                            form.setValue('envio.costo_envio', orderSnapshot.envio.costo_envio);
                             form.setValue('pago.monto_total', orderSnapshot.pago.monto_total);
                             toast({ title: 'Pedido de Shopify Cargado', description: `Datos y productos de ${clientDoc.nombres} listos para confirmar.` });
                        } else {
                            toast({ title: 'Cliente Precargado', description: `Datos de ${clientDoc.nombres} listos. Agregue productos.` });
                        }
                    }
                    else {
                        toast({ title: 'Cliente Precargado', description: `Datos de ${clientDoc.nombres} listos para confirmar.` });
                    }
                } else if (initialClientId) {
                    setError(`Error: No se encontró ningún cliente/lead con el ID: ${initialClientId}`);
                    if (isDevMode) console.error(`FAILED: Could not find client with ID: ${initialClientId}`);
                }


            } catch (err: any) {
                if (isDevMode) console.error("FATAL: Error during initial data fetch:", err);
                setError("Error al cargar los datos necesarios para crear el pedido.");
            } finally {
                if (isDevMode) console.groupEnd();
                setLoading(false);
            }
        }
        fetchData();
    }, [initialClientId, initialClientData, isDevMode, form, toast]);


    useEffect(() => {
        if (authUser) {
          const unsubUser = listenToCollection<User>('users', (users) => {
            const foundUser = users.find(u => u.email === authUser.email);
            setCurrentUser(foundUser || null);
          });
          return () => unsubUser();
        }
      }, [authUser]);

    const saveOrUpdateClient = async (clientData: CreateOrderFormValues['cliente'], shippingData: CreateOrderFormValues['envio']): Promise<string> => {
        const clientsRef = collection(db, 'clients');
        
        // Use client ID from form if it exists (meaning it was pre-loaded)
        if (clientData.id) {
             const clientRef = doc(db, 'clients', clientData.id);
             const clientSnap = await getDoc(clientRef);
             if (clientSnap.exists()) {
                await updateDoc(clientRef, {
                    nombres: clientData.nombres,
                    celular: clientData.celular,
                    email: clientData.email,
                    dni: clientData.dni,
                    direccion: shippingData.direccion,
                    distrito: shippingData.distrito,
                    provincia: shippingData.provincia,
                    last_updated: new Date().toISOString(),
                });
                return clientData.id;
             }
        }

        // If no ID, check if client exists by DNI
        const q = query(clientsRef, where("dni", "==", clientData.dni));
        const querySnapshot = await getDocs(q);

        const newClientPayload = {
            nombres: clientData.nombres,
            celular: clientData.celular,
            email: clientData.email,
            dni: clientData.dni,
            direccion: shippingData.direccion,
            distrito: shippingData.distrito,
            provincia: shippingData.provincia,
            last_updated: new Date().toISOString(),
            source: 'manual', // If created from form, it's manual
            call_status: 'VENTA_CONFIRMADA',
            first_interaction_at: new Date().toISOString(),
        };

        if (!querySnapshot.empty) {
            // Client with DNI exists, update it and return its ID
            const existingClientDoc = querySnapshot.docs[0];
            await updateDoc(existingClientDoc.ref, newClientPayload);
            return existingClientDoc.id;
        } else {
            // Client does not exist, create a new one
            const newClientRef = await addDoc(clientsRef, newClientPayload);
            return newClientRef.id;
        }
    };
    
    const handleSaveClient = async () => {
        setIsSavingClient(true);
        try {
            const formData = form.getValues();
            const clientId = await saveOrUpdateClient(formData.cliente, formData.envio);
            form.setValue('cliente.id', clientId); // Update form state with the correct ID
            toast({ title: 'Cliente Guardado', description: 'Los datos del cliente se han guardado correctamente.' });
        } catch (error) {
            console.error("Error saving client:", error);
            toast({ title: "Error", description: "No se pudo guardar la información del cliente.", variant: "destructive" });
        } finally {
            setIsSavingClient(false);
        }
    };


    const onSubmit = async (data: CreateOrderFormValues) => {
        if (!currentUser) {
            toast({ title: "Error de Autenticación", description: "No se pudo identificar al usuario. Por favor, re-inicia sesión.", variant: "destructive"});
            return;
        }

        setIsSubmitting(true);
        
        try {
            const finalClientId = await saveOrUpdateClient(data.cliente, data.envio);

            const batch = writeBatch(db);

            // --- Order Creation ---
            const orderId = `PED-${Date.now()}`;
            const orderRef = doc(db, 'orders', orderId);

            const finalOrderData: Omit<Order, 'id_pedido'> = {
                id_interno: initialClientId ? `MANUAL-${Date.now()}` : `MANUAL-${Date.now()}`,
                tienda: { id_tienda: data.tienda || 'Trazto', nombre: data.tienda || 'Trazto' },
                estado_actual: 'EN_PREPARACION', 
                cliente: { 
                    id_cliente: finalClientId, 
                    dni: data.cliente.dni,
                    nombres: data.cliente.nombres,
                    celular: data.cliente.celular,
                    email: data.cliente.email
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
                    {
                        fecha: new Date().toISOString(),
                        id_usuario: currentUser.id_usuario,
                        nombre_usuario: currentUser.nombre,
                        accion: 'Pedido Confirmado',
                        detalle: `Pedido procesado por ${currentUser.nombre} (${currentUser.rol}). Origen: ${initialClientId ? 'shopify' : 'manual'}`
                    }
                ],
                fechas_clave: {
                    creacion: new Date().toISOString(),
                    confirmacion_llamada: new Date().toISOString(),
                    procesamiento_iniciado: new Date().toISOString(),
                    preparacion: null,
                    despacho: null,
                    entrega_estimada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    entrega_real: null,
                    anulacion: null,
                },
                notas: {
                    nota_pedido: data.notas.nota_pedido || '',
                    observaciones_internas: '',
                    motivo_anulacion: null,
                },
                source: initialClientId ? 'shopify' : 'manual',
                shopify_order_id: initialClientId || undefined,
            };

            batch.set(orderRef, { ...finalOrderData, id_pedido: orderId });
        
            // Update client status in a separate write if it came from the queue
            if (initialClientData) {
                const clientRef = doc(db, 'clients', finalClientId);
                batch.update(clientRef, { call_status: 'VENTA_CONFIRMADA' });
            }

            await batch.commit();
            
            toast({ title: "¡Éxito!", description: `Pedido ${orderId} creado y guardado.` });
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

    if (loading) {
       return (
             <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
                 <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-10 w-1/4" />
                    <div className="flex gap-4">
                        <Skeleton className="h-11 w-52" />
                    </div>
                 </div>
                 <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-96 w-full" />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <Skeleton className="h-[550px] w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return <div className="text-center text-destructive p-8">{error}</div>;
    }
    
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
                        <ClientForm form={form} clients={clients} onSaveClient={handleSaveClient} isSavingClient={isSavingClient} />
                        <PaymentForm form={form} />
                    </div>
                </form>
            </Form>
        </div>
    );
}

    
