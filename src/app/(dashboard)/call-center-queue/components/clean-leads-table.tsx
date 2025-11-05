 'use client';

import { useState, useRef, useEffect } from 'react';
import { Client } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Edit2, Save, X, CheckCircle, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CleanLeadsTableProps {
  leads: Client[];
  onProcessLead: (lead: Client) => void;
}

export function CleanLeadsTable({ leads, onProcessLead }: CleanLeadsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [dialogLead, setDialogLead] = useState<Client | null>(null);
  const { toast } = useToast();

  const isFieldComplete = (lead: Client, field: keyof Client) => {
    const value = lead[field];
    return value !== null && value !== undefined && value !== '';
  };

  const getCompletionStatus = (lead: Client) => {
    const requiredFields: (keyof Client)[] = ['nombres', 'celular', 'direccion', 'distrito', 'provincia', 'dni'];
    const completedFields = requiredFields.filter(field => isFieldComplete(lead, field));
    return {
      completed: completedFields.length,
      total: requiredFields.length,
      isComplete: completedFields.length === requiredFields.length
    };
  };

  const handleInlineEdit = (lead: Client) => {
    setEditingId(lead.id);
    setEditForm({
      nombres: lead.nombres,
      celular: lead.celular,
      direccion: lead.direccion,
      distrito: lead.distrito,
      provincia: lead.provincia,
      dni: lead.dni,
      email: lead.email,
      producto: lead.producto,
      notas_agente: lead.notas_agente
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveInline = async (lead: Client) => {
    try {
      const collectionName = lead.source === 'shopify' ? 'shopify_leads' : 'clients';
      const leadRef = doc(db, collectionName, lead.id);
      
      await updateDoc(leadRef, {
        ...editForm,
        last_updated: new Date().toISOString()
      });

      toast({
        title: 'Lead Actualizado',
        description: 'Los datos se han guardado correctamente.',
      });

      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar los cambios.',
        variant: 'destructive'
      });
    }
  };

  const handleDialogSave = async () => {
    if (!dialogLead) return;
    
    try {
      const collectionName = dialogLead.source === 'shopify' ? 'shopify_leads' : 'clients';
      const leadRef = doc(db, collectionName, dialogLead.id);
      
      await updateDoc(leadRef, {
        ...editForm,
        last_updated: new Date().toISOString()
      });

      toast({
        title: 'Lead Actualizado',
        description: 'Los datos se han guardado correctamente.',
      });

      setDialogLead(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar los cambios.',
        variant: 'destructive'
      });
    }
  };

  const openDialog = (lead: Client) => {
    setDialogLead(lead);
    setEditForm({
      nombres: lead.nombres,
      celular: lead.celular,
      direccion: lead.direccion,
      distrito: lead.distrito,
      provincia: lead.provincia,
      dni: lead.dni,
      email: lead.email,
      producto: lead.producto,
      notas_agente: lead.notas_agente
    });
  };
  // refs for drag-to-scroll
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  // refs & state for resizable columns
  const headerRowRef = useRef<HTMLTableRowElement | null>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Initialize column widths from the rendered headers
  useEffect(() => {
    const measure = () => {
      const ths = headerRowRef.current?.querySelectorAll('th');
      if (!ths) return;
      const initial: Record<string, number> = {};
      ths.forEach((th) => {
        const key = th.getAttribute('data-col');
        if (key) initial[key] = Math.max(60, Math.round(th.getBoundingClientRect().width));
      });
      setColWidths((prev) => ({ ...initial, ...prev }));
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Pointer move/up handlers for column resizing
  const onPointerMove = (e: PointerEvent) => {
    if (!resizingRef.current) return;
    const { key, startX, startWidth } = resizingRef.current;
    const dx = e.clientX - startX;
    const newWidth = Math.max(60, Math.round(startWidth + dx));
    setColWidths((prev) => ({ ...prev, [key]: newWidth }));
  };

  const onPointerUp = () => {
    if (!resizingRef.current) return;
    resizingRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };

  const startColumnResize = (e: any, key: string) => {
    e.preventDefault();
    const th = (e.currentTarget as HTMLElement).closest('th') as HTMLElement | null;
    const startWidth = th ? th.offsetWidth : (colWidths[key] || 120);
    resizingRef.current = { key, startX: e.clientX, startWidth };
    try { (e.currentTarget as HTMLElement).setPointerCapture?.((e as any).pointerId); } catch {}
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <>
      <style>{`
        /* Sticky headers for the leads table */
        .callcenter-table thead th {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(4px);
        }
        /* Hide native horizontal scrollbar but keep scrollability */
        .callcenter-scroll::-webkit-scrollbar { height: 0; }
        .callcenter-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        /* Resizer handle */
        .col-resizer { position: absolute; top: 0; right: 0; width: 10px; height: 100%; cursor: col-resize; }
        /* Improve touch/pointer scrolling UX */
        .callcenter-scroll { cursor: grab; }
        .callcenter-scroll.dragging { cursor: grabbing; }
      `}</style>

      <div className="rounded-md border overflow-hidden">
        <div
          ref={containerRef}
          role="region"
          aria-label="Tabla de leads pendientes"
          tabIndex={0}
          className="callcenter-scroll w-full max-w-full overflow-x-auto overflow-y-visible touch-pan-x"
          onKeyDown={(e) => {
            const el = containerRef.current;
            if (!el) return;
            if (e.key === 'ArrowRight') el.scrollBy({ left: 150, behavior: 'smooth' });
            if (e.key === 'ArrowLeft') el.scrollBy({ left: -150, behavior: 'smooth' });
          }}
          onPointerDown={(e) => {
            const el = containerRef.current;
            if (!el) return;
            isDraggingRef.current = true;
            startXRef.current = e.clientX;
            scrollLeftRef.current = el.scrollLeft;
            el.setPointerCapture?.(e.pointerId);
            el.classList.add('dragging');
          }}
          onPointerMove={(e) => {
            const el = containerRef.current;
            if (!el || !isDraggingRef.current) return;
            const walk = startXRef.current - e.clientX;
            el.scrollLeft = scrollLeftRef.current + walk;
          }}
          onPointerUp={(e) => {
            const el = containerRef.current;
            if (!el) return;
            isDraggingRef.current = false;
            el.releasePointerCapture?.(e.pointerId);
            el.classList.remove('dragging');
          }}
          onPointerCancel={(e) => {
            const el = containerRef.current;
            if (!el) return;
            isDraggingRef.current = false;
            el.classList.remove('dragging');
          }}
        >
          <div className="min-w-full">
            <Table className="w-full table-fixed callcenter-table">
              <TableHeader>
                {/* headerRowRef used to measure ths for resizing */}
                <TableRow ref={headerRowRef as any} className="bg-muted/50 text-foreground relative">
                  <TableHead data-col="estado" style={{ width: colWidths['estado'] ? `${colWidths['estado']}px` : undefined }} className="w-[50px] relative">Estado
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'estado')} />
                  </TableHead>
                  <TableHead data-col="fecha_creacion" style={{ width: colWidths['fecha_creacion'] ? `${colWidths['fecha_creacion']}px` : undefined }} className="w-[120px] relative">Fecha Creación
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'fecha_creacion')} />
                  </TableHead>
                  <TableHead data-col="ultima_mod" style={{ width: colWidths['ultima_mod'] ? `${colWidths['ultima_mod']}px` : undefined }} className="w-[120px] relative">Última Modificación
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'ultima_mod')} />
                  </TableHead>
                  <TableHead data-col="nombre" style={{ width: colWidths['nombre'] ? `${colWidths['nombre']}px` : undefined }} className="min-w-[140px] relative">Nombre del Lead
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'nombre')} />
                  </TableHead>
                  <TableHead data-col="producto" style={{ width: colWidths['producto'] ? `${colWidths['producto']}px` : undefined }} className="min-w-[120px] relative">Producto
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'producto')} />
                  </TableHead>
                  <TableHead data-col="estatus" style={{ width: colWidths['estatus'] ? `${colWidths['estatus']}px` : undefined }} className="w-[120px] relative">Estatus del Lead
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'estatus')} />
                  </TableHead>
                  <TableHead data-col="provincia" style={{ width: colWidths['provincia'] ? `${colWidths['provincia']}px` : undefined }} className="w-[120px] relative">Provincia
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'provincia')} />
                  </TableHead>
                  <TableHead data-col="dni" style={{ width: colWidths['dni'] ? `${colWidths['dni']}px` : undefined }} className="text-center w-[90px] relative">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>DNI</span>
                    </div>
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'dni')} />
                  </TableHead>
                  <TableHead data-col="courier" style={{ width: colWidths['courier'] ? `${colWidths['courier']}px` : undefined }} className="text-center w-[90px] relative">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Courier</span>
                    </div>
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'courier')} />
                  </TableHead>
                  <TableHead data-col="ofic" style={{ width: colWidths['ofic'] ? `${colWidths['ofic']}px` : undefined }} className="text-center w-[90px] relative">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Ofic. Shalom</span>
                    </div>
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'ofic')} />
                  </TableHead>
                  <TableHead data-col="atendido" style={{ width: colWidths['atendido'] ? `${colWidths['atendido']}px` : undefined }} className="text-center w-[90px] relative">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Atendido</span>
                    </div>
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'atendido')} />
                  </TableHead>
                  <TableHead data-col="intento" style={{ width: colWidths['intento'] ? `${colWidths['intento']}px` : undefined }} className="relative">Intento de Llamada
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'intento')} />
                  </TableHead>
                  <TableHead data-col="asesor" style={{ width: colWidths['asesor'] ? `${colWidths['asesor']}px` : undefined }} className="relative">Asesor
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'asesor')} />
                  </TableHead>
                  <TableHead data-col="resultado" style={{ width: colWidths['resultado'] ? `${colWidths['resultado']}px` : undefined }} className="relative">Resultado
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'resultado')} />
                  </TableHead>
                  <TableHead data-col="comentario" style={{ width: colWidths['comentario'] ? `${colWidths['comentario']}px` : undefined }} className="text-center relative">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Comentario</span>
                    </div>
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'comentario')} />
                  </TableHead>
                  <TableHead data-col="acciones" style={{ width: colWidths['acciones'] ? `${colWidths['acciones']}px` : undefined }} className="text-right w-[200px] relative">Acciones
                    <div className="col-resizer" onPointerDown={(e) => startColumnResize(e, 'acciones')} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="h-24 text-center text-muted-foreground">
                      No hay leads pendientes
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => {
                    const status = getCompletionStatus(lead);
                    const isEditing = editingId === lead.id;
                    const callAttempts = lead.call_status?.match(/INTENTO_(\d)/)?.[1] || '0';

                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          {status.isComplete ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : status.completed > 0 ? (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </TableCell>

                        {/* Fecha de Creación */}
                        <TableCell className="text-xs text-muted-foreground">
                          {lead.first_interaction_at 
                            ? format(new Date(lead.first_interaction_at), 'dd/MM/yyyy HH:mm', { locale: es })
                            : '—'}
                        </TableCell>

                        {/* Última Modificación */}
                        <TableCell className="text-xs text-muted-foreground">
                          {lead.last_updated 
                            ? format(new Date(lead.last_updated), 'dd/MM/yyyy HH:mm', { locale: es })
                            : '—'}
                        </TableCell>
                        
                        {/* Nombre del Lead */}
                        <TableCell className="font-medium truncate">
                          {isEditing ? (
                            <Input
                              value={editForm.nombres || ''}
                              onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            <span className={cn(!isFieldComplete(lead, 'nombres') && 'text-muted-foreground')}>
                              {lead.nombres || '—'}
                            </span>
                          )}
                        </TableCell>

                        {/* Producto */}
                        <TableCell className="truncate max-w-[220px]">
                          {isEditing ? (
                            <Input
                              value={editForm.producto || ''}
                              onChange={(e) => setEditForm({ ...editForm, producto: e.target.value })}
                              className="h-8"
                              placeholder="Producto..."
                            />
                          ) : (
                            <span className={cn(!isFieldComplete(lead, 'producto') && 'text-muted-foreground text-sm')}>
                              {lead.producto || '—'}
                            </span>
                          )}
                        </TableCell>

                        {/* Estatus del Lead */}
                        <TableCell>
                          <Badge 
                            variant={
                              lead.call_status === 'VENTA_CONFIRMADA' ? 'default' :
                              lead.call_status === 'NUEVO' ? 'secondary' :
                              lead.call_status?.includes('INTENTO') ? 'outline' :
                              'destructive'
                            }
                            className="text-xs whitespace-nowrap"
                          >
                            {lead.call_status?.replace(/_/g, ' ') || 'NUEVO'}
                          </Badge>
                        </TableCell>

                        {/* Provincia */}
                        <TableCell className="truncate max-w-[140px]">
                          {isEditing ? (
                            <Input
                              value={editForm.provincia || ''}
                              onChange={(e) => setEditForm({ ...editForm, provincia: e.target.value })}
                              className="h-8"
                              placeholder="Provincia..."
                            />
                          ) : (
                            <span className={cn(!isFieldComplete(lead, 'provincia') && 'text-muted-foreground')}>
                              {lead.provincia || '—'}
                            </span>
                          )}
                        </TableCell>

                        {/* DNI */}
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              value={editForm.dni || ''}
                              onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                              className="h-8"
                              placeholder="DNI..."
                            />
                          ) : (
                            <span className={cn(
                              !isFieldComplete(lead, 'dni') && 'text-orange-500 font-semibold',
                              isFieldComplete(lead, 'dni') && 'text-foreground'
                            )}>
                              {lead.dni || '⚠'}
                            </span>
                          )}
                        </TableCell>

                        {/* Courier - Este campo no existe en Client, lo dejamos vacío por ahora */}
                        <TableCell className="text-center text-orange-500 font-semibold">
                          ⚠
                        </TableCell>

                        {/* Oficina Shalom - Este campo no existe en Client */}
                        <TableCell className="text-center text-orange-500 font-semibold">
                          ⚠
                        </TableCell>

                        {/* Atendido */}
                        <TableCell className="text-center">
                          {lead.call_status !== 'NUEVO' && lead.assigned_agent_name ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-orange-500 font-semibold">⚠</span>
                          )}
                        </TableCell>

                        {/* Intento de Llamada */}
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {callAttempts === '0' ? '—' : `Intento ${callAttempts}`}
                          </Badge>
                        </TableCell>

                        {/* Asesor */}
                        <TableCell className="truncate max-w-[140px]">
                          {lead.assigned_agent_name ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                                {lead.assigned_agent_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <span className="text-sm">{lead.assigned_agent_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin asignar</span>
                          )}
                        </TableCell>

                        {/* Resultado */}
                        <TableCell>
                          {lead.call_status === 'VENTA_CONFIRMADA' ? (
                            <Badge className="bg-green-500 text-xs">Venta</Badge>
                          ) : lead.call_status === 'LEAD_PERDIDO' ? (
                            <Badge variant="destructive" className="text-xs">Perdido</Badge>
                          ) : lead.call_status === 'NO_CONTESTA' ? (
                            <Badge variant="secondary" className="text-xs">No contesta</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Comentario de Llamada */}
                        <TableCell className="text-center truncate max-w-[140px]">
                          {isEditing ? (
                            <Input
                              value={editForm.notas_agente || ''}
                              onChange={(e) => setEditForm({ ...editForm, notas_agente: e.target.value })}
                              className="h-8"
                              placeholder="Comentario..."
                            />
                          ) : (
                            <span className={cn(
                              !isFieldComplete(lead, 'notas_agente') && 'text-orange-500 font-semibold',
                              isFieldComplete(lead, 'notas_agente') && 'text-sm'
                            )}>
                              {lead.notas_agente || '⚠'}
                            </span>
                          )}
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveInline(lead)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Save className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleInlineEdit(lead)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => openDialog(lead)}
                                  className="h-8 gap-1"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => onProcessLead(lead)}
                                  className="h-8 gap-1"
                                >
                                  <Phone className="h-3 w-3" />
                                  Procesar
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal Dialog for Full Edit */}
      <Dialog open={!!dialogLead} onOpenChange={(open) => !open && setDialogLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Información del Lead</DialogTitle>
            <DialogDescription>
              Completa o actualiza la información del cliente antes de procesar el pedido.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-nombres">Nombre Completo *</Label>
              <Input
                id="dialog-nombres"
                value={editForm.nombres || ''}
                onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-celular">Celular *</Label>
              <Input
                id="dialog-celular"
                value={editForm.celular || ''}
                onChange={(e) => setEditForm({ ...editForm, celular: e.target.value })}
                placeholder="Ej: 987654321"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-dni">DNI/CE/RUC</Label>
              <Input
                id="dialog-dni"
                value={editForm.dni || ''}
                onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                placeholder="Ej: 12345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-email">Email</Label>
              <Input
                id="dialog-email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Ej: correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="dialog-direccion">Dirección *</Label>
              <Input
                id="dialog-direccion"
                value={editForm.direccion || ''}
                onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                placeholder="Ej: Av. Principal 123, Dpto 5B"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-distrito">Distrito *</Label>
              <Input
                id="dialog-distrito"
                value={editForm.distrito || ''}
                onChange={(e) => setEditForm({ ...editForm, distrito: e.target.value })}
                placeholder="Ej: San Isidro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-provincia">Provincia *</Label>
              <Input
                id="dialog-provincia"
                value={editForm.provincia || ''}
                onChange={(e) => setEditForm({ ...editForm, provincia: e.target.value })}
                placeholder="Ej: Lima"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="dialog-producto">Producto de Interés</Label>
              <Input
                id="dialog-producto"
                value={editForm.producto || ''}
                onChange={(e) => setEditForm({ ...editForm, producto: e.target.value })}
                placeholder="Ej: Colchón Queen Size"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="dialog-notas">Notas del Agente</Label>
              <Textarea
                id="dialog-notas"
                value={editForm.notas_agente || ''}
                onChange={(e) => setEditForm({ ...editForm, notas_agente: e.target.value })}
                placeholder="Notas adicionales sobre el lead..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogLead(null)}>
              Cancelar
            </Button>
            <Button onClick={handleDialogSave}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
