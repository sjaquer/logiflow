
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Client, User, UserRole, CallStatus } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useAuth } from '@/context/auth-context';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Activity } from 'lucide-react';
import { MonitoringTable } from './components/monitoring-table';

const ALLOWED_ROLES: UserRole[] = ['Admin', 'Desarrolladores', 'Jefatura', 'Marketing'];

export default function TeamMonitoringPage() {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allLeads, setAllLeads] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    setLoading(true);
    const allLeadsMap = new Map<string, Client>();

    const updateState = () => {
        const leads = Array.from(allLeadsMap.values());
        leads.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
        setAllLeads(leads);
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
  }, []);

  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
        const searchInput = searchQuery.toLowerCase();
        const matchesSearch = lead.nombres.toLowerCase().includes(searchInput) ||
          (lead.celular && lead.celular.includes(searchInput)) ||
          (lead.dni && lead.dni.includes(searchInput)) ||
          (lead.assigned_agent_name && lead.assigned_agent_name.toLowerCase().includes(searchInput));
        
        return matchesSearch;
    });
  }, [allLeads, searchQuery]);

   if (!currentUser && loading) {
    return (
       <div className="p-4 md:p-6 lg:p-8 space-y-6">
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
                        Esta sección es exclusiva para administradores, desarrolladores y jefatura.
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
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Activity />
                        Monitor de Equipo - Call Center
                    </CardTitle>
                    <CardDescription>
                       Supervisa en tiempo real el estado y progreso de los leads gestionados por el equipo.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, DNI o agente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
                <Skeleton className="h-96 w-full" />
            ) : (
                <MonitoringTable leads={filteredLeads} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
