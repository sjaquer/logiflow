
'use client';
import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import type { InventoryItem } from '@/lib/types';
import { CreateOrderForm } from './components/create-order-form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client } from '../clients/page'; // Adjusted import

function CreateOrderPageContent() {
    const searchParams = useSearchParams();
    const clientId = searchParams.get('clientId');
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialClient, setInitialClient] = useState<Client | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [inventoryData, clientsData] = await Promise.all([
                    getCollectionData<InventoryItem>('inventory'),
                    getCollectionData<Client>('clients')
                ]);
                setInventory(inventoryData);
                setClients(clientsData);

                if (clientId) {
                    const foundClient = clientsData.find(c => c.id === clientId) || null;
                    setInitialClient(foundClient);
                }
            } catch (error) {
                console.error("Error fetching initial data for order creation:", error);
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
                    <Skeleton className="h-11 w-52" />
                 </div>
                 <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-96 w-full" />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    return (
       <CreateOrderForm 
          inventory={inventory} 
          clients={clients}
          initialClient={initialClient}
       />
    );
}

export default function CreateOrderPage() {
    return (
        <Suspense fallback={
             <div className="flex-1 flex items-center justify-center">
                <p>Cargando...</p>
            </div>
        }>
            <CreateOrderPageContent />
        </Suspense>
    );
}
