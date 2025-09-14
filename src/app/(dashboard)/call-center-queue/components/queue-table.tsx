
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PhoneForwarded, Trash2, MoreVertical, PhoneOff, AlertTriangle, ShoppingCart, Globe } from 'lucide-react';
import type { Client, CallStatus } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
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
  onDelete: (clientId: string, source: Client['source']) => void;
  onStatusChange: (clientId: string, status: CallStatus, source: Client['source']) => void;
  currentUserId: string | undefined;
}

export function QueueTable({ leads, onProcess, onDelete, onStatusChange, currentUserId }: QueueTableProps) {
  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  const getWaitingTime = (lead: Client) => {
    const referenceDateStr = lead.first_interaction_at || lead.last_updated;
    if (!referenceDateStr) {
        return { text: 'N/A', color: 'text-muted-foreground' };
    }

    const referenceDate = new Date(referenceDateStr);
    const now = new Date();
    const hoursWaiting = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60);

    let color = 'text-green-600';
    if (hoursWaiting > 4) {
      color = 'text-red-600';
    } else if (hoursWaiting > 1) {
      color = 'text-yellow-600';
    }

    return { text: formatDistanceToNow(referenceDate, { addSuffix: true, locale: es }), color };
  };

  const getEntryTime = (lead: Client) => {
    const referenceDateStr = lead.first_interaction_at || lead.last_updated;
    if (!referenceDateStr) {
        return 'N/A';
    }
    return format(new Date(referenceDateStr), 'dd/MM/yyyy HH:mm', { locale: es });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Estado</TableHead>
          <TableHead>Tiempo de Espera</TableHead>
          <TableHead>Fecha de Ingreso</TableHead>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Tienda</TableHead>
          <TableHead>Celular</TableHead>
          <TableHead>Agente Asignado</TableHead>
          <TableHead>Última Actualización</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length > 0 ? leads.map((lead) => {
          const waitingTime = getWaitingTime(lead);
          const isAssigned = !!lead.assigned_agent_id;
          const isAssignedToOther = isAssigned && lead.assigned_agent_id !== currentUserId;

          return (
            <TableRow key={lead.id} className={cn(isAssignedToOther && "bg-muted/30 opacity-70")}>
              <TableCell>
                  {lead.call_status && (
                      <Badge variant={CALL_STATUS_BADGE_MAP[lead.call_status]} className="capitalize w-28 justify-center">
                          {lead.call_status.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                  )}
              </TableCell>
              <TableCell className={cn("font-medium", waitingTime.color)}>
                  {waitingTime.text}
              </TableCell>
              <TableCell className="text-sm">{getEntryTime(lead)}</TableCell>
              <TableCell>{lead.nombres}</TableCell>
              <TableCell>
                  {lead.tienda_origen ? (
                      <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          <span className="font-medium capitalize">{lead.tienda_origen}</span>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span className="capitalize">{lead.source}</span>
                      </div>
                  )}
              </TableCell>
              <TableCell>{lead.celular}</TableCell>
              <TableCell>
                {lead.assigned_agent_id ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={lead.assigned_agent_avatar} />
                          <AvatarFallback>{getInitials(lead.assigned_agent_name)}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{lead.assigned_agent_name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="text-muted-foreground text-xs">Sin asignar</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                  {lead.last_updated 
                      ? formatDistanceToNow(new Date(lead.last_updated), { addSuffix: true, locale: es })
                      : 'N/A'
                  }
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="sm" onClick={() => onProcess(lead)} disabled={isAssignedToOther}>
                  <PhoneForwarded className="mr-2 h-4 w-4" />
                  {lead.call_status === 'NUEVO' ? 'Procesar' : 'Continuar'}
                </Button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'NO_CONTESTA', lead.source)}>
                            <PhoneOff className="mr-2 h-4 w-4" />
                            <span>Marcar como No Contesta</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'NUMERO_EQUIVOCADO', lead.source)}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                             <span>Número Equivocado</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onDelete(lead.id, lead.source)} className="text-destructive">
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
                <TableCell colSpan={9} className="text-center h-24">
                    ¡Felicidades! No hay clientes pendientes por llamar.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
