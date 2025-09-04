'use client';
import { useState, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { UsersTable } from './components/users-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { listenToCollection } from '@/lib/firebase/firestore-client';

interface UsersPageProps {
  currentUser: User | null;
}

export default function UsersPage({ currentUser }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToCollection<User>('users', (usersData) => {
        setUsers(usersData);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const handleRoleChange = (email: string, newRole: UserRole) => {
      setUsers(prevUsers => 
          prevUsers.map(u => u.email === email ? { ...u, rol: newRole } : u)
      );
  };

  if (!currentUser) {
      // This might be shown briefly while currentUser is loading from the layout
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

  const canAccess = currentUser.rol === 'Admin' || currentUser.rol === 'Desarrolladores';

  if (!canAccess) {
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
          <UsersTable users={users} currentUser={currentUser} onRoleChange={handleRoleChange} />
        </CardContent>
      </Card>
    </div>
  );
}
