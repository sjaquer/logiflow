
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PhoneForwarded, Trash2, MoreVertical, PhoneOff, AlertTriangle, ShoppingCart, Globe, Check } from 'lucide-react';
import type { Client, CallStatus } from '@/lib/types';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CALL_STATUS_BADGE_MAP } from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface QueueTableProps {
  leads: Client[];
  onProcess: (client: Client) => void;
  onDelete: (clientId: string, source: Client['source']) => void;
  onStatusChange: (clientId: string, status: CallStatus, source: Client['source']) => void;
  currentUserId: string | undefined;
}

export function QueueTable({ leads, onProcess, onDelete, onStatusChange, currentUserId }: QueueTableProps) {
  
  const formatRelativeTime = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `Hoy ${format(date, 'HH:mm')}`;
    }
    if (isYesterday(date)) {
      return `Ayer ${format(date, 'HH:mm')}`;
    }
    return format(date, 'dd/MM/yy HH:mm');
  };

  const getLeadName = (lead: Client) => {
    if (lead.source === 'shopify' && lead.shopify_order_id) {
        return `#${lead.shopify_order_id.substring(0, 5)}-${lead.tienda_origen || 'Shopify'}`;
    }
    if (lead.source === 'kommo' && lead.kommo_lead_id) {
        return `#${lead.kommo_lead_id}-${lead.source}`;
    }
    return `#${lead.id.substring(0,5)}-${lead.source}`;
  }

  const getProductDisplay = (lead: Client) => {
      if (lead.shopify_items && lead.shopify_items.length > 0) {
          const firstItem = lead.shopify_items[0];
          const remaining = lead.shopify_items.length - 1;
          let text = `${firstItem.cantidad}x ${firstItem.nombre}`;
          if (text.length > 35) text = `${text.substring(0, 32)}...`;
          if (remaining > 0) text += ` (+${remaining})`;
          return text;
      }
      return 'N/A';
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"><Checkbox /></TableHead>
          <TableHead>Fecha de Ingreso</TableHead>
          <TableHead>Última Modif.</TableHead>
          <TableHead>Nombre del Lead</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Contacto Principal</TableHead>
          <TableHead>Provincia</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length > 0 ? leads.map((lead) => {
          const isAssignedToOther = lead.assigned_agent_id && lead.assigned_agent_id !== currentUserId;

          return (
            <TableRow key={lead.id} className={cn(isAssignedToOther && "bg-muted/30 opacity-70")}>
              <TableCell><Checkbox /></TableCell>
              <TableCell className="text-sm">{formatRelativeTime(lead.first_interaction_at)}</TableCell>
              <TableCell className="text-sm">{formatRelativeTime(lead.last_updated)}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {getLeadName(lead)}
                </div>
              </TableCell>
              <TableCell>{lead.celular}</TableCell>
              <TableCell className="font-medium">{lead.nombres}</TableCell>
              <TableCell>{lead.provincia}</TableCell>
              <TableCell className="max-w-[200px] truncate">{lead.direccion}</TableCell>
              <TableCell className="text-muted-foreground">{getProductDisplay(lead)}</TableCell>
              <TableCell>
                  {lead.call_status && (
                      <Badge variant={CALL_STATUS_BADGE_MAP[lead.call_status]} className="capitalize w-28 justify-center">
                          {lead.call_status.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                  )}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => onProcess(lead)} disabled={isAssignedToOther}>
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
                <TableCell colSpan={11} className="text-center h-24">
                    ¡Felicidades! No hay clientes pendientes por llamar.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
