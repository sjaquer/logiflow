
'use client';
import React, { Suspense, useState, useEffect } from 'react';
import { getCollectionData, getDocumentData } from '@/lib/firebase/firestore-client';
import type { InventoryItem } from '@/lib/types';
import { CreateOrderForm } from './components/create-order-form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client } from './types';

// This component is now responsible for fetching ALL data.
function CreateOrderPageContent({ clientId }: { clientId: string | null }) {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [initialClient, setInitialClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                // Fetch static data once
                const inventoryData = await getCollectionData<InventoryItem>('inventory');
                const clientsData = await getCollectionData<Client>('clients');
                
                setInventory(inventoryData);
                setClients(clientsData);

                // Fetch the specific client to be processed using its ID from the URL
                if (clientId) {
                    const clientDoc = await getDocumentData<Client>('clients', clientId);
                     if (clientDoc) {
                        setInitialClient(clientDoc);
                    } else {
                        setError(`No se encontró ningún cliente con el ID: ${clientId}`);
                    }
                }
            } catch (err) {
                console.error("Error fetching initial data for order creation:", err);
                setError("Error al cargar los datos necesarios para crear el pedido.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [clientId]);


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
    // It receives the data as stable props.
    return (
       <CreateOrderForm 
          inventory={inventory} 
          clients={clients}
          initialClient={initialClient}
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
        <CreateOrderPageContent clientId={clientId} />
    </Suspense>
  );
}

