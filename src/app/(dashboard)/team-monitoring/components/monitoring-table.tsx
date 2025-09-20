
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Client } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateLeadProgress } from '@/lib/utils';
import { CALL_STATUS_BADGE_MAP } from '@/lib/constants';

interface MonitoringTableProps {
  leads: Client[];
}

export function MonitoringTable({ leads }: MonitoringTableProps) {
  
  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  const formatLeadName = (lead: Client) => {
    if (lead.source === 'shopify' && lead.shopify_order_id) {
        return `#${lead.shopify_order_id.substring(0,5)}-${lead.tienda_origen || 'Shopify'}`;
    }
    if (lead.kommo_lead_id) {
        return `#${lead.kommo_lead_id}-${lead.tienda_origen || 'Kommo'}`;
    }
    return `#${lead.id.substring(0,5)}-Manual`;
  }
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yy HH:mm', { locale: es });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Progreso</TableHead>
          <TableHead>Fecha de Creación</TableHead>
          <TableHead>Última Modificación</TableHead>
          <TableHead>Nombre del Lead</TableHead>
          <TableHead>Contacto Principal</TableHead>
          <TableHead>Teléfono (Contacto)</TableHead>
          <TableHead>Provincia</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead>Producto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length > 0 ? (
          leads.map((lead) => {
            const progress = calculateLeadProgress(lead);
            return (
              <TableRow key={lead.id}>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                           <Progress value={progress} className="h-2" />
                           <span className="text-xs text-muted-foreground font-medium">{progress}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{progress}% completado</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-xs">{formatDate(lead.first_interaction_at)}</TableCell>
                <TableCell className="text-xs">{formatDate(lead.last_updated)}</TableCell>
                <TableCell>
                    <span className="font-medium text-primary cursor-pointer hover:underline">
                        {formatLeadName(lead)}
                    </span>
                </TableCell>
                <TableCell>{lead.nombres || 'N/A'}</TableCell>
                <TableCell>{lead.celular || 'N/A'}</TableCell>
                <TableCell>{lead.provincia || 'N/A'}</TableCell>
                <TableCell className="max-w-[200px] truncate">{lead.direccion || 'N/A'}</TableCell>
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
