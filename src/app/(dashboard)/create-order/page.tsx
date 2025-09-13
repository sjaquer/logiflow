
'use client';
import React, { Suspense, useState, useEffect } from 'react';
import { getCollectionData, getDocumentData } from '@/lib/firebase/firestore-client';
import type { InventoryItem, Order } from '@/lib/types';
import { CreateOrderForm } from './components/create-order-form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client } from '@/lib/types';
import { useDevMode } from '@/context/dev-mode-context';

// This component is responsible for fetching ALL necessary data.
function CreateOrderPageContent({ clientId, orderId }: { clientId: string | null, orderId: string | null }) {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [initialClient, setInitialClient] = useState<Client | null>(null);
    const [initialOrder, setInitialOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isDevMode } = useDevMode();

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            
            if (isDevMode) {
              console.group("DEV MODE: CreateOrderPageContent Data Fetching");
              console.log("Timestamp:", new Date().toISOString());
              console.log("Received clientId:", clientId);
              console.log("Received orderId:", orderId);
            }

            try {
                // Fetch static data once
                const inventoryData = await getCollectionData<InventoryItem>('inventory');
                setInventory(inventoryData);
                
                const clientsData = await getCollectionData<Client>('clients');
                setClients(clientsData);

                // If an orderId is provided (from Shopify), fetch that order.
                if (orderId) {
                    const orderDoc = await getDocumentData<Order>('orders', orderId);
                    if (orderDoc) {
                        if (isDevMode) console.log("SUCCESS: Found initialOrder document:", orderDoc);
                        setInitialOrder(orderDoc);
                        // Also fetch the associated client for consistency
                        const clientDoc = await getDocumentData<Client>('clients', orderDoc.cliente.id_cliente);
                        setInitialClient(clientDoc);
                    } else {
                        setError(`Error: No se encontró ningún pedido con el ID: ${orderId}`);
                    }
                }
                // If a clientId is provided (from Kommo), fetch that client.
                else if (clientId) {
                    const clientDoc = await getDocumentData<Client>('clients', clientId);
                     if (clientDoc) {
                        if (isDevMode) console.log("SUCCESS: Found initialClient document:", clientDoc);
                        setInitialClient(clientDoc);
                    } else {
                       setError(`Error: No se encontró ningún cliente con el ID: ${clientId}`);
                    }
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
    }, [clientId, orderId, isDevMode]);


    if (loading) {
        return (
             <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
                 <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-10 w-1/4" />
                    <div className="flex gap-4">
                        <Skeleton className="h-11 w-40" />
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
        return (
            <div className="flex items-center justify-center h-full p-8 text-center text-destructive">
                <p>{error}</p>
            </div>
        );
    }
    
    // The CreateOrderForm is only rendered once all data is available.
    return (
       <CreateOrderForm 
          inventory={inventory} 
          clients={clients}
          initialClient={initialClient}
          initialOrder={initialOrder}
       />
    );
}

// This is the main page component exported.
// It receives searchParams from Next.js on the server.
export default function CreateOrderPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const clientId = typeof searchParams.clientId === 'string' ? searchParams.clientId : null;
  const orderId = typeof searchParams.orderId === 'string' ? searchParams.orderId : null;

  return (
    // The Suspense boundary is crucial for this pattern to work correctly.
    <Suspense fallback={
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <Skeleton className="h-10 w-1/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-11 w-40" />
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
    }>
        <CreateOrderPageContent clientId={clientId} orderId={orderId} />
    </Suspense>
  );
}
