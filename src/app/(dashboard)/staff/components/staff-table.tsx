
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface StaffTableProps {
  staff: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function StaffTable({ staff, onEdit, onDelete }: StaffTableProps) {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.length > 0 ? staff.map((user) => (
          <TableRow key={user.id_usuario}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar} alt={user.nombre} />
                  <AvatarFallback>{getInitials(user.nombre)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.nombre}</span>
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant="secondary">{user.rol}</Badge>
            </TableCell>
            <TableCell>
                <Badge variant={user.activo ? 'success' : 'destructive'}>
                    {user.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(user.id_usuario)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                    No se encontraron usuarios.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

