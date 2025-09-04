import type { Order, InventoryItem, User } from '@/lib/types';
import { z } from 'zod';

export type CreateOrderFormValues = {
    tienda: Order['tienda']['nombre'];
    cliente: {
        dni: string;
        nombres: string;
        celular: string;
    };
    items: Order['items'];
    pago: {
        subtotal: number;
        monto_total: number;
        metodo_pago_previsto: Order['pago']['metodo_pago_previsto'];
    };
    envio: {
        direccion: string;
        distrito: string;
        provincia: string;
        courier: Order['envio']['courier'];
        agencia_shalom?: string | null;
        costo_envio: number;
    };
    notas: {
        nota_pedido?: string;
    }
};

export interface Client {
    id: string;
    dni: string;
    nombres: string;
    celular: string;
    direccion: string;
    distrito: string;
    provincia: string;
}
