
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, User, UserRole, CallStatus } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { doc, deleteDoc, updateDoc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { formatDistanceToNow, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cacheManager } from '@/lib/cache-manager';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Phone, Search, CheckCircle, Trash2, Loader2, AlertTriangle, PhoneForwarded, MoreVertical, PhoneOff, ShoppingCart, Globe, Clock, User as UserIcon, Repeat, PhoneMissed, Frown, RefreshCw, Database } from 'lucide-react';
import { ManagedQueueTable } from './components/managed-queue-table';
import { CleanLeadsTable } from './components/clean-leads-table';
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

// Claves de caché
const CACHE_KEYS = {
  CLIENTS: 'call_center_clients',
  SHOPIFY_LEADS: 'call_center_shopify_leads',
};

// TTL: 30 minutos (suficiente para evitar lecturas excesivas)
const CACHE_TTL = 30 * 60 * 1000;


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
  const [cacheStats, setCacheStats] = useState<{ totalKeys: number; totalSize: number; keys: string[] } | null>(null);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
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
    
    // Limpiar caché expirado al cargar la página
    cacheManager.clearExpiredCache();
    
    const allLeadsMap = new Map<string, Client>();

    const updateState = () => {
        const allLeads = Array.from(allLeadsMap.values());
        const { pending, managed } = processLeads(allLeads);
        setPendingLeads(pending);
        setManagedLeads(managed);
        setLoading(false);
        
        // Guardar en caché después de actualizar el estado
        cacheManager.set(CACHE_KEYS.CLIENTS, Array.from(allLeadsMap.values()).filter(l => l.source !== 'shopify'), { ttl: CACHE_TTL });
        cacheManager.set(CACHE_KEYS.SHOPIFY_LEADS, Array.from(allLeadsMap.values()).filter(l => l.source === 'shopify'), { ttl: CACHE_TTL });
    };

    // Intentar cargar desde caché primero
    const cachedClients = cacheManager.get<Client[]>(CACHE_KEYS.CLIENTS, { ttl: CACHE_TTL });
    const cachedShopifyLeads = cacheManager.get<Client[]>(CACHE_KEYS.SHOPIFY_LEADS, { ttl: CACHE_TTL });
    
    if (cachedClients || cachedShopifyLeads) {
      console.log('[CallCenterQueue] 🚀 Cargando desde caché (instantáneo)');
      setLoadedFromCache(true);
      
      // Cargar datos del caché inmediatamente
      if (cachedClients) {
        cachedClients.forEach(lead => allLeadsMap.set(lead.id, lead));
      }
      if (cachedShopifyLeads) {
        cachedShopifyLeads.forEach(lead => allLeadsMap.set(lead.id, lead));
      }
      
      const allLeads = Array.from(allLeadsMap.values());
      const { pending, managed } = processLeads(allLeads);
      setPendingLeads(pending);
      setManagedLeads(managed);
      setLoading(false);
    } else {
      setLoadedFromCache(false);
    }

    // Configurar listeners de Firestore para actualizaciones en tiempo real
    // Los listeners actualizarán el caché en segundo plano
    const unsubClients = listenToCollection<Client>('clients', (clientLeads) => {
        console.log('[CallCenterQueue] 📡 Actualización desde Firestore (clients)');
        clientLeads.forEach(lead => allLeadsMap.set(lead.id, lead));
        updateState();
    });

    const unsubShopify = listenToCollection<Client>('shopify_leads', (shopifyLeads) => {
        console.log('[CallCenterQueue] 📡 Actualización desde Firestore (shopify_leads)');
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

    // Avoid sending `undefined` values to Firestore (causes "Unsupported field value: undefined").
    const updateData: any = {
      call_status: 'CONTACTADO',
      // Prefer internal id_usuario, fallback to authUser.uid if the internal user doc lacks id_usuario
      assigned_agent_id: currentUser?.id_usuario ?? authUser?.uid ?? null,
      assigned_agent_name: currentUser?.nombre ?? authUser?.displayName ?? null,
      assigned_agent_avatar: currentUser?.avatar ?? null,
      last_updated: new Date().toISOString(),
    };

    // Check existence first to avoid "No document to update" errors. If missing, use setDoc with merge.
    const snap = await getDoc(clientRef);
    if (snap.exists()) {
      await updateDoc(clientRef, updateData);
    } else {
      await setDoc(clientRef, updateData, { merge: true });
      console.warn(`Client document ${client.id} not found in ${collectionName}; created/merged instead.`);
    }

    toast({
      title: 'Lead Asignado',
      description: `Ahora estás a cargo de ${client.nombres}.`,
    });

    router.push(`/create-order?leadId=${client.id}&source=${client.source}`);

  } catch (error) {
    console.error("Error processing client:", error);
    const msg = error instanceof Error ? error.message : String(error);
    toast({ title: 'Error', description: `No se pudo asignar el lead: ${msg}`, variant: 'destructive' });
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
        
        // Limpiar caché después de vaciar la bandeja
        cacheManager.remove(CACHE_KEYS.CLIENTS);
        cacheManager.remove(CACHE_KEYS.SHOPIFY_LEADS);
        
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

  const handleClearCache = () => {
    cacheManager.remove(CACHE_KEYS.CLIENTS);
    cacheManager.remove(CACHE_KEYS.SHOPIFY_LEADS);
    
    toast({
      title: 'Caché Limpiado',
      description: 'Los datos se recargarán desde Firestore en la próxima actualización.',
    });
    
    // Actualizar estadísticas
    setCacheStats(cacheManager.getStats());
  };

  const handleShowCacheStats = () => {
    const stats = cacheManager.getStats();
    setCacheStats(stats);
    
    toast({
      title: 'Estadísticas de Caché',
      description: `${stats.totalKeys} claves | ${(stats.totalSize / 1024).toFixed(2)} KB`,
    });
  };

  
   if (!currentUser && loading) {
    return (
       <div className="space-y-6 animate-in">
        <Card className="border-border/40">
          <CardHeader className="space-y-3">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardHeader className="space-y-3">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (currentUser && !ALLOWED_ROLES.includes(currentUser.rol)) {
    return (
        <div className="flex-1 flex items-center justify-center p-8 animate-in">
             <Card className="w-full max-w-md text-center border-border/40 shadow-lg">
                <CardHeader className="space-y-4 pb-4">
                    <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-base leading-relaxed">
                        Esta sección es exclusiva para usuarios del equipo de Call Center, administradores y desarrolladores.
                    </p>
                </CardContent>
             </Card>
        </div>
    )
  }

  return (
    <div className="w-full max-w-[calc(100vw-20px)] mx-auto px-[10px] py-4 space-y-6 animate-in box-border overflow-x-hidden">
      {/* Header con gradiente vibrante */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
                <Phone className="h-7 w-7 text-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-foreground">
                  Bandeja de Entrada de Llamadas
                </CardTitle>
                <CardDescription className="mt-2 text-muted-foreground text-base">
                  Lista de clientes potenciales (de Kommo y Shopify) para contactar, confirmar datos y crear un pedido.
                  {loadedFromCache && (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-medium shadow-lg">
                      <Database className="h-4 w-4" />
                      Datos en caché (carga instantánea)
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 min-w-0">
              {/* Botones de caché */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShowCacheStats}
                      className="h-10 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                    >
                      <Database className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver estadísticas de caché</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearCache}
                      className="h-10 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Limpiar caché y recargar datos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {currentUser?.rol !== 'Call Center' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-10 shadow-lg">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Vaciar Bandeja</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-[425px]">
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
          </div>
        </div>
      </div>
      
      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI o agente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 border-border/60 focus-visible:ring-primary shadow-sm"
              />
            </div>
             <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                <SelectTrigger className="w-full sm:w-[180px] h-10">
                    <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Más Recientes</SelectItem>
                    <SelectItem value="oldest">Más Antiguos</SelectItem>
                </SelectContent>
            </Select>
            {/* Estado filter removed per UX request */}
            <Select value={shopFilter} onValueChange={(value) => setShopFilter(value as any)}>
                <SelectTrigger className="w-full sm:w-[200px] h-10">
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
          
          {loading ? (
            <Skeleton className="h-96 w-full rounded-lg" />
          ) : (
            <>
              {cacheStats && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Estadísticas de Caché</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCacheStats(null)}
                      className="h-7 w-7 p-0"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Claves totales</p>
                      <p className="font-semibold text-base">{cacheStats.totalKeys}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Tamaño total</p>
                      <p className="font-semibold text-base">{(cacheStats.totalSize / 1024).toFixed(2)} KB</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">Leads en caché</p>
                      <p className="font-semibold text-base">{pendingLeads.length + managedLeads.length}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="w-full min-w-0 max-w-[calc(100vw-20px)]">
                <CleanLeadsTable 
                  leads={filteredPendingLeads} 
                  onProcessLead={handleProcessClient}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-sm">
        <CardHeader>
            <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold">
                        Leads Gestionados Hoy
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                        Resumen de los leads que han sido confirmados como venta durante el día de hoy.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
    <CardContent className="w-full min-w-0 max-w-[calc(100vw-20px)]">
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
