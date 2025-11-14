'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Client, User } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Edit2, Save, X, CheckCircle, AlertCircle, Circle, Settings, Eye, EyeOff, Filter, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { cn, normalizeShopName } from '@/lib/utils';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateTimeFilter } from './date-time-filter';
import { ProductFilter } from './product-filter';

interface CleanLeadsTableProps {
  leads: Client[];
  onProcessLead: (lead: Client) => void;
  currentUser: User | null;
  authUserId: string | null;
}

export function CleanLeadsTable({ leads, onProcessLead, currentUser, authUserId }: CleanLeadsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [dialogLead, setDialogLead] = useState<Client | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  const DEFAULT_VISIBLE_COLUMNS: { [key: string]: boolean } = {
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
    celular: true,
    direccion: false,
    distrito: false,
    email: false,
    tienda: false,
    shopifyOrderId: false,
    itemsCount: false,
    itemsSummary: false,
    subtotalPrice: false,
    totalPrice: false,
    totalShipping: false,
    paymentGateway: false,
    confirmedAt: false,
    visto: false,
    // 'acciones' column removed: actions are provided via per-row overlay/menu
  };

  const [visibleColumns, setVisibleColumns] = useState<{ [key: string]: boolean }>(DEFAULT_VISIBLE_COLUMNS);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cargar configuración desde Firestore al montar el componente
  useEffect(() => {
    const loadTableConfig = async () => {
      if (!authUserId) {
        // Si no hay usuario autenticado, cargar desde localStorage
        try {
          const rawColumns = localStorage.getItem('cc_visibleColumns');
          const rawWidths = localStorage.getItem('cc_columnWidths');
          
          if (rawColumns) {
            const parsed = JSON.parse(rawColumns);
            // Eliminar columna 'acciones' si existe
            if (parsed && Object.prototype.hasOwnProperty.call(parsed, 'acciones')) {
              delete parsed.acciones;
            }
            setVisibleColumns(parsed);
          }
          
          if (rawWidths) {
            setColumnWidths(JSON.parse(rawWidths));
          }
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
        setIsLoadingConfig(false);
        return;
      }

      try {
        // Intentar cargar desde Firestore usando authUserId (Firebase Auth UID)
        const configRef = doc(db, 'user_table_configs', authUserId);
        const configSnap = await getDoc(configRef);
        
        if (configSnap.exists()) {
          const data = configSnap.data();
          
          if (data.visibleColumns) {
            // Eliminar columna 'acciones' si existe
            if (Object.prototype.hasOwnProperty.call(data.visibleColumns, 'acciones')) {
              delete data.visibleColumns.acciones;
            }
            setVisibleColumns(data.visibleColumns);
          }
          
          if (data.columnWidths) {
            setColumnWidths(data.columnWidths);
          }
          
          // Guardar también en localStorage como backup
          localStorage.setItem('cc_visibleColumns', JSON.stringify(data.visibleColumns || DEFAULT_VISIBLE_COLUMNS));
          localStorage.setItem('cc_columnWidths', JSON.stringify(data.columnWidths || {}));
        } else {
          // Si no existe en Firestore, intentar cargar desde localStorage
          const rawColumns = localStorage.getItem('cc_visibleColumns');
          const rawWidths = localStorage.getItem('cc_columnWidths');
          
          if (rawColumns) {
            const parsed = JSON.parse(rawColumns);
            if (parsed && Object.prototype.hasOwnProperty.call(parsed, 'acciones')) {
              delete parsed.acciones;
            }
            setVisibleColumns(parsed);
          }
          
          if (rawWidths) {
            setColumnWidths(JSON.parse(rawWidths));
          }
        }
      } catch (e) {
        console.error('Error loading table config from Firestore:', e);
        // Fallback a localStorage
        try {
          const rawColumns = localStorage.getItem('cc_visibleColumns');
          const rawWidths = localStorage.getItem('cc_columnWidths');
          
          if (rawColumns) {
            const parsed = JSON.parse(rawColumns);
            if (parsed && Object.prototype.hasOwnProperty.call(parsed, 'acciones')) {
              delete parsed.acciones;
            }
            setVisibleColumns(parsed);
          }
          
          if (rawWidths) {
            setColumnWidths(JSON.parse(rawWidths));
          }
        } catch (localErr) {
          console.error('Error loading from localStorage:', localErr);
        }
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadTableConfig();
  }, [authUserId]);

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  // Guardar configuración en Firestore y localStorage cuando cambien
  useEffect(() => {
    if (isLoadingConfig) return; // No guardar durante la carga inicial
    
    const saveTableConfig = async () => {
      // Siempre guardar en localStorage como backup
      try {
        localStorage.setItem('cc_visibleColumns', JSON.stringify(visibleColumns));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }

      // Si hay usuario autenticado, guardar en Firestore usando authUserId
      if (authUserId) {
        try {
          const configRef = doc(db, 'user_table_configs', authUserId);
          await setDoc(configRef, {
            visibleColumns,
            columnWidths,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {
          console.error('Error saving table config to Firestore:', e);
        }
      }
    };

    saveTableConfig();
  }, [visibleColumns, authUserId, isLoadingConfig, columnWidths]);

  // Guardar anchos de columna
  useEffect(() => {
    if (isLoadingConfig) return;
    
    const saveColumnWidths = async () => {
      // Guardar en localStorage
      try {
        localStorage.setItem('cc_columnWidths', JSON.stringify(columnWidths));
      } catch (e) {
        console.error('Error saving column widths to localStorage:', e);
      }

      // Si hay usuario autenticado, guardar en Firestore usando authUserId
      if (authUserId) {
        try {
          const configRef = doc(db, 'user_table_configs', authUserId);
          await setDoc(configRef, {
            visibleColumns,
            columnWidths,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {
          console.error('Error saving column widths to Firestore:', e);
        }
      }
    };

    saveColumnWidths();
  }, [columnWidths, authUserId, isLoadingConfig, visibleColumns]);

  // Column filters: multi-select values per column
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [resizing, setResizing] = useState<null | { colKey: string; startX: number; startWidth: number }>(null);
  // Date range filters for date/time columns (values as datetime-local strings)
  const [dateFilters, setDateFilters] = useState<Record<string, { from?: string; to?: string }>>({});
  // Time-of-day range filters (HH:MM) for columns; primary focus per request
  const [timeFilters, setTimeFilters] = useState<Record<string, { from?: string; to?: string }>>({});

  // Map column keys to lead object fields (best-effort mapping for filters)
  const columnFieldMap: Record<string, string> = {
    estado: 'call_status',
    fechaCreacion: 'first_interaction_at',
    ultimaModif: 'last_updated',
    nombreLead: 'nombres',
    producto: 'producto',
    estatusLead: 'call_status',
    provincia: 'provincia',
    dni: 'dni',
    courier: 'courier',
    oficShalom: 'ofic_shalom',
    atendido: 'assigned_agent_name',
    intentoLlamada: 'call_status',
    asesor: 'assigned_agent_name',
    resultado: 'call_status',
    comentario: 'notas_agente',
    celular: 'celular',
    direccion: 'direccion',
    distrito: 'distrito',
    email: 'email',
  tienda: 'tienda_origen',
    shopifyOrderId: 'shopify_order_id',
    subtotalPrice: 'shopify_payment_details.subtotal_price',
    totalPrice: 'shopify_payment_details.total_price',
    totalShipping: 'shopify_payment_details.total_shipping',
    paymentGateway: 'shopify_payment_details.payment_gateway',
    // 'source' column removed: origin is displayed via tienda_origen when needed
    confirmedAt: 'confirmed_at',
    visto: 'visto_por',
    
  };
  

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
      notas_agente: lead.notas_agente,
      call_status: lead.call_status
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
      // Sanitize update data: remove undefined values because Firestore rejects them
      const updateData: any = { ...editForm, last_updated: new Date().toISOString() };
      Object.keys(updateData).forEach((k) => {
        if (updateData[k] === undefined) delete updateData[k];
      });

      // Si el agente actual existe y se escribió una nota o se editó el lead, asignarlo como asesor
      if (currentUser) {
        const shouldAssignAsesor = Boolean(editForm.notas_agente) || Object.keys(editForm).length > 0;
        if (shouldAssignAsesor) {
          updateData.assigned_agent_id = currentUser.id_usuario ?? authUserId ?? null;
          updateData.assigned_agent_name = currentUser.nombre ?? null;
          updateData.assigned_agent_avatar = currentUser.avatar ?? null;
        }
      }

      await updateDoc(leadRef, updateData);

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
      // Sanitize update data before sending to Firestore
      const updateData: any = { ...editForm, last_updated: new Date().toISOString() };
      Object.keys(updateData).forEach((k) => {
        if (updateData[k] === undefined) delete updateData[k];
      });

      // Si hay usuario actual y se editó o dejó una nota, asignar como asesor
      if (currentUser) {
        const shouldAssignAsesor = Boolean(editForm.notas_agente) || Object.keys(editForm).length > 0;
        if (shouldAssignAsesor) {
          updateData.assigned_agent_id = currentUser.id_usuario ?? authUserId ?? null;
          updateData.assigned_agent_name = currentUser.nombre ?? null;
          updateData.assigned_agent_avatar = currentUser.avatar ?? null;
        }
      }

      await updateDoc(leadRef, updateData);

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
      notas_agente: lead.notas_agente,
      call_status: lead.call_status
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
      [key]: key === 'nombreLead'
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
    { key: 'celular', label: 'Celular', essential: false },
    { key: 'direccion', label: 'Dirección', essential: false },
    { key: 'distrito', label: 'Distrito', essential: false },
    { key: 'email', label: 'Email', essential: false },
  { key: 'tienda', label: 'Tienda / Origen', essential: false },
    { key: 'shopifyOrderId', label: 'Order ID', essential: false },
    { key: 'itemsCount', label: 'Items', essential: false },
    { key: 'itemsSummary', label: 'Resumen Items', essential: false },
    { key: 'subtotalPrice', label: 'Subtotal', essential: false },
    { key: 'totalPrice', label: 'Total', essential: false },
    { key: 'totalShipping', label: 'Envio', essential: false },
    { key: 'paymentGateway', label: 'Metodo Pago', essential: false },
    { key: 'confirmedAt', label: 'Confirmado', essential: false },
    { key: 'visto', label: 'Visto', essential: false }
  ];

  // Compute unique values per column (for filter options)
  const uniqueValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};

    const getByPath = (obj: any, path: string) => {
      if (!obj || !path) return undefined;
      // support dot paths like 'shopify_payment_details.total_price'
      const parts = path.split('.');
      let cur: any = obj;
      for (const p of parts) {
        if (cur === null || cur === undefined) return undefined;
        cur = cur[p];
      }
      return cur;
    };

    columnDefinitions.forEach(col => {
      const field = columnFieldMap[col.key];
      const values = new Set<string>();

      // Special-case producto: gather both `producto` and shopify_items names
      if (col.key === 'producto') {
        leads.forEach(lead => {
          const p = (lead as any).producto;
          if (p === null || p === undefined || p === '') values.add('—');
          else values.add(String(p));

          const items = (lead as any).shopify_items;
          if (Array.isArray(items) && items.length > 0) {
            items.forEach((it: any) => {
              const name = it.nombre || it.name || it.title;
              if (name) values.add(String(name));
            });
          }
        });
        map[col.key] = Array.from(values).slice(0, 200);
        return;
      }

      // Special-case tienda: include tienda_origen and the legacy/source field if present
      if (col.key === 'tienda') {
        leads.forEach(lead => {
          const t = (lead as any).tienda_origen;
          const s = (lead as any).source;
          if ((t === null || t === undefined || t === '') && (s === null || s === undefined || s === '')) {
            values.add('—');
          } else {
            if (t) values.add(normalizeShopName(String(t)) || String(t));
            if (s) values.add(normalizeShopName(String(s)) || String(s));
          }
        });
        map[col.key] = Array.from(values).slice(0, 200);
        return;
      }

      if (!field) {
        map[col.key] = [];
        return;
      }

      leads.forEach(lead => {
        let val = getByPath(lead as any, field);
        if (Array.isArray(val)) {
          const first = val[0];
          if (typeof first === 'string') val = first;
          else if (first && (first.nombre || first.name || first.title)) val = String(first.nombre || first.name || first.title);
          else val = String(val.length);
        }

        if (val === null || val === undefined) values.add('—');
        else if (typeof val === 'string') values.add(val);
        else values.add(String(val));
      });
      map[col.key] = Array.from(values).slice(0, 100);
    });
    return map;
  }, [leads]);

  const toggleFilterValue = (colKey: string, value: string) => {
    setColumnFilters(prev => {
      const existing = prev[colKey] || [];
      const idx = existing.indexOf(value);
      const copy = { ...prev };
      if (idx === -1) copy[colKey] = [...existing, value];
      else copy[colKey] = existing.filter(v => v !== value);
      return copy;
    });
  };

  const startResize = (e: any, colKey: string) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const th = target.parentElement as HTMLElement | null;
    const startWidth = th ? th.offsetWidth : 100;
    setResizing({ colKey, startX: e.clientX, startWidth });
    // prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - resizing.startX;
      const newWidth = Math.max(2, Math.round(resizing.startWidth + dx));
      setColumnWidths(prev => ({ ...prev, [resizing.colKey]: newWidth }));
    };
    const onUp = () => {
      setResizing(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [resizing]);

  const clearColumnFilter = (colKey: string) => {
    setColumnFilters(prev => {
      const copy = { ...prev };
      delete copy[colKey];
      return copy;
    });
  };

  const setDateFilter = (colKey: string, from?: string, to?: string) => {
    setDateFilters(prev => {
      const copy = { ...prev };
      if (!from && !to) {
        delete copy[colKey];
      } else {
        copy[colKey] = { from, to };
      }
      return copy;
    });
  };

  const clearDateFilter = (colKey: string) => {
    setDateFilters(prev => {
      const copy = { ...prev };
      delete copy[colKey];
      return copy;
    });
  };

  const setTimeFilter = (colKey: string, from?: string, to?: string) => {
    setTimeFilters(prev => {
      const copy = { ...prev };
      if (!from && !to) {
        delete copy[colKey];
      } else {
        copy[colKey] = { from, to };
      }
      return copy;
    });
  };

  const clearTimeFilter = (colKey: string) => {
    setTimeFilters(prev => {
      const copy = { ...prev };
      delete copy[colKey];
      return copy;
    });
  };

  // Filtered leads based on columnFilters, dateFilters and timeFilters
  const filteredLeads = useMemo(() => {
    const activeFilterKeys = Object.keys(columnFilters).filter(k => (columnFilters[k] || []).length > 0);
    return leads.filter(lead => {
      // Apply multi-select column filters
      const columnPass = activeFilterKeys.every(colKey => {
          // Special handling for producto: a lead can have a top-level `producto` field
          // but also an array `shopify_items` with item names. Filters should match
          // against either source.
          if (colKey === 'producto') {
            const allowed = columnFilters[colKey] || [];
            const valuesForLead: string[] = [];

            const p = (lead as any).producto;
            if (p === null || p === undefined || p === '') valuesForLead.push('—');
            else valuesForLead.push(String(p));

            const items = (lead as any).shopify_items;
            if (Array.isArray(items) && items.length > 0) {
              items.forEach((it: any) => {
                const name = it.nombre || it.name || it.title;
                if (name) valuesForLead.push(String(name));
              });
            }

            // If any of the allowed filter values matches any of the lead values, this column passes
            return allowed.some(a => valuesForLead.includes(a));
          }

          const field = columnFieldMap[colKey];
          if (!field) return true;
          const leadVal = (lead as any)[field];
          const normalized = leadVal === null || leadVal === undefined ? '—' : String(leadVal);
          return columnFilters[colKey].includes(normalized);
        });
      if (!columnPass) return false;

      // Apply date range filters (if present)
      for (const colKey of Object.keys(dateFilters)) {
        const filter = dateFilters[colKey];
        if (!filter) continue;
        const field = columnFieldMap[colKey];
        if (!field) continue;
        const leadVal = (lead as any)[field];
        if (!leadVal) return false;
        const leadTs = new Date(leadVal).getTime();

        if (filter.from) {
          const fromTs = new Date(filter.from).getTime();
          if (isNaN(fromTs) || leadTs < fromTs) return false;
        }
        if (filter.to) {
          const toTs = new Date(filter.to).getTime();
          if (isNaN(toTs) || leadTs > toTs) return false;
        }
      }

      // Apply time-of-day filters (primary requirement)
      for (const colKey of Object.keys(timeFilters)) {
        const tfilter = timeFilters[colKey];
        if (!tfilter) continue;
        const field = columnFieldMap[colKey];
        if (!field) continue;
        const leadVal = (lead as any)[field];
        if (!leadVal) return false;
        const d = new Date(leadVal);
        if (isNaN(d.getTime())) return false;
        const leadMinutes = d.getHours() * 60 + d.getMinutes();

        const parseHM = (s?: string) => {
          if (!s) return undefined;
          const [hh, mm] = s.split(':').map(v => Number(v));
          if (Number.isNaN(hh) || Number.isNaN(mm)) return undefined;
          return hh * 60 + mm;
        };

        const fromMin = parseHM(tfilter.from);
        const toMin = parseHM(tfilter.to);

        if (fromMin === undefined && toMin === undefined) continue;

        if (fromMin !== undefined && toMin !== undefined) {
          // Normal range
          if (fromMin <= toMin) {
            if (leadMinutes < fromMin || leadMinutes > toMin) return false;
          } else {
            // Wrap-around (e.g., 22:00 - 02:00)
            if (!(leadMinutes >= fromMin || leadMinutes <= toMin)) return false;
          }
        } else if (fromMin !== undefined) {
          if (leadMinutes < fromMin) return false;
        } else if (toMin !== undefined) {
          if (leadMinutes > toMin) return false;
        }
      }

      return true;
    });
  }, [leads, columnFilters, dateFilters, timeFilters]);

  // Scroll-to-column helper for top nav
  const scrollToColumn = useCallback((colKey: string) => {
    if (!containerRef.current) return;
    const th = containerRef.current.querySelector(`th[data-col="${colKey}"]`) as HTMLElement | null;
    if (!th) return;
    // Scroll so the column is visible with a small offset
    const left = th.offsetLeft - 12;
    containerRef.current.scrollTo({ left, behavior: 'smooth' });
  }, []);

  return (
    <>
  <style>{`
        /* Theme-adaptive sticky headers */
        .callcenter-table thead th {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(8px);
          /* ensure HSL alpha syntax is inside parentheses */
          background: hsl(var(--background) / 0.95);
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

        /* Column resizer handle with visible grip */
        .col-resizer {
          position: absolute;
          top: 0;
          right: 0;
          width: 12px;
          height: 100%;
          cursor: col-resize;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .col-resizer::before {
          content: '';
          display: block;
          width: 2px;
          height: 48%;
          background: rgba(0,0,0,0.18);
          border-radius: 2px;
        }
        .col-resizer:hover::before { background: rgba(0,0,0,0.28); }
        .col-resizer:active { background: rgba(0,0,0,0.02); }
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
              <DropdownMenuContent align="end" className="w-56 bg-popover shadow-md rounded-md border">
              <DropdownMenuLabel className="text-xs">Visibilidad de Columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={showAllColumns} onSelect={(e) => e.preventDefault()}>
                <Eye className="h-4 w-4 mr-2" />
                Mostrar todas
              </DropdownMenuItem>

              <DropdownMenuItem onClick={hideAllColumns} onSelect={(e) => e.preventDefault()}>
                <EyeOff className="h-4 w-4 mr-2" />
                Ocultar opcionales
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <div className="p-2 max-h-56 overflow-y-auto">
                {columnDefinitions.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleColumns[col.key]}
                    onCheckedChange={() => col.essential ? null : toggleColumnVisibility(col.key)}
                    onSelect={(e) => e.preventDefault()} // Evitar que se cierre al hacer clic
                    disabled={col.essential}
                    className={col.essential ? 'text-muted-foreground' : ''}
                  >
                    {col.label}
                    {col.essential && <span className="ml-2 text-xs">(requerido)</span>}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters Banner */}
        {(() => {
          const activeColumnFilters = Object.entries(columnFilters).filter(([_, vals]) => vals && vals.length > 0);
          const activeDateFilters = Object.entries(dateFilters).filter(([_, range]) => range && (range.from || range.to));
          const activeTimeFilters = Object.entries(timeFilters).filter(([_, range]) => range && (range.from || range.to));
          const totalActiveFilters = activeColumnFilters.length + activeDateFilters.length + activeTimeFilters.length;

          if (totalActiveFilters === 0) return null;

          return (
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {totalActiveFilters} {totalActiveFilters === 1 ? 'filtro activo' : 'filtros activos'}
                </span>
                <div className="flex gap-1 flex-wrap">
                  {activeColumnFilters.map(([key, vals]) => (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {columnDefinitions.find(c => c.key === key)?.label || key}: {vals.length}
                    </Badge>
                  ))}
                  {activeDateFilters.map(([key]) => (
                    <Badge key={`date-${key}`} variant="secondary" className="text-xs">
                      Fecha {columnDefinitions.find(c => c.key === key)?.label || key}
                    </Badge>
                  ))}
                  {activeTimeFilters.map(([key]) => (
                    <Badge key={`time-${key}`} variant="secondary" className="text-xs">
                      Hora {columnDefinitions.find(c => c.key === key)?.label || key}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setColumnFilters({});
                  setDateFilters({});
                  setTimeFilters({});
                }}
                className="text-xs"
              >
                Limpiar todos
              </Button>
            </div>
          );
        })()}

        {/* Table with horizontal scroll contained */}
        {/* Top horizontal navigation: quick jump to column */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {columnDefinitions.filter(c => visibleColumns[c.key]).map(c => (
            <Button
              key={c.key}
              variant="ghost"
              size="sm"
              onClick={() => scrollToColumn(c.key)}
              className="text-xs px-2 py-1 rounded-md"
              title={`Ir a ${c.label}`}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="table-scroll-container" ref={containerRef as any}>
          <Table className={`w-full callcenter-table min-w-0 ${visibleCount > 9 ? 'compact-columns' : ''}`}>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {visibleColumns.estado && (
                  <TableHead data-col="estado" className="relative w-[40px] sm:w-[60px]" style={{ width: columnWidths['estado'] ? `${columnWidths['estado']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span>Estado</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn("h-6 w-6 p-0 relative", (columnFilters.estado || []).length > 0 && "text-primary")}>
                            <Filter className="h-3 w-3" />
                            {(columnFilters.estado || []).length > 0 && (
                              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent sideOffset={4} className="w-56 bg-popover shadow-md rounded-md border">
                          <div className="p-2 max-h-56 overflow-y-auto">
                            {uniqueValuesMap.estado && uniqueValuesMap.estado.length > 0 ? (
                              uniqueValuesMap.estado.map(val => (
                                <label key={val} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/20 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={(columnFilters.estado || []).includes(val)}
                                    onChange={() => toggleFilterValue('estado', val)}
                                  />
                                  <span className="truncate" title={val}>{val}</span>
                                </label>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground">No hay valores</div>
                            )}
                          </div>
                          <DropdownMenuSeparator />
                          <div className="flex items-center justify-between px-2 py-1">
                            <Button size="sm" variant="ghost" onClick={() => clearColumnFilter('estado')}>Limpiar</Button>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'estado')} />
                  </TableHead>
                )}
                {visibleColumns.fechaCreacion && (
                  <TableHead data-col="fechaCreacion" className="relative w-[80px] sm:w-[140px]" style={{ width: columnWidths['fechaCreacion'] ? `${columnWidths['fechaCreacion']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span>Fecha Creación</span>
                      <DateTimeFilter
                        columnKey="fechaCreacion"
                        columnLabel="Fecha Creación"
                        currentDateFilter={dateFilters.fechaCreacion}
                        currentTimeFilter={timeFilters.fechaCreacion}
                        onApply={(dateFilter?: { from?: string; to?: string }, timeFilter?: { from?: string; to?: string }) => {
                          if (dateFilter) {
                            setDateFilter('fechaCreacion', dateFilter.from, dateFilter.to);
                          }
                          if (timeFilter) {
                            setTimeFilter('fechaCreacion', timeFilter.from, timeFilter.to);
                          }
                        }}
                        onClear={() => {
                          clearDateFilter('fechaCreacion');
                          clearTimeFilter('fechaCreacion');
                        }}
                      />
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'fechaCreacion')} />
                  </TableHead>
                )}
                {visibleColumns.ultimaModif && (
                  <TableHead data-col="ultimaModif" className="relative w-[80px] sm:w-[140px]" style={{ width: columnWidths['ultimaModif'] ? `${columnWidths['ultimaModif']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span>Última Modificación</span>
                      <DateTimeFilter
                        columnKey="ultimaModif"
                        columnLabel="Última Modificación"
                        currentDateFilter={dateFilters.ultimaModif}
                        currentTimeFilter={timeFilters.ultimaModif}
                        onApply={(dateFilter?: { from?: string; to?: string }, timeFilter?: { from?: string; to?: string }) => {
                          if (dateFilter) {
                            setDateFilter('ultimaModif', dateFilter.from, dateFilter.to);
                          }
                          if (timeFilter) {
                            setTimeFilter('ultimaModif', timeFilter.from, timeFilter.to);
                          }
                        }}
                        onClear={() => {
                          clearDateFilter('ultimaModif');
                          clearTimeFilter('ultimaModif');
                        }}
                      />
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'ultimaModif')} />
                  </TableHead>
                )}
                {visibleColumns.nombreLead && (
                  <TableHead data-col="nombreLead" className="relative min-w-0 sm:min-w-[200px]" style={{ width: columnWidths['nombreLead'] ? `${columnWidths['nombreLead']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span>Nombre del Lead</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn("h-6 w-6 p-0 relative", (columnFilters.nombreLead || []).length > 0 && "text-primary")}>
                            <Filter className="h-3 w-3" />
                            {(columnFilters.nombreLead || []).length > 0 && (
                              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent sideOffset={4} className="w-56 bg-popover shadow-md rounded-md border">
                          <div className="p-2 max-h-56 overflow-y-auto">
                            {uniqueValuesMap.nombreLead && uniqueValuesMap.nombreLead.length > 0 ? (
                              uniqueValuesMap.nombreLead.map(val => (
                                <label key={val} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/20 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={(columnFilters.nombreLead || []).includes(val)}
                                    onChange={() => toggleFilterValue('nombreLead', val)}
                                  />
                                  <span className="truncate" title={val}>{val}</span>
                                </label>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground">No hay valores</div>
                            )}
                          </div>
                          <DropdownMenuSeparator />
                          <div className="flex items-center justify-between px-2 py-1">
                            <Button size="sm" variant="ghost" onClick={() => clearColumnFilter('nombreLead')}>Limpiar</Button>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'nombreLead')} />
                  </TableHead>
                )}
                {visibleColumns.producto && (
                  <TableHead data-col="producto" className="relative min-w-0 sm:min-w-[180px]" style={{ width: columnWidths['producto'] ? `${columnWidths['producto']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span>Producto</span>
                      <ProductFilter
                        products={uniqueValuesMap.producto || []}
                        selectedProducts={columnFilters.producto || []}
                        onApply={(selected: string[]) => {
                          setColumnFilters(prev => ({
                            ...prev,
                            producto: selected
                          }));
                        }}
                        onClear={() => clearColumnFilter('producto')}
                      />
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'producto')} />
                  </TableHead>
                )}
                {visibleColumns.celular && (
                  <TableHead data-col="celular" className="relative w-[120px] sm:w-[140px]" style={{ width: columnWidths['celular'] ? `${columnWidths['celular']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Celular</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'celular')} />
                  </TableHead>
                )}

                {visibleColumns.direccion && (
                  <TableHead data-col="direccion" className="relative min-w-0 sm:min-w-[220px]" style={{ width: columnWidths['direccion'] ? `${columnWidths['direccion']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Dirección</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'direccion')} />
                  </TableHead>
                )}

                {visibleColumns.distrito && (
                  <TableHead data-col="distrito" className="relative w-[100px] sm:w-[120px]" style={{ width: columnWidths['distrito'] ? `${columnWidths['distrito']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Distrito</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'distrito')} />
                  </TableHead>
                )}

                {visibleColumns.email && (
                  <TableHead data-col="email" className="relative min-w-0 sm:min-w-[180px]" style={{ width: columnWidths['email'] ? `${columnWidths['email']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Email</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'email')} />
                  </TableHead>
                )}

                {visibleColumns.tienda && (
                  <TableHead data-col="tienda" className="relative w-[110px] sm:w-[140px]" style={{ width: columnWidths['tienda'] ? `${columnWidths['tienda']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Tienda / Origen</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'tienda')} />
                  </TableHead>
                )}

                {visibleColumns.shopifyOrderId && (
                  <TableHead data-col="shopifyOrderId" className="relative w-[120px] sm:w-[160px]" style={{ width: columnWidths['shopifyOrderId'] ? `${columnWidths['shopifyOrderId']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Order ID</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'shopifyOrderId')} />
                  </TableHead>
                )}

                {visibleColumns.itemsCount && (
                  <TableHead data-col="itemsCount" className="relative w-[60px] sm:w-[80px]" style={{ width: columnWidths['itemsCount'] ? `${columnWidths['itemsCount']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-center">Items</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'itemsCount')} />
                  </TableHead>
                )}

                {visibleColumns.itemsSummary && (
                  <TableHead data-col="itemsSummary" className="relative min-w-0 sm:min-w-[220px]" style={{ width: columnWidths['itemsSummary'] ? `${columnWidths['itemsSummary']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Resumen Items</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'itemsSummary')} />
                  </TableHead>
                )}

                {visibleColumns.totalPrice && (
                  <TableHead data-col="totalPrice" className="relative w-[100px] sm:w-[120px] text-right" style={{ width: columnWidths['totalPrice'] ? `${columnWidths['totalPrice']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-end">Total</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'totalPrice')} />
                  </TableHead>
                )}

                {/* 'source' column removed - use 'tienda' (tienda_origen) when tienda/origen info is needed */}

                {visibleColumns.confirmedAt && (
                  <TableHead data-col="confirmedAt" className="relative w-[140px] sm:w-[160px]" style={{ width: columnWidths['confirmedAt'] ? `${columnWidths['confirmedAt']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Confirmado</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'confirmedAt')} />
                  </TableHead>
                )}

                {visibleColumns.visto && (
                  <TableHead data-col="visto" className="relative w-[80px] sm:w-[100px]" style={{ width: columnWidths['visto'] ? `${columnWidths['visto']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Visto</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'visto')} />
                  </TableHead>
                )}
                {visibleColumns.estatusLead && (
                  <TableHead data-col="estatusLead" className="relative w-[100px] sm:w-[140px]" style={{ width: columnWidths['estatusLead'] ? `${columnWidths['estatusLead']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span>Estatus del Lead</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn("h-6 w-6 p-0 relative", (columnFilters.estatusLead || []).length > 0 && "text-primary")}>
                            <Filter className="h-3 w-3" />
                            {(columnFilters.estatusLead || []).length > 0 && (
                              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent sideOffset={4} className="w-56 bg-popover shadow-md rounded-md border">
                          <div className="p-2">
                            {uniqueValuesMap.estatusLead && uniqueValuesMap.estatusLead.length > 0 ? (
                              uniqueValuesMap.estatusLead.map(val => (
                                <label key={val} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/20 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={(columnFilters.estatusLead || []).includes(val)}
                                    onChange={() => toggleFilterValue('estatusLead', val)}
                                  />
                                  <span className="truncate" title={val}>{val}</span>
                                </label>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground">No hay valores</div>
                            )}
                          </div>
                          <DropdownMenuSeparator />
                          <div className="flex items-center justify-between px-2 py-1">
                            <Button size="sm" variant="ghost" onClick={() => clearColumnFilter('estatusLead')}>Limpiar</Button>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'estatusLead')} />
                  </TableHead>
                )}
                {visibleColumns.provincia && (
                  <TableHead data-col="provincia" className="relative w-[100px] sm:w-[140px]" style={{ width: columnWidths['provincia'] ? `${columnWidths['provincia']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span>Provincia</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn("h-6 w-6 p-0 relative", (columnFilters.provincia || []).length > 0 && "text-primary")}>
                            <Filter className="h-3 w-3" />
                            {(columnFilters.provincia || []).length > 0 && (
                              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent sideOffset={4} className="w-56 bg-popover shadow-md rounded-md border">
                          {/* allow long lists (provincias) to scroll */}
                          <div className="p-2 max-h-56 overflow-y-auto">
                            {uniqueValuesMap.provincia && uniqueValuesMap.provincia.length > 0 ? (
                              uniqueValuesMap.provincia.map(val => (
                                <label key={val} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/20 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={(columnFilters.provincia || []).includes(val)}
                                    onChange={() => toggleFilterValue('provincia', val)}
                                  />
                                  <span className="truncate" title={val}>{val}</span>
                                </label>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground">No hay valores</div>
                            )}
                          </div>
                          <DropdownMenuSeparator />
                          <div className="flex items-center justify-between px-2 py-1">
                            <Button size="sm" variant="ghost" onClick={() => clearColumnFilter('provincia')}>Limpiar</Button>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'provincia')} />
                  </TableHead>
                )}
                {visibleColumns.dni && (
                  <TableHead data-col="dni" className="relative text-center w-[60px] sm:w-[100px]" style={{ width: columnWidths['dni'] ? `${columnWidths['dni']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>DNI</span>
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'dni')} />
                  </TableHead>
                )}
                {visibleColumns.courier && (
                  <TableHead data-col="courier" className="relative text-center w-[60px] sm:w-[100px]" style={{ width: columnWidths['courier'] ? `${columnWidths['courier']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Courier</span>
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'courier')} />
                  </TableHead>
                )}
                {visibleColumns.oficShalom && (
                  <TableHead data-col="oficShalom" className="relative text-center w-[60px] sm:w-[100px]" style={{ width: columnWidths['oficShalom'] ? `${columnWidths['oficShalom']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Ofic. Shalom</span>
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'oficShalom')} />
                  </TableHead>
                )}
                {visibleColumns.atendido && (
                  <TableHead data-col="atendido" className="relative text-center w-[60px] sm:w-[100px]" style={{ width: columnWidths['atendido'] ? `${columnWidths['atendido']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Atendido</span>
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'atendido')} />
                  </TableHead>
                )}
                {visibleColumns.intentoLlamada && (
                  <TableHead data-col="intentoLlamada" className="relative w-[90px] sm:w-[140px]" style={{ width: columnWidths['intentoLlamada'] ? `${columnWidths['intentoLlamada']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-center">Intento de Llamada</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'intentoLlamada')} />
                  </TableHead>
                )}
                {visibleColumns.asesor && (
                  <TableHead data-col="asesor" className="relative min-w-0 sm:min-w-[160px]" style={{ width: columnWidths['asesor'] ? `${columnWidths['asesor']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Asesor</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'asesor')} />
                  </TableHead>
                )}
                {visibleColumns.resultado && (
                  <TableHead data-col="resultado" className="relative w-[80px] sm:w-[120px]" style={{ width: columnWidths['resultado'] ? `${columnWidths['resultado']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center">Resultado</div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'resultado')} />
                  </TableHead>
                )}
                {visibleColumns.comentario && (
                  <TableHead data-col="comentario" className="relative text-center w-[90px] sm:min-w-[150px]" style={{ width: columnWidths['comentario'] ? `${columnWidths['comentario']}px` : undefined, minWidth: 2 }}>
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Comentario</span>
                    </div>
                    <div className="col-resizer" onMouseDown={(e) => startResize(e, 'comentario')} />
                  </TableHead>
                )}
                {/* acciones column intentionally removed: actions are shown as hover overlay buttons per-row */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="h-24 text-center text-muted-foreground">
                    No hay leads pendientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => {
                  const status = getCompletionStatus(lead);
                  const isEditing = editingId === lead.id;
                  const callAttempts = lead.call_status?.match(/INTENTO_(\d)/)?.[1] || '0';

                  return (
                    <TableRow key={lead.id} className="group relative hover:bg-muted/30 transition-colors">
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
                          <div
                            className="truncate"
                            title={lead.first_interaction_at ? format(new Date(lead.first_interaction_at), 'dd/MM/yyyy HH:mm', { locale: es }) : '—'}
                          >
                            {lead.first_interaction_at 
                              ? format(new Date(lead.first_interaction_at), 'dd/MM/yyyy HH:mm', { locale: es })
                              : '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.ultimaModif && (
                        <TableCell className="text-xs text-muted-foreground">
                          <div
                            className="truncate"
                            title={lead.last_updated ? format(new Date(lead.last_updated), 'dd/MM/yyyy HH:mm', { locale: es }) : '—'}
                          >
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
                              <span
                                className={cn(!isFieldComplete(lead, 'nombres') && 'text-muted-foreground')}
                                title={lead.nombres || '—'}
                              >
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
                              (() => {
                                // Prefer showing shopify_items names joined by comma when present
                                const items = (lead as any).shopify_items;
                                if (Array.isArray(items) && items.length > 0) {
                                  const names = items.map((it: any) => it.nombre || it.name || it.title).filter(Boolean);
                                  const display = names.join(', ');
                                  return <span className={cn(!isFieldComplete(lead, 'producto') && 'text-muted-foreground text-sm')} title={display || (lead.producto || '—')}>{display || (lead.producto || '—')}</span>;
                                }
                                return <span className={cn(!isFieldComplete(lead, 'producto') && 'text-muted-foreground text-sm')} title={lead.producto || '—'}>{lead.producto || '—'}</span>;
                              })()
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.celular && (
                        <TableCell>
                          <div className="truncate text-sm" title={lead.celular || '—'}>
                            {lead.celular || '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.direccion && (
                        <TableCell>
                          <div className="truncate text-sm" title={lead.direccion || '—'}>
                            {lead.direccion || '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.distrito && (
                        <TableCell>
                          <div className="truncate text-sm" title={lead.distrito || '—'}>
                            {lead.distrito || '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.email && (
                        <TableCell>
                          <div className="truncate text-sm" title={lead.email || '—'}>
                            {lead.email || '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.tienda && (
                        <TableCell>
                          {(() => {
                            const tienda = (lead as any).tienda_origen;
                            const source = (lead as any).source;
                            const display = normalizeShopName(tienda) || normalizeShopName(source) || '—';
                            const title = `${tienda || '—'}${source ? ' · ' + source : ''}`;
                            return (
                              <div className="truncate text-sm" title={title}>
                                {display}
                              </div>
                            );
                          })()}
                        </TableCell>
                      )}

                      {visibleColumns.shopifyOrderId && (
                        <TableCell>
                          <div className="truncate text-sm" title={lead.shopify_order_id || '—'}>
                            {lead.shopify_order_id || '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.itemsCount && (
                        <TableCell className="text-center">
                          <div title={String(lead.shopify_items?.length ?? 0)}>
                            {lead.shopify_items ? lead.shopify_items.length : '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.itemsSummary && (
                        <TableCell>
                          <div className="truncate text-sm" title={Array.isArray(lead.shopify_items) ? lead.shopify_items.map((i: any) => i.nombre || i.name || i.title).join(', ') : '—'}>
                            {Array.isArray(lead.shopify_items) ? lead.shopify_items.map((i: any) => i.nombre || i.name || i.title).slice(0,3).join(', ') + (lead.shopify_items.length > 3 ? '…' : '') : '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.totalPrice && (
                        <TableCell className="text-right">
                          <div className="truncate" title={String(lead.shopify_payment_details?.total_price ?? '—')}>
                            {lead.shopify_payment_details?.total_price ? `S/ ${lead.shopify_payment_details.total_price}` : '—'}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.confirmedAt && (
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="truncate" title={lead.confirmed_at ? format(new Date(lead.confirmed_at), 'dd/MM/yyyy HH:mm', { locale: es }) : '—'}>
                            {lead.confirmed_at ? format(new Date(lead.confirmed_at), 'dd/MM/yyyy HH:mm', { locale: es }) : '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.visto && (
                        <TableCell className="text-center">
                          <div title={
                            lead.visto_por && (typeof lead.visto_por === 'string' ? lead.visto_por : (lead.visto_por.name || JSON.stringify(lead.visto_por)))
                          || '—'}>
                            {lead.visto_por ? (typeof lead.visto_por === 'string' ? lead.visto_por : (lead.visto_por.name || 'Sí')) : '—'}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.estatusLead && (
                        <TableCell>
                          {isEditing ? (
                            <Select value={String(editForm.call_status || '')} onValueChange={(val) => setEditForm({ ...editForm, call_status: val as any })}>
                              <SelectTrigger className="h-8 w-40 text-sm">
                                <SelectValue placeholder={lead.call_status?.replace(/_/g, ' ') || 'NUEVO'} />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Friendly options mapped to internal CallStatus values */}
                                <SelectItem value="NUEVO">Nuevo</SelectItem>
                                <SelectItem value="CONTACTADO">Contactado</SelectItem>
                                <SelectItem value="VISTO">Visto</SelectItem>
                                <SelectItem value="VENTA_CONFIRMADA">Confirmado</SelectItem>
                                <SelectItem value="NO_CONTESTA">No contesta</SelectItem>
                                <SelectItem value="LEAD_PERDIDO">Perdido</SelectItem>
                                <SelectItem value="HIBERNACION">Hibernación</SelectItem>
                                <SelectItem value="INTENTO_1">Intento 1</SelectItem>
                                <SelectItem value="INTENTO_2">Intento 2</SelectItem>
                                <SelectItem value="INTENTO_3">Intento 3</SelectItem>
                                <SelectItem value="INTENTO_4">Intento 4</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
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
                          )}
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
                              <span
                                className={cn(!isFieldComplete(lead, 'provincia') && 'text-muted-foreground')}
                                title={lead.provincia || '—'}
                              >
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
                            <span
                              className={cn(
                                !isFieldComplete(lead, 'dni') && 'text-orange-500 font-semibold',
                                isFieldComplete(lead, 'dni') && 'text-foreground'
                              )}
                              title={lead.dni || '⚠'}
                            >
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
                                <span className="text-sm truncate" title={lead.assigned_agent_name}>{lead.assigned_agent_name}</span>
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
                              <Textarea
                                value={editForm.notas_agente || ''}
                                onChange={(e) => setEditForm({ ...editForm, notas_agente: e.target.value })}
                                className="w-full"
                                placeholder="Comentario..."
                                rows={2}
                              />
                              ) : (
                              <span
                                className={cn(
                                  !isFieldComplete(lead, 'notas_agente') && 'text-orange-500 font-semibold',
                                  isFieldComplete(lead, 'notas_agente') && 'text-sm'
                                )}
                                title={lead.notas_agente || '⚠'}
                              >
                                {lead.notas_agente || '⚠'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {/* Actions overlay: appears on row hover (not a table column) */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent sideOffset={6} align="end" className="w-44 bg-popover shadow-md rounded-md border">
                                <DropdownMenuItem onClick={() => handleInlineEdit(lead)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Editar rápido
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDialog(lead)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Editar (formulario)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onProcessLead(lead)}>
                                  <Phone className="mr-2 h-4 w-4" />
                                  Procesar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                              {/* quick action buttons removed: use the 3-dot menu to pick actions */}
                          </>
                        )}
                      </div>
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

            <div className="space-y-2 w-full">
              <Label htmlFor="dialog-call-status">Estado del Lead</Label>
              <Select value={String(editForm.call_status || '')} onValueChange={(val) => setEditForm({ ...editForm, call_status: val as any })}>
                <SelectTrigger id="dialog-call-status" className="h-8 w-full text-sm">
                  <SelectValue placeholder={String(editForm.call_status?.replace(/_/g, ' ') || 'NUEVO')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NUEVO">Nuevo</SelectItem>
                  <SelectItem value="CONTACTADO">Contactado</SelectItem>
                                <SelectItem value="VISTO">Visto</SelectItem>
                  <SelectItem value="VENTA_CONFIRMADA">Confirmado</SelectItem>
                  <SelectItem value="NO_CONTESTA">No contesta</SelectItem>
                  <SelectItem value="LEAD_PERDIDO">Perdido</SelectItem>
                  <SelectItem value="HIBERNACION">Hibernación</SelectItem>
                  <SelectItem value="INTENTO_1">Intento 1</SelectItem>
                  <SelectItem value="INTENTO_2">Intento 2</SelectItem>
                  <SelectItem value="INTENTO_3">Intento 3</SelectItem>
                  <SelectItem value="INTENTO_4">Intento 4</SelectItem>
                </SelectContent>
              </Select>
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