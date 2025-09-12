
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PhoneForwarded, Trash2, MoreVertical, PhoneOff, AlertTriangle } from 'lucide-react';
import type { Client, CallStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CALL_STATUS_BADGE_MAP } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface QueueTableProps {
  leads: Client[];
  onProcess: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onStatusChange: (clientId: string, status: CallStatus) => void;
  currentUserId: string | undefined;
}

export function QueueTable({ leads, onProcess, onDelete, onStatusChange, currentUserId }: QueueTableProps) {
  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  const getWaitingTime = (lead: Client) => {
    if (lead.estado_llamada !== 'NUEVO' || !lead.last_updated_from_kommo) {
      return { text: 'Contactado', color: 'text-muted-foreground' };
    }
    
    const creationDate = new Date(lead.last_updated_from_kommo);
    const now = new Date();
    const hoursWaiting = (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60);

    let color = 'text-green-600';
    if (hoursWaiting > 4) {
      color = 'text-red-600';
    } else if (hoursWaiting > 1) {
      color = 'text-yellow-600';
    }

    return { text: formatDistanceToNow(creationDate, { addSuffix: true, locale: es }), color };
  };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Estado</TableHead>
          <TableHead>Tiempo de Espera</TableHead>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Celular</TableHead>
          <TableHead>Agente Asignado</TableHead>
          <TableHead>Última Actualización</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length > 0 ? leads.map((lead) => {
          const waitingTime = getWaitingTime(lead);
          const isAssigned = !!lead.id_agente_asignado;
          const isAssignedToOther = isAssigned && lead.id_agente_asignado !== currentUserId;

          return (
            <TableRow key={lead.id} className={cn(isAssignedToOther && "bg-muted/30 opacity-70")}>
              <TableCell>
                  {lead.estado_llamada && (
                      <Badge variant={CALL_STATUS_BADGE_MAP[lead.estado_llamada]} className="capitalize w-28 justify-center">
                          {lead.estado_llamada.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                  )}
              </TableCell>
              <TableCell className={cn("font-medium", waitingTime.color)}>
                  {waitingTime.text}
              </TableCell>
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
                <Button size="sm" onClick={() => onProcess(lead)} disabled={isAssignedToOther}>
                  <PhoneForwarded className="mr-2 h-4 w-4" />
                  {lead.estado_llamada === 'NUEVO' ? 'Procesar' : 'Continuar'}
                </Button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'NO_CONTESTA')}>
                            <PhoneOff className="mr-2 h-4 w-4" />
                            <span>Marcar como No Contesta</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'NUMERO_EQUIVOCADO')}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                             <span>Número Equivocado</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onDelete(lead.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar Lead</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

              </TableCell>
            </TableRow>
          )
        }) : (
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
