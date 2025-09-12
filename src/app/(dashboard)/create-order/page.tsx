
'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import type { InventoryItem, Client } from './types';
import { CreateOrderForm } from './components/create-order-form';
import { Skeleton } from '@/components/ui/skeleton';

function CreateOrderPageContent() {
    const searchParams = useSearchParams();
    const clientId = searchParams.get('clientId');
    const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubs: (() => void)[] = [];
        unsubs.push(listenToCollection<InventoryItem>('inventory', (data) => {
            setInventory(data);
        }));
        unsubs.push(listenToCollection<Client>('clients', (data) => {
            setClients(data);
        }));
        
        // This helps to remove the skeleton state once data is likely loaded
        const timer = setTimeout(() => setLoading(false), 1500);
        unsubs.push(() => clearTimeout(timer));

        return () => unsubs.forEach(unsub => unsub());
    }, []);

    const initialClient = React.useMemo(() => {
        if (!clientId || clients.length === 0) return null;
        return clients.find(c => c.id === clientId) || null;
    }, [clientId, clients]);

    if (loading && clientId) {
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
