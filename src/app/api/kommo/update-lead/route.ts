
import { NextResponse } from 'next/server';
import { updateLead } from '@/lib/kommo';
import type { Order } from '@/lib/types';

// Define field IDs from your Kommo account
const KOMMO_FIELD_IDS = {
    PEDIDO: 985570,
    DIRECCION: 630092,
    PRODUCTO: 630096,
    TIENDA: 1002512,
    PROVINCIA: 630094,
    COURIER: 630104,
    MONTO_PENDIENTE: 1002220,
    NOTA: 630108,
    LINK_SHALOM: 1002224,
    BOLETA_SHALOM: 1002226,
};

const KOMMO_PIPELINE_ID_VENTA_CONFIRMADA = 79547911; // Example ID for "Venta Confirmada" pipeline status

export async function POST(request: Request) {
    try {
        const { order }: { order: Order } = await request.json();

        if (!order || !order.kommo_lead_id) {
            return NextResponse.json({ message: 'Kommo Lead ID or Order data is missing.' }, { status: 400 });
        }
        
        const custom_fields_values = [
            { field_id: KOMMO_FIELD_IDS.PEDIDO, values: [{ value: order.id_pedido }] },
            { field_id: KOMMO_FIELD_IDS.DIRECCION, values: [{ value: order.envio.direccion }] },
            { field_id: KOMMO_FIELD_IDS.PRODUCTO, values: [{ value: order.items.map(item => `${item.cantidad}x ${item.nombre}`).join(', ') }] },
            { field_id: KOMMO_FIELD_IDS.TIENDA, values: [{ value: order.tienda.nombre }] },
            { field_id: KOMMO_FIELD_IDS.PROVINCIA, values: [{ value: order.envio.provincia }] },
            { field_id: KOMMO_FIELD_IDS.COURIER, values: [{ value: order.envio.courier }] },
            { field_id: KOMMO_FIELD_IDS.MONTO_PENDIENTE, values: [{ value: order.pago.monto_pendiente }] },
            { field_id: KOMMO_FIELD_IDS.NOTA, values: [{ value: order.notas.nota_pedido }] },
            { field_id: KOMMO_FIELD_IDS.LINK_SHALOM, values: [{ value: order.envio.link_seguimiento }] },
            { field_id: KOMMO_FIELD_IDS.BOLETA_SHALOM, values: [{ value: order.envio.nro_guia }] },
        ].filter(field => field.values[0].value); // Filter out fields with no value

        const updatePayload = {
            id: parseInt(order.kommo_lead_id, 10),
            price: order.pago.monto_total,
            status_id: KOMMO_PIPELINE_ID_VENTA_CONFIRMADA,
            custom_fields_values,
             _embedded: {
                tags: [
                    { name: "Venta Confirmada LogiFlow" }
                ]
            }
        };

        const result = await updateLead(order.kommo_lead_id, updatePayload);

        if (result) {
            return NextResponse.json({ success: true, message: 'Lead updated in Kommo.', data: result });
        } else {
            return NextResponse.json({ success: false, message: 'Failed to update lead in Kommo.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error in /api/kommo/update-lead:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
