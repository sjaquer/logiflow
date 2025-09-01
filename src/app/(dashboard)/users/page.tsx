'use client';
import { useState, useEffect } from 'react';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import type { User } from '@/lib/types';
import { UsersTable } from './components/users-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface UsersPageProps {
  currentUser: User | null;
}

export default function UsersPage({ currentUser }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const usersData = await getCollectionData<User>('users');
      setUsers(usersData);
      setLoading(false);
    };
    fetchUsers();
  }, []);
  
  if (currentUser?.rol !== 'ADMIN') {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acceso Denegado</AlertTitle>
            <AlertDescription>
                No tienes los permisos necesarios para acceder a esta sección.
            </AlertDescription>
        </Alert>
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
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
       </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Ver y gestionar roles y permisos de usuarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} currentUser={currentUser} />
        </CardContent>
      </Card>
    </div>
  );
}
