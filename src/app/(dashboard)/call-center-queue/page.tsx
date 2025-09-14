
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, User, UserRole, CallStatus } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { isToday } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Phone, Search, CheckCircle } from 'lucide-react';
import { QueueTable } from './components/queue-table';
import { ManagedQueueTable } from './components/managed-queue-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SHOPS } from '@/lib/constants';

const ALLOWED_ROLES: UserRole[] = ['Call Center', 'Admin', 'Desarrolladores'];

const STATUS_FILTERS: CallStatus[] = ['NUEVO', 'CONTACTADO', 'NO_CONTESTA', 'EN_SEGUIMIENTO', 'NUMERO_EQUIVOCADO'];

export default function CallCenterQueuePage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingLeads, setPendingLeads] = useState<Client[]>([]);
  const [managedLeads, setManagedLeads] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'TODOS'>('TODOS');
  const [shopFilter, setShopFilter] = useState<string | 'TODAS'>('TODAS');
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

  const processLeads = useCallback((leads: Client[]) => {
      const pending: Client[] = [];
      const managed: Client[] = [];

      leads.forEach(lead => {
          if (lead.call_status === 'VENTA_CONFIRMADA' && isToday(new Date(lead.last_updated))) {
              managed.push(lead);
          } else if (lead.call_status !== 'VENTA_CONFIRMADA' && lead.call_status !== 'HIBERNACION') {
              pending.push(lead);
          }
      });
      
      pending.sort((a, b) => new Date(b.first_interaction_at || b.last_updated).getTime() - new Date(a.first_interaction_at || a.last_updated).getTime());
      managed.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
      
      return { pending, managed };
  }, []);

  useEffect(() => {
    setLoading(true);
    const allLeadsMap = new Map<string, Client>();

    const updateState = () => {
        const allLeads = Array.from(allLeadsMap.values());
        const { pending, managed } = processLeads(allLeads);
        setPendingLeads(pending);
        setManagedLeads(managed);
        setLoading(false);
    };

    const unsubClients = listenToCollection<Client>('clients', (clientLeads) => {
        clientLeads.forEach(lead => allLeadsMap.set(lead.id, lead));
        updateState();
    });

    const unsubShopify = listenToCollection<Client>('shopify_leads', (shopifyLeads) => {
        shopifyLeads.forEach(lead => allLeadsMap.set(lead.id, lead));
        updateState();
    });

    return () => {
      unsubClients();
      unsubShopify();
    };
  }, [processLeads]);

  const filteredPendingLeads = useMemo(() => {
    return pendingLeads.filter(lead => {
        const searchInput = searchQuery.toLowerCase();
        const matchesSearch = lead.nombres.toLowerCase().includes(searchInput) ||
          (lead.celular && lead.celular.includes(searchInput)) ||
          (lead.assigned_agent_name && lead.assigned_agent_name.toLowerCase().includes(searchInput));

        const matchesStatus = statusFilter === 'TODOS' || lead.call_status === statusFilter;
        const matchesShop = shopFilter === 'TODAS' || lead.tienda_origen === shopFilter;
        
        return matchesSearch && matchesStatus && matchesShop;
    });
  }, [pendingLeads, searchQuery, statusFilter, shopFilter]);
  
  const filteredManagedLeads = useMemo(() => {
     return managedLeads.filter(lead => {
        const searchInput = searchQuery.toLowerCase();
        return lead.nombres.toLowerCase().includes(searchInput) ||
          (lead.assigned_agent_name && lead.assigned_agent_name.toLowerCase().includes(searchInput));
     });
  }, [managedLeads, searchQuery]);

  const handleProcessClient = useCallback(async (client: Client) => {
    if (!currentUser) {
        toast({ title: 'Error', description: 'No se pudo identificar al usuario.', variant: 'destructive' });
        return;
    }
    
    if (client.assigned_agent_id && client.assigned_agent_id !== currentUser.id_usuario) {
        toast({ title: 'Lead Asignado', description: `${client.assigned_agent_name} ya está trabajando en este lead.`, variant: 'destructive'});
        return;
    }

    try {
        const collectionName = client.source === 'shopify' ? 'shopify_leads' : 'clients';
        const clientRef = doc(db, collectionName, client.id);

        const updateData: any = {
            call_status: 'CONTACTADO',
            assigned_agent_id: currentUser.id_usuario,
            assigned_agent_name: currentUser.nombre,
            assigned_agent_avatar: currentUser.avatar,
            last_updated: new Date().toISOString(),
        };

        await updateDoc(clientRef, updateData);

        toast({
          title: 'Lead Asignado',
          description: `Ahora estás a cargo de ${client.nombres}.`,
        });
        
        router.push(`/create-order?leadId=${client.id}&source=${client.source}`);

    } catch (error) {
        console.error("Error processing client:", error);
        toast({ title: 'Error', description: 'No se pudo asignar el lead.', variant: 'destructive' });
    }
  }, [currentUser, router, toast]);

  const handleDeleteLead = async (clientId: string, source: Client['source']) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lead? Esta acción es permanente.')) {
      return;
    }
    try {
      const collectionName = source === 'shopify' ? 'shopify_leads' : 'clients';
      await deleteDoc(doc(db, collectionName, clientId));
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

  const handleStatusChange = async (clientId: string, status: CallStatus, source: Client['source']) => {
      const collectionName = source === 'shopify' ? 'shopify_leads' : 'clients';
      const clientRef = doc(db, collectionName, clientId);
      try {
          await updateDoc(clientRef, {
              call_status: status,
              assigned_agent_id: null,
              assigned_agent_name: null,
              assigned_agent_avatar: null,
              last_updated: new Date().toISOString()
          });
           toast({
              title: 'Estado Actualizado',
              description: `El lead ha sido marcado como "${status.replace(/_/g, ' ').toLowerCase()}".`,
           });
      } catch (error) {
          console.error("Error updating lead status:", error);
          toast({
              title: 'Error',
              description: 'No se pudo actualizar el estado del lead.',
              variant: 'destructive',
          });
      }
  };
  
   if (!currentUser && loading) {
    return (
       <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
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
            <CardTitle className="flex items-center gap-2">
                <Phone />
                Bandeja de Entrada de Llamadas
            </CardTitle>
            <CardDescription>
                Lista de clientes potenciales (de Kommo y Shopify) para contactar, confirmar datos y crear un pedido.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI o agente..."
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
            <Select value={shopFilter} onValueChange={(value) => setShopFilter(value as any)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtrar por tienda" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="TODAS">Todas las Tiendas</SelectItem>
                    {SHOPS.map(shop => (
                        <SelectItem key={shop} value={shop}>{shop}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <QueueTable
              leads={filteredPendingLeads}
              onProcess={handleProcessClient}
              onDelete={(clientId, source) => handleDeleteLead(clientId, source)}
              onStatusChange={(clientId, status, source) => handleStatusChange(clientId, status, source)}
              currentUserId={currentUser?.id_usuario}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CheckCircle />
                Leads Gestionados Hoy
            </CardTitle>
            <CardDescription>
                Resumen de los leads que han sido confirmados como venta durante el día de hoy.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ManagedQueueTable leads={filteredManagedLeads} />
        </CardContent>
      </Card>
    </div>
  );
}
