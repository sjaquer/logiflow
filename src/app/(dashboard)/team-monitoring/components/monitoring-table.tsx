
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Client } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShoppingCart, Globe } from 'lucide-react';
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
          <TableHead className="w-[120px]">Progreso</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Agente Asignado</TableHead>
          <TableHead>Origen / Tienda</TableHead>
          <TableHead>Antigüedad</TableHead>
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
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                             <Progress value={progress} className="w-20" />
                             <span className="text-xs font-medium">{progress}%</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Progreso de datos del cliente</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Badge variant={CALL_STATUS_BADGE_MAP[lead.call_status]} className="capitalize">
                    {lead.call_status.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{lead.nombres}</div>
                  <div className="text-sm text-muted-foreground">{lead.celular || 'Sin celular'}</div>
                </TableCell>
                <TableCell>
                  {lead.assigned_agent_name ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={lead.assigned_agent_avatar} />
                        <AvatarFallback>{getInitials(lead.assigned_agent_name)}</AvatarFallback>
                      </Avatar>
                      <span>{lead.assigned_agent_name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sin asignar</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {lead.tienda_origen ? (
                      <>
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        <span className="font-medium capitalize">{lead.tienda_origen}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        <span className="capitalize">{lead.source}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{timeInQueue}</TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No se encontraron leads con los filtros actuales.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
