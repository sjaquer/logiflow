
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Client } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateLeadProgress } from '@/lib/utils';
import { CALL_STATUS_BADGE_MAP } from '@/lib/constants';

interface MonitoringTableProps {
  leads: Client[];
}

export function MonitoringTable({ leads }: MonitoringTableProps) {
  
  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Progreso</TableHead>
          <TableHead>Agente</TableHead>
          <TableHead>Estado (Llamada)</TableHead>
          <TableHead>Antigüedad</TableHead>
          <TableHead>Origen</TableHead>
          <TableHead>Nombre Cliente</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead>Productos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length > 0 ? (
          leads.map((lead) => {
            const progress = calculateLeadProgress(lead);
            const timeInQueue = formatDistanceToNow(new Date(lead.first_interaction_at || lead.last_updated), { addSuffix: true, locale: es });
            return (
              <TableRow key={lead.id}>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Progress value={progress} className="h-2" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{progress}% completado</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  {lead.assigned_agent_name ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
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
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={CALL_STATUS_BADGE_MAP[lead.call_status]} className="capitalize">
                    {lead.call_status.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{timeInQueue}</TableCell>
                <TableCell className="capitalize">{lead.tienda_origen || lead.source}</TableCell>
                <TableCell className="font-medium">{lead.nombres}</TableCell>
                <TableCell>{lead.celular || 'N/A'}</TableCell>
                <TableCell>{lead.dni || 'N/A'}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {lead.shopify_items && lead.shopify_items.length > 0
                    ? lead.shopify_items.map(item => item.nombre).join(', ')
                    : lead.producto || 'N/A'}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={9} className="h-24 text-center">
              No se encontraron leads con los filtros actuales.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
