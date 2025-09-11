
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PhoneForwarded } from 'lucide-react';
import type { Client } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CALL_STATUS_BADGE_MAP } from '@/lib/constants';


interface QueueTableProps {
  leads: Client[];
  onProcess: (client: Client) => void;
}

export function QueueTable({ leads, onProcess }: QueueTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Estado</TableHead>
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
            <TableCell>
                 <Badge variant={CALL_STATUS_BADGE_MAP[lead.estado_llamada || 'NUEVO']} className="capitalize">
                    { (lead.estado_llamada || 'NUEVO').replace('_', ' ').toLowerCase() }
                </Badge>
            </TableCell>
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
              <Button size="sm" onClick={() => onProcess(lead)}>
                <PhoneForwarded className="mr-2 h-4 w-4" />
                Procesar Pedido
              </Button>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                    ¡Felicidades! No hay clientes pendientes por llamar.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
