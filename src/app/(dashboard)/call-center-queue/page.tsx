
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, User, UserRole } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

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
    // We listen to the 'clients' collection, assuming leads from Kommo are stored there.
    const unsubscribe = listenToCollection<Client>('clients', (data) => {
      // Filter clients that should be in the call queue.
      // For now, we show those that don't have a 'Venta Confirmada' status.
      const queueLeads = data.filter(client => client.estado_llamada !== 'VENTA_CONFIRMADA');
      setLeads(queueLeads);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead =>
      lead.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.dni.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);

  const handleProcessClient = (client: Client) => {
    toast({
      title: 'Redirigiendo...',
      description: `Abriendo el formulario de pedido para ${client.nombres}.`,
    });
    router.push(`/create-order?dni=${client.dni}`);
  };
  
   if (!currentUser) {
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
  
  if (!ALLOWED_ROLES.includes(currentUser.rol)) {
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


  if (loading) {
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
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
