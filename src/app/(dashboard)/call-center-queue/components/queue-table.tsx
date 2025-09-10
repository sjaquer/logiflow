
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PhoneCall } from 'lucide-react';
import type { Client } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface QueueTableProps {
  leads: Client[];
  onCall: (client: Client) => void;
}

export function QueueTable({ leads, onCall }: QueueTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>DNI</TableHead>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Celular</TableHead>
          <TableHead>Recibido</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length > 0 ? leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="font-medium">{lead.dni}</TableCell>
            <TableCell>{lead.nombres}</TableCell>
            <TableCell>{lead.celular}</TableCell>
            <TableCell className="text-muted-foreground">
                {lead.last_updated_from_kommo 
                    ? formatDistanceToNow(new Date(lead.last_updated_from_kommo), { addSuffix: true, locale: es })
                    : 'N/A'
                }
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" onClick={() => onCall(lead)}>
                <PhoneCall className="mr-2 h-4 w-4" />
                Llamar y Procesar
              </Button>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                    ¡Felicidades! No hay clientes pendientes por llamar.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
