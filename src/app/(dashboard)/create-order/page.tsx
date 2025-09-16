
'use client';
import React, { Suspense } from 'react';
import { CreateOrderForm } from './components/create-order-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

// This is the main page component exported.
// It receives searchParams from Next.js on the server.
export default function CreateOrderPage() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const source = searchParams.get('source');

  return (
    <CreateOrderForm leadId={leadId} source={source} />
  );
}
