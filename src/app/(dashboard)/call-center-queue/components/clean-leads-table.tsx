'use client';

import { useState } from 'react';
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
    const requiredFields: (keyof Client)[] = ['nombres', 'celular', 'direccion', 'distrito', 'provincia'];
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]">Estado</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Distrito</TableHead>
              <TableHead>Provincia</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tienda</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                  No hay leads pendientes
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const status = getCompletionStatus(lead);
                const isEditing = editingId === lead.id;

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
                    
                    <TableCell className="font-medium">
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

                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editForm.producto || ''}
                          onChange={(e) => setEditForm({ ...editForm, producto: e.target.value })}
                          className="h-8"
                          placeholder="Producto..."
                        />
                      ) : (
                        <span className={cn(!isFieldComplete(lead, 'producto') && 'text-muted-foreground')}>
                          {lead.producto || '—'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editForm.celular || ''}
                          onChange={(e) => setEditForm({ ...editForm, celular: e.target.value })}
                          className="h-8"
                        />
                      ) : (
                        <span className={cn(!isFieldComplete(lead, 'celular') && 'text-muted-foreground')}>
                          {lead.celular || '—'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editForm.dni || ''}
                          onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                          className="h-8"
                          placeholder="DNI..."
                        />
                      ) : (
                        <span className={cn(!isFieldComplete(lead, 'dni') && 'text-muted-foreground')}>
                          {lead.dni || '—'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editForm.direccion || ''}
                          onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                          className="h-8"
                          placeholder="Dirección..."
                        />
                      ) : (
                        <span className={cn(!isFieldComplete(lead, 'direccion') && 'text-muted-foreground')}>
                          {lead.direccion || '—'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editForm.distrito || ''}
                          onChange={(e) => setEditForm({ ...editForm, distrito: e.target.value })}
                          className="h-8"
                          placeholder="Distrito..."
                        />
                      ) : (
                        <span className={cn(!isFieldComplete(lead, 'distrito') && 'text-muted-foreground')}>
                          {lead.distrito || '—'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
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

                    <TableCell>
                      <span className={cn(!isFieldComplete(lead, 'email') && 'text-muted-foreground text-xs')}>
                        {lead.email || '—'}
                      </span>
                    </TableCell>

                    <TableCell>
                      {lead.tienda_origen && (
                        <Badge variant="outline" className="text-xs">
                          {lead.tienda_origen}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {lead.last_updated ? format(new Date(lead.last_updated), 'dd/MM/yyyy', { locale: es }) : '—'}
                    </TableCell>

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
