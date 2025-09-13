import type { Order, InventoryItem, User, Client } from '@/lib/types';
import { z } from 'zod';

export type { Client };

export type CreateOrderFormValues = {
    tienda?: Order['tienda']['nombre'];
    cliente: {
        id?: string; // Client document ID
        dni: string;
        nombres: string;
        celular: string;
        email?: string;
    };
    items: Order['items'];
    pago: {
        subtotal: number;
        monto_total: number;
        metodo_pago_previsto?: Order['pago']['metodo_pago_previsto'];
    };
    envio: {
        direccion: string;
        distrito: string;
        provincia: string;
        courier?: Order['envio']['courier'];
        agencia_shalom?: string | null;
        costo_envio: number;
    };
    notas: {
        nota_pedido?: string;
    }
};
