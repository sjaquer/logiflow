
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Client } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShoppingCart, Globe } from 'lucide-react';

interface ManagedQueueTableProps {
  leads: Client[];
}

export function ManagedQueueTable({ leads }: ManagedQueueTableProps) {
  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  
  const getConfirmationTime = (lead: Client) => {
    return format(new Date(lead.last_updated), 'HH:mm:ss', { locale: es });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Tienda</TableHead>
          <TableHead>Agente Asignado</TableHead>
          <TableHead className="text-right">Hora de Confirmación</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length > 0 ? leads.map((lead) => (
          <TableRow key={lead.id}>
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
            <TableCell>
              {lead.assigned_agent_id ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={lead.assigned_agent_avatar} />
                          <AvatarFallback>{getInitials(lead.assigned_agent_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{lead.assigned_agent_name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.assigned_agent_name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-muted-foreground text-xs">N/A</span>
              )}
            </TableCell>
            <TableCell className="text-right font-mono">{getConfirmationTime(lead)}</TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                    Aún no se han gestionado leads hoy.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
