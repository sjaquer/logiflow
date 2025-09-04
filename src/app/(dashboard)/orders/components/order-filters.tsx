'use client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar as CalendarIcon, ChevronDown, Filter, X } from 'lucide-react';
import type { User, Filters } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { KANBAN_COLUMNS, SHOPS, COURIERS, PAYMENT_METHODS } from '@/lib/constants';

interface OrderFiltersProps {
  users: User[];
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  orderCount: number;
}

export function OrderFilters({ users, filters, onFilterChange, orderCount }: OrderFiltersProps) {
  
  const handleMultiSelectChange = <K extends keyof Filters>(filterKey: K, value: Filters[K][number]) => {
    const currentValues = filters[filterKey] as (typeof value)[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    onFilterChange({ ...filters, [filterKey]: newValues });
  };
  
  const clearFilters = () => {
    onFilterChange({
      shops: [], assignedUserIds: [], statuses: [], paymentMethods: [], couriers: [], dateRange: {}
    });
  };
  
  const hasActiveFilters = Object.values(filters).some(val => Array.isArray(val) ? val.length > 0 : val.from || val.to);

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 md:px-6 lg:px-8 border-b bg-card">
      <Filter className="w-5 h-5 text-muted-foreground" />
      <span className="font-semibold text-sm">Filtros:</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-2">Tienda <ChevronDown className="ml-2 h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            {SHOPS.map(shop => (
                <DropdownMenuCheckboxItem key={shop} checked={filters.shops.includes(shop)} onCheckedChange={() => handleMultiSelectChange('shops', shop)}>
                    {shop}
                </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">Responsable <ChevronDown className="ml-2 h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            {users.map(user => (
                <DropdownMenuCheckboxItem key={user.id_usuario} checked={filters.assignedUserIds.includes(user.id_usuario)} onCheckedChange={() => handleMultiSelectChange('assignedUserIds', user.id_usuario)}>
                    {user.nombre}
                </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">Estado <ChevronDown className="ml-2 h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            {KANBAN_COLUMNS.map(col => (
                <DropdownMenuCheckboxItem key={col.id} checked={filters.statuses.includes(col.id)} onCheckedChange={() => handleMultiSelectChange('statuses', col.id)}>
                    {col.title}
                </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">Courier <ChevronDown className="ml-2 h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            {COURIERS.map(courier => (
                <DropdownMenuCheckboxItem key={courier} checked={filters.couriers.includes(courier)} onCheckedChange={() => handleMultiSelectChange('couriers', courier)}>
                    {courier}
                </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">Pago <ChevronDown className="ml-2 h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            {PAYMENT_METHODS.map(method => (
                <DropdownMenuCheckboxItem key={method} checked={filters.paymentMethods.includes(method)} onCheckedChange={() => handleMultiSelectChange('paymentMethods', method)}>
                    {method}
                </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            size="sm"
            className={cn(
              "w-auto justify-start text-left font-normal",
              !filters.dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(filters.dateRange.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(filters.dateRange.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>Elige una fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            locale={es}
            mode="range"
            selected={{from: filters.dateRange.from, to: filters.dateRange.to}}
            onSelect={(range) => onFilterChange({...filters, dateRange: {from: range?.from, to: range?.to}})}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Limpiar</Button>}

      <div className="ml-auto text-sm text-muted-foreground">
        Mostrando <span className="font-semibold text-foreground">{orderCount}</span> pedidos
      </div>
    </div>
  );
}
