
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, User, UserRole } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Phone, Search } from 'lucide-react';
import { QueueTable } from './components/queue-table';

const ALLOWED_ROLES: UserRole[] = ['Call Center', 'Admin', 'Desarrolladores'];

export default function CallCenterQueuePage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
     if (authUser) {
      const unsubUser = listenToCollection<User>('users', (users) => {
        const foundUser = users.find(u => u.email === authUser.email);
        setCurrentUser(foundUser || null);
      });
      return () => unsubUser();
    }
  }, [authUser]);

  useEffect(() => {
    // We listen to the 'clients' collection, which will be populated by webhooks
    // from Kommo, Shopify, etc.
    const unsubscribe = listenToCollection<Client>('clients', (data) => {
      // Filter clients that should be in the call queue.
      // We only show clients whose call status is NOT 'VENTA_CONFIRMADA'.
      const queueLeads = data.filter(client => client.estado_llamada !== 'VENTA_CONFIRMADA');
      
      // Sort leads to show the newest ones first
      queueLeads.sort((a, b) => {
        const dateA = a.last_updated_from_kommo ? new Date(a.last_updated_from_kommo).getTime() : 0;
        const dateB = b.last_updated_from_kommo ? new Date(b.last_updated_from_kommo).getTime() : 0;
        return dateB - dateA;
      });

      setLeads(queueLeads);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead =>
      lead.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.dni && lead.dni.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [leads, searchQuery]);

  const handleProcessClient = (client: Client) => {
    toast({
      title: 'Redirigiendo...',
      description: `Abriendo el formulario de pedido para ${client.nombres}.`,
    });
    // Pass client ID to prefill form, as DNI might be empty
    router.push(`/create-order?clientId=${client.id}`);
  };

  const handleDeleteLead = async (clientId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lead? Esta acción es permanente.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      toast({
        title: 'Lead Eliminado',
        description: 'El lead ha sido eliminado de la cola.',
      });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el lead.',
        variant: 'destructive',
      });
    }
  };
  
   if (!currentUser && loading) {
    return (
       <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (currentUser && !ALLOWED_ROLES.includes(currentUser.rol)) {
    return (
        <div className="flex-1 flex items-center justify-center p-8">
             <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Esta sección es exclusiva para usuarios del equipo de Call Center, administradores y desarrolladores.
                    </p>
                </CardContent>
             </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
                <Phone />
                Bandeja de Entrada de Llamadas
            </CardTitle>
            <CardDescription>
                Esta es tu lista de clientes por contactar. Selecciónalos uno por uno para confirmar sus datos y crear un pedido.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <QueueTable
              leads={filteredLeads}
              onProcess={handleProcessClient}
              onDelete={handleDeleteLead}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
