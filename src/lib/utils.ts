import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Order, Filters, Client } from './types';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function filterOrders(orders: Order[], filters: Filters): Order[] {
  if (!orders) {
    return [];
  }
  return orders.filter(order => {
      const { shops, assignedUserIds, statuses, paymentMethods, couriers, dateRange } = filters;
      const orderDate = new Date(order.fechas_clave.creacion);

      if (shops.length > 0 && !shops.includes(order.tienda.nombre)) return false;
      if (assignedUserIds.length > 0 && !assignedUserIds.includes(order.asignacion.id_usuario_actual)) return false;
      if (statuses.length > 0 && !statuses.includes(order.estado_actual)) return false;
      if (paymentMethods.length > 0 && !paymentMethods.includes(order.pago.metodo_pago_previsto)) return false;
      if (couriers.length > 0 && !couriers.includes(order.envio.courier)) return false;
      if (dateRange.from && orderDate < dateRange.from) return false;
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Include the whole day
        if (orderDate > toDate) return false;
      }
      return true;
    });
}

/**
 * Calculates the completion progress of a lead based on key fields.
 * @param lead The client lead object.
 * @returns A percentage from 0 to 100.
 */
export function calculateLeadProgress(lead: Client): number {
  const fields = [
    lead.nombres,
    lead.celular,
    lead.dni,
    lead.direccion,
    lead.distrito,
    lead.provincia,
  ];
  
  const totalFields = fields.length;
  const completedFields = fields.filter(field => field && field.trim() !== '').length;
  
  if (totalFields === 0) {
    return 0;
  }
  
  const progress = (completedFields / totalFields) * 100;
  return Math.round(progress);
}
