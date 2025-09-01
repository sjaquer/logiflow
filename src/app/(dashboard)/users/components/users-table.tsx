'use client';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, UserRole } from '@/lib/types';
import { USER_ROLES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


interface UsersTableProps {
  users: User[];
  currentUser: User | null;
}

export function UsersTable({ users, currentUser }: UsersTableProps) {
    const { toast } = useToast();
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    const isAdmin = currentUser?.rol === 'ADMIN';

    const handleRoleChange = async (userEmail: string, newRole: UserRole) => {
        const userRef = doc(db, 'users', userEmail);
        try {
            await updateDoc(userRef, { rol: newRole });
            toast({
                title: 'Rol Actualizado',
                description: `El rol del usuario ${userEmail} ha sido cambiado a ${newRole}.`,
            });
            // Note: For a fully real-time experience, you'd listen to collection changes
            // or manually update the local state. For now, a page refresh will show the change.
        } catch (error) {
            console.error("Error updating role: ", error);
            toast({
                title: 'Error al Actualizar',
                description: 'No se pudo cambiar el rol. Verifica los permisos de Firestore.',
                variant: 'destructive',
            });
        }
    };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuario</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id_usuario}>
            <TableCell>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.nombre} />
                  <AvatarFallback>{getInitials(user.nombre)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.nombre}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {isAdmin ? (
                <Select
                  defaultValue={user.rol}
                  onValueChange={(value: UserRole) => handleRoleChange(user.email, value)}
                  disabled={user.email === currentUser.email} // Admin can't change their own role
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map(role => (
                      <SelectItem key={role} value={role}>{role.replace('_', ' ').toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="capitalize">{user.rol.replace('_', ' ').toLowerCase()}</Badge>
              )}
            </TableCell>
            <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!isAdmin}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem>Editar Permisos</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Eliminar Usuario</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
