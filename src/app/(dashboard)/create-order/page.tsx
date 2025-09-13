
'use client';
import React, { Suspense, useState, useEffect } from 'react';
import { getCollectionData, getDocumentData } from '@/lib/firebase/firestore-client';
import type { InventoryItem } from '@/lib/types';
import { CreateOrderForm } from './components/create-order-form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client } from '@/lib/types';
import { useDevMode } from '@/context/dev-mode-context';

// This component is responsible for fetching ALL necessary data.
function CreateOrderPageContent({ clientId }: { clientId: string | null }) {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [initialClient, setInitialClient] = useState<Client | null>(null);
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
            }

            try {
                // Fetch static data once
                const inventoryDataPromise = getCollectionData<InventoryItem>('inventory');
                const clientsDataPromise = getCollectionData<Client>('clients');
                
                // If a clientId is provided, fetch that specific client.
                let initialClientPromise: Promise<Client | null> = Promise.resolve(null);
                if (clientId) {
                    initialClientPromise = getDocumentData<Client>('clients', clientId);
                }

                // Wait for all promises to resolve
                const [inventoryData, clientsData, clientDoc] = await Promise.all([
                    inventoryDataPromise,
                    clientsDataPromise,
                    initialClientPromise
                ]);

                setInventory(inventoryData);
                if (isDevMode) console.log("Fetched Inventory:", inventoryData.length > 0 ? inventoryData : "No inventory found");

                setClients(clientsData);
                if (isDevMode) console.log("Fetched All Clients:", clientsData.length > 0 ? clientsData : "No clients found");

                if (clientId) {
                    if (clientDoc) {
                        if (isDevMode) console.log("SUCCESS: Found initialClient document:", clientDoc);
                        setInitialClient(clientDoc);
                    } else {
                        setError(`Error: No se encontró ningún cliente/lead con el ID: ${clientId}`);
                        if (isDevMode) console.error(`FAILED: Could not find client with ID: ${clientId}`);
                    }
                } else {
                    if (isDevMode) console.log("No clientId provided, starting with a blank form.");
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
    }, [clientId, isDevMode]);


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
