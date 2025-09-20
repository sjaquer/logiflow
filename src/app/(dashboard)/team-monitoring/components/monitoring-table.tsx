
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Client } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonitoringTableProps {
  leads: Client[];
}

export function MonitoringTable({ leads }: MonitoringTableProps) {

  const formatLeadDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return `Hoy ${format(date, 'HH:mm', { locale: es })}`;
      }
      if (date.toDateString() === yesterday.toDateString()) {
        return `Ayer ${format(date, 'HH:mm', { locale: es })}`;
      }
      return format(date, 'dd MMM HH:mm', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
             <Checkbox />
          </TableHead>
          <TableHead>Fecha de Creación</TableHead>
          <TableHead>Última Modificación</TableHead>
          <TableHead>Nombre del Lead</TableHead>
          <TableHead>Teléfono (Contacto)</TableHead>
          <TableHead>Contacto Principal</TableHead>
          <TableHead>Provincia</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead>Producto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length > 0 ? (
          leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell className="text-muted-foreground">{formatLeadDate(lead.first_interaction_at)}</TableCell>
              <TableCell className="text-muted-foreground">{formatLeadDate(lead.last_updated)}</TableCell>
              <TableCell>
                <a href="#" className="text-blue-500 hover:underline font-medium">#{lead.kommo_lead_id || lead.shopify_order_id || lead.id.substring(0, 5)}-{lead.tienda_origen || 'N/A'}</a>
              </TableCell>
              <TableCell>
                 <a href={`tel:${lead.celular}`} className="text-blue-500 hover:underline">+51 {lead.celular}</a>
              </TableCell>
              <TableCell>
                 <a href="#" className="text-blue-500 hover:underline">{lead.nombres}</a>
              </TableCell>
              <TableCell>{lead.provincia || 'N/A'}</TableCell>
              <TableCell className="max-w-xs truncate">{lead.direccion || 'N/A'}</TableCell>
              <TableCell className="max-w-xs truncate">{lead.producto || 'N/A'}</TableCell>
            </TableRow>
          ))
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
