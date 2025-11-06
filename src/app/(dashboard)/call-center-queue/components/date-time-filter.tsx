/**
 * Componente de filtro de fecha y hora mejorado
 * Combina filtrado por fecha y hora en una interfaz intuitiva con dropdown
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DateTimeFilterProps {
  columnKey: string;
  columnLabel: string;
  currentDateFilter?: { from?: string; to?: string };
  currentTimeFilter?: { from?: string; to?: string };
  onApply: (dateFilter?: { from?: string; to?: string }, timeFilter?: { from?: string; to?: string }) => void;
  onClear: () => void;
}

export function DateTimeFilter({
  columnKey,
  columnLabel,
  currentDateFilter,
  currentTimeFilter,
  onApply,
  onClear
}: DateTimeFilterProps) {
  const [dateFrom, setDateFrom] = useState(currentDateFilter?.from || '');
  const [dateTo, setDateTo] = useState(currentDateFilter?.to || '');
  const [timeFrom, setTimeFrom] = useState(currentTimeFilter?.from || '');
  const [timeTo, setTimeTo] = useState(currentTimeFilter?.to || '');
  const [filterMode, setFilterMode] = useState<'date' | 'time' | 'both'>('date');

  const hasActiveFilter = !!(currentDateFilter?.from || currentDateFilter?.to || currentTimeFilter?.from || currentTimeFilter?.to);

  const handleApply = () => {
    const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined;
    const timeFilter = (timeFrom || timeTo) ? { from: timeFrom, to: timeTo } : undefined;
    onApply(dateFilter, timeFilter);
  };

  const handleClearAll = () => {
    setDateFrom('');
    setDateTo('');
    setTimeFrom('');
    setTimeTo('');
    onClear();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-6 w-6 p-0 relative", hasActiveFilter && "text-primary")}
        >
          <Filter className="h-3 w-3" />
          {hasActiveFilter && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={4} className="w-72 bg-popover shadow-md rounded-md border p-0">
        {/* Tabs */}
        <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none">
            <TabsTrigger value="date" className="text-xs rounded-none">
              Fecha
            </TabsTrigger>
            <TabsTrigger value="time" className="text-xs rounded-none">
              Hora
            </TabsTrigger>
            <TabsTrigger value="both" className="text-xs rounded-none">
              Ambos
            </TabsTrigger>
          </TabsList>

          {/* Date Filter */}
          <TabsContent value="date" className="p-3 space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`${columnKey}-date-from`} className="text-xs">
                Desde (fecha)
              </Label>
              <Input
                id={`${columnKey}-date-from`}
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${columnKey}-date-to`} className="text-xs">
                Hasta (fecha)
              </Label>
              <Input
                id={`${columnKey}-date-to`}
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm"
              />
            </div>
          </TabsContent>

          {/* Time Filter */}
          <TabsContent value="time" className="p-3 space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`${columnKey}-time-from`} className="text-xs">
                Desde (hora del día)
              </Label>
              <Input
                id={`${columnKey}-time-from`}
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${columnKey}-time-to`} className="text-xs">
                Hasta (hora del día)
              </Label>
              <Input
                id={`${columnKey}-time-to`}
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                className="text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Filtra por hora del día, independiente de la fecha
            </p>
          </TabsContent>

          {/* Both Filters */}
          <TabsContent value="both" className="p-3 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Rango de Fecha</Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Desde"
                  className="text-sm"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Hasta"
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="h-px bg-border my-2" />
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Rango de Hora</Label>
              <div className="space-y-2">
                <Input
                  type="time"
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  placeholder="Desde"
                  className="text-sm"
                />
                <Input
                  type="time"
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  placeholder="Hasta"
                  className="text-sm"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <DropdownMenuSeparator />
        <div className="p-2 flex justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Limpiar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleApply}
            className="text-xs"
          >
            Aplicar
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
