
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, User, UserRole, CallStatus } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { formatDistanceToNow, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Phone, Search, CheckCircle, Trash2, Loader2, AlertTriangle, PhoneForwarded, MoreVertical, PhoneOff, ShoppingCart, Globe, Clock, User as UserIcon, Repeat, Repeat1, Repeat2, Repeat3, PhoneMissed, Frown } from 'lucide-react';
import { ManagedQueueTable } from './components/managed-queue-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SHOPS, CALL_STATUS_BADGE_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const ALLOWED_ROLES: UserRole[] = ['Call Center', 'Admin', 'Desarrolladores'];

const STATUS_FILTERS: CallStatus[] = ['NUEVO', 'CONTACTADO', 'INTENTO_1', 'INTENTO_2', 'INTENTO_3', 'INTENTO_4', 'NO_CONTESTA', 'EN_SEGUIMIENTO', 'NUMERO_EQUIVOCADO', 'LEAD_NO_CONTACTABLE', 'LEAD_PERDIDO'];
const PIN_CODE = '901230';
type SortOrder = 'newest' | 'oldest';


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
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Client | null>(null);
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
      
      const sortFunction = (a: Client, b: Client) => {
        const timeA = new Date(a.first_interaction_at || a.last_updated).getTime();
        const timeB = new Date(b.first_interaction_at || b.last_updated).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      };

      pending.sort(sortFunction);
      managed.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
      
      return { pending, managed };
  }, [sortOrder]);

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

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    
    try {
      const collectionName = leadToDelete.source === 'shopify' ? 'shopify_leads' : 'clients';
      await deleteDoc(doc(db, collectionName, leadToDelete.id));
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
    } finally {
        setLeadToDelete(null);
    }
  };

  const handleStatusChange = async (clientId: string, status: CallStatus, source: Client['source']) => {
      const collectionName = source === 'shopify' ? 'shopify_leads' : 'clients';
      const clientRef = doc(db, collectionName, clientId);
      try {
        const updatePayload: any = {
            call_status: status,
            last_updated: new Date().toISOString()
        };
        // Reset agent assignment only if moving to a non-contact status
        if (status === 'NO_CONTESTA' || status === 'NUMERO_EQUIVOCADO' || status === 'LEAD_NO_CONTACTABLE' || status === 'LEAD_PERDIDO' || status.startsWith('INTENTO')) {
            updatePayload.assigned_agent_id = null;
            updatePayload.assigned_agent_name = null;
            updatePayload.assigned_agent_avatar = null;
        }

          await updateDoc(clientRef, updatePayload);
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

  const handleClearQueue = async () => {
    if (pinValue !== PIN_CODE) {
        setPinError('PIN incorrecto. Por favor, inténtalo de nuevo.');
        return;
    }

    setIsClearing(true);
    setPinError('');

    try {
        const batch = writeBatch(db);
        pendingLeads.forEach(lead => {
            const collectionName = lead.source === 'shopify' ? 'shopify_leads' : 'clients';
            const leadRef = doc(db, collectionName, lead.id);
            batch.delete(leadRef);
        });

        await batch.commit();
        
        toast({ title: 'Bandeja Vaciada', description: `Se han eliminado ${pendingLeads.length} leads pendientes.` });
        setIsPinDialogOpen(false);

    } catch (error) {
        console.error("Error clearing queue:", error);
        toast({ title: 'Error', description: 'No se pudo vaciar la bandeja de entrada.', variant: 'destructive' });
    } finally {
        setIsClearing(false);
        setPinValue('');
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
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Phone />
                        Bandeja de Entrada de Llamadas
                    </CardTitle>
                    <CardDescription>
                        Lista de clientes potenciales (de Kommo y Shopify) para contactar, confirmar datos y crear un pedido.
                    </CardDescription>
                </div>
                {currentUser?.rol !== 'Call Center' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Vaciar Bandeja
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción eliminará permanentemente todos los leads pendientes de la bandeja de entrada.
                                Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => setIsPinDialogOpen(true)}>
                                Sí, estoy seguro
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI o agente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
             <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Más Recientes</SelectItem>
                    <SelectItem value="oldest">Más Antiguos</SelectItem>
                </SelectContent>
            </Select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                  [...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)
              ) : filteredPendingLeads.length > 0 ? filteredPendingLeads.map(lead => {
                  const timeInQueue = formatDistanceToNow(new Date(lead.first_interaction_at || lead.last_updated), { addSuffix: true, locale: es });
                  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

                  return (
                      <Card key={lead.id} className={cn("flex flex-col")}>
                          <CardHeader className="p-4">
                              <div className="flex justify-between items-start">
                                  <Badge variant={CALL_STATUS_BADGE_MAP[lead.call_status]} className="capitalize w-fit justify-center text-xs">
                                      {lead.call_status.replace(/_/g, ' ').toLowerCase()}
                                  </Badge>
                                   <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7">
                                              <MoreVertical className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'INTENTO_1', lead.source)}><Repeat1 className="mr-2 h-4 w-4" /><span>Intento 1</span></DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'INTENTO_2', lead.source)}><Repeat2 className="mr-2 h-4 w-4" /><span>Intento 2</span></DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'INTENTO_3', lead.source)}><Repeat3 className="mr-2 h-4 w-4" /><span>Intento 3</span></DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'NO_CONTESTA', lead.source)}><PhoneOff className="mr-2 h-4 w-4" /><span>No Contesta</span></DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'NUMERO_EQUIVOCADO', lead.source)}><AlertTriangle className="mr-2 h-4 w-4" /><span>Número Equivocado</span></DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'LEAD_NO_CONTACTABLE', lead.source)}><PhoneMissed className="mr-2 h-4 w-4" /><span>No Contactable</span></DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'LEAD_PERDIDO', lead.source)}><Frown className="mr-2 h-4 w-4" /><span>Lead Perdido</span></DropdownMenuItem>
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setLeadToDelete(lead)} className="text-destructive">
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              <span>Eliminar</span>
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </div>
                               <CardTitle className="text-lg pt-2">{lead.nombres}</CardTitle>
                               <CardDescription>{lead.celular}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 flex-grow space-y-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                  {lead.tienda_origen ? (
                                      <>
                                          <ShoppingCart className="h-4 w-4 text-primary" />
                                          <span className="font-medium capitalize text-foreground">{lead.tienda_origen}</span>
                                      </>
                                  ) : (
                                      <>
                                          <Globe className="h-4 w-4" />
                                          <span className="capitalize">{lead.source}</span>
                                      </>
                                  )}
                              </div>
                               <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>{timeInQueue}</span>
                              </div>
                              {lead.assigned_agent_name && (
                                   <div className="flex items-center gap-2 text-muted-foreground">
                                      <UserIcon className="h-4 w-4" />
                                       <TooltipProvider>
                                          <Tooltip>
                                              <TooltipTrigger asChild>
                                                  <div className="flex items-center gap-2">
                                                      <Avatar className="h-6 w-6">
                                                          <AvatarImage src={lead.assigned_agent_avatar} />
                                                          <AvatarFallback>{getInitials(lead.assigned_agent_name)}</AvatarFallback>
                                                      </Avatar>
                                                      <span className="font-medium text-foreground">{lead.assigned_agent_name}</span>
                                                  </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                  <p>Asignado a {lead.assigned_agent_name}</p>
                                              </TooltipContent>
                                          </Tooltip>
                                      </TooltipProvider>
                                  </div>
                              )}
                          </CardContent>
                          <CardFooter className="p-4">
                              <Button className="w-full" onClick={() => handleProcessClient(lead)}>
                                  <PhoneForwarded className="mr-2 h-4 w-4" />
                                  {lead.call_status === 'NUEVO' ? 'Procesar Lead' : 'Continuar Gestión'}
                              </Button>
                          </CardFooter>
                      </Card>
                  )
              }) : (
                 <div className="col-span-full text-center py-16">
                     <p className="text-lg font-semibold">¡Bandeja de entrada limpia!</p>
                     <p className="text-muted-foreground">Felicidades, no hay clientes pendientes por llamar.</p>
                 </div>
              )}
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

        {/* PIN Dialog */}
        <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmación Final Requerida</DialogTitle>
                    <DialogDescription>
                        Para evitar un borrado accidental, por favor ingresa el PIN de seguridad para vaciar la bandeja de entrada.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                    <Label htmlFor="pin-input">PIN de Seguridad</Label>
                    <Input
                        id="pin-input"
                        type="password"
                        value={pinValue}
                        onChange={(e) => {
                            setPinValue(e.target.value);
                            if (pinError) setPinError('');
                        }}
                        placeholder="Ingresa el PIN"
                    />
                    {pinError && (
                        <p className="text-sm text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> 
                            {pinError}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsPinDialogOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleClearQueue} disabled={isClearing}>
                        {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar y Vaciar Definitivamente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Lead Dialog */}
         <AlertDialog open={!!leadToDelete} onOpenChange={(isOpen) => !isOpen && setLeadToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar este lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará permanentemente el lead de <span className="font-bold">{leadToDelete?.nombres}</span>. No podrás deshacer esta acción.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sí, Eliminar Lead
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    