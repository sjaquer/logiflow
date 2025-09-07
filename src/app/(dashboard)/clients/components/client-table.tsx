
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { Client } from '@/lib/types';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

export function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>DNI</TableHead>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Celular</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.length > 0 ? clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.dni}</TableCell>
            <TableCell>{client.nombres}</TableCell>
            <TableCell>{client.celular}</TableCell>
            <TableCell>{client.email || 'N/A'}</TableCell>
            <TableCell className="max-w-xs truncate">{client.direccion || 'N/A'}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onEdit(client)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(client.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                    No se encontraron clientes.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
