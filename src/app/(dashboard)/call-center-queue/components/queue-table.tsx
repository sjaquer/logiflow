
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PhoneForwarded, Trash2 } from 'lucide-react';
import type { Client } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CALL_STATUS_BADGE_MAP } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QueueTableProps {
  leads: Client[];
  onProcess: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

export function QueueTable({ leads, onProcess, onDelete }: QueueTableProps) {
  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Estado</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Celular</TableHead>
          <TableHead>Agente Asignado</TableHead>
          <TableHead>Última Actualización</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length > 0 ? leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
                 {lead.estado_llamada && (
                    <Badge variant={CALL_STATUS_BADGE_MAP[lead.estado_llamada]} className="capitalize w-28 justify-center">
                        {lead.estado_llamada.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                 )}
            </TableCell>
            <TableCell className="font-medium">{lead.dni || 'N/A'}</TableCell>
            <TableCell>{lead.nombres}</TableCell>
            <TableCell>{lead.celular}</TableCell>
            <TableCell>
              {lead.id_agente_asignado ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={lead.avatar_agente_asignado} />
                        <AvatarFallback>{getInitials(lead.nombre_agente_asignado)}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.nombre_agente_asignado}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-muted-foreground text-xs">Sin asignar</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
                {lead.last_updated_from_kommo 
                    ? formatDistanceToNow(new Date(lead.last_updated_from_kommo), { addSuffix: true, locale: es })
                    : 'N/A'
                }
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button size="sm" onClick={() => onProcess(lead)} disabled={!!lead.id_agente_asignado && lead.estado_llamada === 'CONTACTADO'}>
                <PhoneForwarded className="mr-2 h-4 w-4" />
                {lead.estado_llamada === 'NUEVO' ? 'Procesar' : 'Continuar'}
              </Button>
               <Button variant="outline" size="icon" className="text-destructive" onClick={() => onDelete(lead.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                    ¡Felicidades! No hay clientes pendientes por llamar.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
