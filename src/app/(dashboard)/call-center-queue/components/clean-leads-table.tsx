'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Client } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Edit2, Save, X, CheckCircle, AlertCircle, Circle, Settings, Eye, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
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
  const [visibleColumns, setVisibleColumns] = useState<{ [key: string]: boolean }>({
    estado: true,
    fechaCreacion: false,
    ultimaModif: false,
    nombreLead: true,
    producto: true,
    estatusLead: true,
    provincia: true,
    dni: true,
    courier: false,
    oficShalom: false,
    atendido: true,
    intentoLlamada: true,
    asesor: true,
    resultado: true,
    comentario: true,
    acciones: true
  });
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

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

  // Column visibility functions
  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => ({ ...prev, [columnKey]: !prev[columnKey] }));
  };

  const showAllColumns = () => {
    setVisibleColumns(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
  };

  const hideAllColumns = () => {
    // Keep at least name and actions visible
    setVisibleColumns(prev => Object.keys(prev).reduce((acc, key) => ({ 
      ...acc, 
      [key]: key === 'nombreLead' || key === 'acciones' 
    }), {}));
  };

  // Column definitions for easier management
  const columnDefinitions = [
    { key: 'estado', label: 'Estado', essential: false },
    { key: 'fechaCreacion', label: 'Fecha Creación', essential: false },
    { key: 'ultimaModif', label: 'Última Modificación', essential: false },
    { key: 'nombreLead', label: 'Nombre del Lead', essential: true },
    { key: 'producto', label: 'Producto', essential: false },
    { key: 'estatusLead', label: 'Estatus del Lead', essential: false },
    { key: 'provincia', label: 'Provincia', essential: false },
    { key: 'dni', label: 'DNI', essential: false },
    { key: 'courier', label: 'Courier', essential: false },
    { key: 'oficShalom', label: 'Ofic. Shalom', essential: false },
    { key: 'atendido', label: 'Atendido', essential: false },
    { key: 'intentoLlamada', label: 'Intento de Llamada', essential: false },
    { key: 'asesor', label: 'Asesor', essential: false },
    { key: 'resultado', label: 'Resultado', essential: false },
    { key: 'comentario', label: 'Comentario', essential: false },
    { key: 'acciones', label: 'Acciones', essential: true }
  ];

  return (
    <>
      <style>{`
        /* Theme-adaptive sticky headers */
        .callcenter-table thead th {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(8px);
          background: hsl(var(--background)) / 0.95;
          border-bottom: 1px solid hsl(var(--border));
        }
        
        /* Table container - force internal scroll only */
        .table-scroll-container {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          border-radius: 0.375rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted)) transparent;
        }

        /* Prevent the table from expanding the page: keep layout fixed and let cells truncate */
        .callcenter-table {
          table-layout: fixed;
          width: 100%;
        }

        /* Ensure cell content truncates instead of forcing width */
        .callcenter-table td .truncate,
        .callcenter-table th .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Compact mode when many columns are visible: reduce padding and font-size so table doesn't force overflow */
        .callcenter-table.compact-columns th,
        .callcenter-table.compact-columns td {
          padding: 0.45rem 0.5rem; /* tighter cells */
          font-size: 0.85rem;
        }

        .callcenter-table.compact-columns th {
          line-height: 1;
        }

        .callcenter-table.compact-columns .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .table-scroll-container::-webkit-scrollbar {
          height: 8px;
        }
        
        .table-scroll-container::-webkit-scrollbar-track {
          background: hsl(var(--muted) / 0.3);
          border-radius: 4px;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.4);
          border-radius: 4px;
        }
        
        .table-scroll-container::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.6);
        }
      `}</style>

      <div className="space-y-4">
        {/* Column visibility controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Columnas visibles:</span>
            <span className="text-xs text-muted-foreground">
              {Object.values(visibleColumns).filter(Boolean).length} de {Object.keys(visibleColumns).length}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Visibilidad de Columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={showAllColumns}>
                <Eye className="h-4 w-4 mr-2" />
                Mostrar todas
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={hideAllColumns}>
                <EyeOff className="h-4 w-4 mr-2" />
                Ocultar opcionales
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {columnDefinitions.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleColumns[col.key]}
                  onCheckedChange={() => col.essential ? null : toggleColumnVisibility(col.key)}
                  disabled={col.essential}
                  className={col.essential ? 'text-muted-foreground' : ''}
                >
                  {col.label}
                  {col.essential && <span className="ml-2 text-xs">(requerido)</span>}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table with horizontal scroll contained */}
        <div className="table-scroll-container">
          <Table className={`w-full callcenter-table min-w-0 ${visibleCount > 9 ? 'compact-columns' : ''}`}>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {visibleColumns.estado && (
                  <TableHead className="w-[40px] sm:w-[60px]">Estado</TableHead>
                )}
                {visibleColumns.fechaCreacion && (
                  <TableHead className="w-[80px] sm:w-[140px]">Fecha Creación</TableHead>
                )}
                {visibleColumns.ultimaModif && (
                  <TableHead className="w-[80px] sm:w-[140px]">Última Modificación</TableHead>
                )}
                {visibleColumns.nombreLead && (
                  <TableHead className="min-w-0 sm:min-w-[200px]">Nombre del Lead</TableHead>
                )}
                {visibleColumns.producto && (
                  <TableHead className="min-w-0 sm:min-w-[180px]">Producto</TableHead>
                )}
                {visibleColumns.estatusLead && (
                  <TableHead className="w-[100px] sm:w-[140px]">Estatus del Lead</TableHead>
                )}
                {visibleColumns.provincia && (
                  <TableHead className="w-[100px] sm:w-[140px]">Provincia</TableHead>
                )}
                {visibleColumns.dni && (
                  <TableHead className="text-center w-[60px] sm:w-[100px]">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>DNI</span>
                    </div>
                  </TableHead>
                )}
                {visibleColumns.courier && (
                  <TableHead className="text-center w-[60px] sm:w-[100px]">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Courier</span>
                    </div>
                  </TableHead>
                )}
                {visibleColumns.oficShalom && (
                  <TableHead className="text-center w-[60px] sm:w-[100px]">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Ofic. Shalom</span>
                    </div>
                  </TableHead>
                )}
                {visibleColumns.atendido && (
                  <TableHead className="text-center w-[60px] sm:w-[100px]">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Atendido</span>
                    </div>
                  </TableHead>
                )}
                {visibleColumns.intentoLlamada && (
                  <TableHead className="w-[90px] sm:w-[140px]">Intento de Llamada</TableHead>
                )}
                {visibleColumns.asesor && (
                  <TableHead className="min-w-0 sm:min-w-[160px]">Asesor</TableHead>
                )}
                {visibleColumns.resultado && (
                  <TableHead className="w-[80px] sm:w-[120px]">Resultado</TableHead>
                )}
                {visibleColumns.comentario && (
                  <TableHead className="text-center w-[90px] sm:min-w-[150px]">
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Comentario</span>
                    </div>
                  </TableHead>
                )}
                {visibleColumns.acciones && (
                  <TableHead className="text-right w-[120px] sm:w-[220px]">Acciones</TableHead>
                )}
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
                      {visibleColumns.estado && (
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {status.isComplete ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : status.completed > 0 ? (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300" />
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.fechaCreacion && (
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="truncate">
                            {lead.first_interaction_at 
                              ? format(new Date(lead.first_interaction_at), 'dd/MM/yyyy HH:mm', { locale: es })
                              : '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.ultimaModif && (
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="truncate">
                            {lead.last_updated 
                              ? format(new Date(lead.last_updated), 'dd/MM/yyyy HH:mm', { locale: es })
                              : '—'}
                          </div>
                        </TableCell>
                      )}
                      
                      {visibleColumns.nombreLead && (
                        <TableCell className="font-medium">
                          <div className="truncate">
                            {isEditing ? (
                              <Input
                                value={editForm.nombres || ''}
                                onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                                className="h-8 w-full"
                              />
                            ) : (
                              <span className={cn(!isFieldComplete(lead, 'nombres') && 'text-muted-foreground')}>
                                {lead.nombres || '—'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.producto && (
                        <TableCell>
                          <div className="truncate">
                            {isEditing ? (
                              <Input
                                value={editForm.producto || ''}
                                onChange={(e) => setEditForm({ ...editForm, producto: e.target.value })}
                                className="h-8 w-full"
                                placeholder="Producto..."
                              />
                            ) : (
                              <span className={cn(!isFieldComplete(lead, 'producto') && 'text-muted-foreground text-sm')}>
                                {lead.producto || '—'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.estatusLead && (
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
                      )}

                      {visibleColumns.provincia && (
                        <TableCell>
                          <div className="truncate">
                            {isEditing ? (
                              <Input
                                value={editForm.provincia || ''}
                                onChange={(e) => setEditForm({ ...editForm, provincia: e.target.value })}
                                className="h-8 w-full"
                                placeholder="Provincia..."
                              />
                            ) : (
                              <span className={cn(!isFieldComplete(lead, 'provincia') && 'text-muted-foreground')}>
                                {lead.provincia || '—'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.dni && (
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              value={editForm.dni || ''}
                              onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                              className="h-8 w-full"
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
                      )}

                      {visibleColumns.courier && (
                        <TableCell className="text-center text-orange-500 font-semibold">
                          ⚠
                        </TableCell>
                      )}

                      {visibleColumns.oficShalom && (
                        <TableCell className="text-center text-orange-500 font-semibold">
                          ⚠
                        </TableCell>
                      )}

                      {visibleColumns.atendido && (
                        <TableCell className="text-center">
                          {lead.call_status !== 'NUEVO' && lead.assigned_agent_name ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-orange-500 font-semibold">⚠</span>
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.intentoLlamada && (
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {callAttempts === '0' ? '—' : `Intento ${callAttempts}`}
                          </Badge>
                        </TableCell>
                      )}

                      {visibleColumns.asesor && (
                        <TableCell>
                          <div className="truncate">
                            {lead.assigned_agent_name ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                  {lead.assigned_agent_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <span className="text-sm truncate">{lead.assigned_agent_name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Sin asignar</span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.resultado && (
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
                      )}

                      {visibleColumns.comentario && (
                        <TableCell className="text-center">
                          <div className="truncate">
                            {isEditing ? (
                              <Input
                                value={editForm.notas_agente || ''}
                                onChange={(e) => setEditForm({ ...editForm, notas_agente: e.target.value })}
                                className="h-8 w-full"
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
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.acciones && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 min-w-0">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveInline(lead)}
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <Save className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-8 w-8 p-0 flex-shrink-0"
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
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => openDialog(lead)}
                                  className="h-8 gap-1 whitespace-nowrap"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  <span className="hidden sm:inline">Editar</span>
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => onProcessLead(lead)}
                                  className="h-8 gap-1 whitespace-nowrap"
                                >
                                  <Phone className="h-3 w-3" />
                                  <span className="hidden sm:inline">Procesar</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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