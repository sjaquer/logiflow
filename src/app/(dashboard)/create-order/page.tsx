
'use client';
import React, { Suspense } from 'react';
import { CreateOrderForm } from './components/create-order-form';
import { Skeleton } from '@/components/ui/skeleton';

// This is the main page component exported.
// It receives searchParams from Next.js on the server.
export default function CreateOrderPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const leadId = typeof searchParams.leadId === 'string' ? searchParams.leadId : null;
  const source = typeof searchParams.source === 'string' ? searchParams.source : null;

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
        <CreateOrderForm leadId={leadId} source={source} />
    </Suspense>
  );
}
