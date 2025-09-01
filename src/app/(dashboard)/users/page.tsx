import { getUsers } from '@/lib/firebase/firestore';
import type { User } from '@/lib/types';
import { UsersTable } from './components/users-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function UsersPage() {
  const users: User[] = await getUsers();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Ver y gestionar roles y permisos de usuarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
