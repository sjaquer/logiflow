
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, User, UserRole, CallStatus } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Phone, Search } from 'lucide-react';
import { QueueTable } from './components/queue-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CALL_STATUS_BADGE_MAP } from '@/lib/constants';


const ALLOWED_ROLES: UserRole[] = ['Call Center', 'Admin', 'Desarrolladores'];

const STATUS_FILTERS: CallStatus[] = ['NUEVO', 'CONTACTADO', 'NO_CONTESTA', 'EN_SEGUIMIENTO', 'NUMERO_EQUIVOCADO'];

export default function CallCenterQueuePage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'TODOS'>('TODOS');
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
    const unsubscribe = listenToCollection<Client>('clients', (data) => {
      const queueLeads = data.filter(client => client.estado_llamada !== 'VENTA_CONFIRMADA' && client.estado_llamada !== 'HIBERNACION');
      
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
    return leads.filter(lead => {
        const matchesSearch = lead.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lead.dni && lead.dni.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesStatus = statusFilter === 'TODOS' || lead.estado_llamada === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  const handleProcessClient = useCallback(async (client: Client) => {
    if (!currentUser) {
        toast({ title: 'Error', description: 'No se pudo identificar al usuario.', variant: 'destructive' });
        return;
    }

    // Assign agent if lead is new
    if (client.estado_llamada === 'NUEVO') {
        const clientRef = doc(db, 'clients', client.id);
        await updateDoc(clientRef, {
            estado_llamada: 'CONTACTADO',
            id_agente_asignado: currentUser.id_usuario,
            nombre_agente_asignado: currentUser.nombre,
            avatar_agente_asignado: currentUser.avatar || '',
        });
        toast({
          title: 'Lead Asignado',
          description: `Ahora estás a cargo de ${client.nombres}.`,
        });
    }
    
    router.push(`/create-order?clientId=${client.id}`);
  }, [currentUser, router, toast]);

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
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los Estados</SelectItem>
                {STATUS_FILTERS.map(status => (
                  <SelectItem key={status} value={status}>
                    <span className="capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
