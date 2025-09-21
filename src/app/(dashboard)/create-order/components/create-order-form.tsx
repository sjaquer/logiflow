
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
import { collection, doc, writeBatch, getDocs, query, where, addDoc, updateDoc } from 'firebase/firestore';
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
    leadId: z.string().optional(),
    leadSource: z.enum(['shopify', 'kommo', 'manual']).optional(),
    kommo_lead_id: z.string().optional(),
    shopify_order_id: z.string().optional(),
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
        distrito: z.string().min(1, "Distrito es requerida"),
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
    leadId: string | null;
    source: string | null;
}

export function CreateOrderForm({ leadId, source }: CreateOrderFormProps) {
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
            leadId: leadId || undefined,
            leadSource: source as CreateOrderFormValues['leadSource'],
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
              console.log("Received leadId:", leadId);
              console.log("Received source:", source);
            }

            try {
                const inventoryPromise = getCollectionData<InventoryItem>('inventory');
                const clientsPromise = getCollectionData<Client>('clients');
                
                let initialLeadPromise: Promise<Client | null> = Promise.resolve(null);
                if (leadId && source) {
                    const collectionName = source === 'shopify' ? 'shopify_leads' : 'clients';
                    if (isDevMode) console.log(`Fetching lead data from ${collectionName} with ID:`, leadId);
                    initialLeadPromise = getDocumentData<Client>(collectionName, leadId);
                }

                const [inventoryData, clientsData, leadDoc] = await Promise.all([
                    inventoryPromise,
                    clientsPromise,
                    initialLeadPromise
                ]);

                setInventory(inventoryData);
                setClients(clientsData);

                if (leadDoc) {
                    if (isDevMode) console.log("SUCCESS: Found initial lead document:", leadDoc);
                    form.setValue('cliente.id', leadDoc.id); 
                    form.setValue('cliente.dni', leadDoc.dni || '');
                    form.setValue('cliente.nombres', leadDoc.nombres || '');
                    form.setValue('cliente.celular', leadDoc.celular || '');
                    form.setValue('cliente.email', leadDoc.email || '');
                    form.setValue('envio.direccion', leadDoc.direccion || '');
                    form.setValue('envio.provincia', leadDoc.provincia || 'Lima');
                    form.setValue('envio.distrito', leadDoc.distrito || '');
                    form.setValue('tienda', leadDoc.tienda_origen);
                    form.setValue('kommo_lead_id', leadDoc.kommo_lead_id);
                    form.setValue('shopify_order_id', leadDoc.shopify_order_id);
                    
                    if (leadDoc.source === 'shopify' && leadDoc.shopify_items) {
                        if(isDevMode) console.log("Shopify items found, populating cart:", leadDoc.shopify_items);
                        form.setValue('items', leadDoc.shopify_items);
                        
                        const subtotal = leadDoc.shopify_items.reduce((acc, item) => acc + item.subtotal, 0);
                        form.setValue('pago.subtotal', subtotal);
                        
                        if (leadDoc.shopify_payment_details) {
                            const shipping = leadDoc.shopify_payment_details.total_shipping;
                            form.setValue('envio.costo_envio', shipping);
                            form.setValue('pago.monto_total', subtotal + shipping);
                        }
                        toast({ title: 'Lead de Shopify Cargado', description: `Datos y productos de ${leadDoc.nombres} listos para confirmar.` });
                    } else {
                        toast({ title: 'Lead Precargado', description: `Datos de ${leadDoc.nombres} listos para confirmar.` });
                    }
                } else if (leadId) {
                    setError(`Error: No se encontró ningún lead con el ID: ${leadId}`);
                    if (isDevMode) console.error(`FAILED: Could not find lead with ID: ${leadId} in source ${source}`);
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
    }, [leadId, source, isDevMode, form, toast]);


    useEffect(() => {
        if (authUser) {
          const unsubUser = listenToCollection<User>('users', (users) => {
            const foundUser = users.find(u => u.email === authUser.email);
            setCurrentUser(foundUser || null);
          });
          return () => unsubUser();
        }
      }, [authUser]);
    
    // This is the single source of truth for saving a client.
    // It returns the definitive client ID.
    const saveOrUpdateClient = async (clientData: CreateOrderFormValues['cliente'], shippingData: CreateOrderFormValues['envio']): Promise<string> => {
        const clientsRef = collection(db, 'clients');
        
        // Search by DNI first, as it's the unique identifier for a permanent client.
        const q = query(clientsRef, where("dni", "==", clientData.dni));
        const querySnapshot = await getDocs(q);

        const clientPayload = {
            nombres: clientData.nombres,
            celular: clientData.celular,
            email: clientData.email,
            dni: clientData.dni,
            direccion: shippingData.direccion,
            distrito: shippingData.distrito,
            provincia: shippingData.provincia,
            last_updated: new Date().toISOString(),
        };

        if (!querySnapshot.empty) {
            // Client with DNI exists, update it and return its ID
            const existingClientDoc = querySnapshot.docs[0];
            await updateDoc(existingClientDoc.ref, clientPayload);
            return existingClientDoc.id;
        } else {
            // Client does not exist, create a new one.
            const newClientPayload = {
                ...clientPayload,
                source: source as 'shopify' | 'kommo' | 'manual',
                call_status: 'VENTA_CONFIRMADA' as const,
                first_interaction_at: new Date().toISOString(),
            };
            const newClientRef = await addDoc(clientsRef, newClientPayload);
            return newClientRef.id;
        }
    };
    
    const handleSaveClient = async () => {
        setIsSavingClient(true);
        try {
            const { cliente, envio } = form.getValues();
             if (!cliente.dni) {
                toast({ title: 'Falta DNI', description: 'Por favor, ingresa el DNI del cliente antes de guardar.', variant: "destructive" });
                setIsSavingClient(false);
                return;
            }
            const finalClientId = await saveOrUpdateClient(cliente, envio);
            form.setValue('cliente.id', finalClientId);
            
            toast({ title: 'Cliente Guardado', description: 'Los datos del cliente se han guardado en la base de datos de clientes.' });
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
        let finalOrderData: Order | null = null;
        
        try {
            // Step 1: Save/Update the client and get the definitive client ID.
            const finalClientId = await saveOrUpdateClient(data.cliente, data.envio);

            const batch = writeBatch(db);

            // Step 2: Create the order with the final client ID.
            const orderId = `PED-${Date.now()}`;
            const orderRef = doc(db, 'orders', orderId);

            const orderToSave: Omit<Order, 'id_pedido'> = {
                id_interno: source === 'shopify' ? `SHOPIFY-${leadId}` : `MANUAL-${Date.now()}`,
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
                        detalle: `Pedido procesado por ${currentUser.nombre} (${currentUser.rol}). Origen: ${source || 'manual'}`
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
                source: source as Order['source'] || 'manual',
                kommo_lead_id: data.kommo_lead_id || null,
                shopify_order_id: data.shopify_order_id,
            };
            
            finalOrderData = { ...orderToSave, id_pedido: orderId };
            if (isDevMode) {
              console.group("DEV MODE: Order Submission");
              console.log("Final Order Data to be saved:", finalOrderData);
              console.groupEnd();
            }
            batch.set(orderRef, finalOrderData);
        
            // Step 3: Update the original lead (from 'clients' or 'shopify_leads')
            if (leadId && source) {
                const collectionName = source === 'shopify' ? 'shopify_leads' : 'clients';
                const leadRef = doc(db, collectionName, leadId);
                batch.update(leadRef, {
                    call_status: 'VENTA_CONFIRMADA',
                    last_updated: new Date().toISOString()
                });
            }

            await batch.commit();
            
            toast({ title: "¡Éxito!", description: `Pedido ${orderId} creado y guardado.` });

            // Step 4: Fire Kommo update directly
            if (isDevMode) console.log('DEV MODE: Attempting to call /api/kommo/update-lead...');
            try {
                const response = await fetch(`/api/kommo/update-lead`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order: finalOrderData
                    })
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || 'Unknown error from /api/kommo/update-lead');
                }
                 if (isDevMode) console.log("SUCCESS: Direct Kommo update API call successful.", result);
            } catch (kommoError: any) {
                console.error("Failed to trigger direct Kommo update:", kommoError);
                toast({
                    title: "Advertencia de Kommo",
                    description: `El pedido se guardó, pero la actualización a Kommo falló: ${kommoError.message}`,
                    variant: "destructive"
                });
            }

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
