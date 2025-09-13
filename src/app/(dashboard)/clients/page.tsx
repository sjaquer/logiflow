
'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Client } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { db } from '@/lib/firebase/firebase';
import { doc, setDoc, deleteDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { ClientTable } from './components/client-table';
import { ClientDialog } from './components/client-dialog';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = listenToCollection<Client>('clients', (data) => {
      setClients(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.dni.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.celular && client.celular.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [clients, searchQuery]);

  const handleOpenDialog = (client: Client | null = null) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleSaveClient = async (clientData: Omit<Client, 'id' | 'source' | 'last_updated' | 'call_status'>) => {
    try {
      if (editingClient) {
        // Update existing client
        const clientRef = doc(db, 'clients', editingClient.id);
        await updateDoc(clientRef, { ...clientData, last_updated: new Date().toISOString() });
        toast({ title: 'Éxito', description: 'Cliente actualizado correctamente.' });
      } else {
        // Create new client
        const clientCollectionRef = collection(db, 'clients');
        await addDoc(clientCollectionRef, { 
            ...clientData,
            source: 'manual',
            call_status: 'NUEVO',
            last_updated: new Date().toISOString(),
            first_interaction_at: new Date().toISOString()
        });
        toast({ title: 'Éxito', description: 'Cliente creado correctamente.' });
      }
      setIsDialogOpen(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Error saving client:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el cliente.', variant: 'destructive' });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) return;
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      toast({ title: 'Éxito', description: 'Cliente eliminado correctamente.' });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el cliente.', variant: 'destructive' });
    }
  };

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
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Gestión de Clientes</CardTitle>
            <CardDescription>Añade, edita o elimina clientes del sistema.</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Cliente
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI o celular..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <ClientTable
              clients={filteredClients}
              onEdit={handleOpenDialog}
              onDelete={handleDeleteClient}
            />
          </div>
        </CardContent>
      </Card>
      
      <ClientDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
}
