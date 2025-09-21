
import { NextResponse } from 'next/server';
import { updateLead, searchLeads } from '@/lib/kommo';
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

// This should be the ID of the status "Venta Confirmada" inside your pipeline
const KOMMO_STATUS_ID_VENTA_CONFIRMADA = 79547911; 

export async function POST(request: Request) {
    console.log('[LOGIFLOW_DEBUG] --- /api/kommo/update-lead endpoint hit ---');
    try {
        const { order }: { order: Order } = await request.json();

        if (!order) {
            console.error("[LOGIFLOW_DEBUG] API Error: Order data is missing from the request body.");
            return NextResponse.json({ message: 'Order data is missing.' }, { status: 400 });
        }
        
        console.log('[LOGIFLOW_DEBUG] Received order payload:', JSON.stringify(order, null, 2));

        let leadIdToUpdate = order.kommo_lead_id;

        // If kommo_lead_id is missing, try to find it by shopify_order_id
        if (!leadIdToUpdate && order.shopify_order_id) {
            const searchQuery = `#${order.shopify_order_id}`;
            console.log(`[LOGIFLOW_DEBUG] kommo_lead_id not found. Searching for Kommo lead with name: "${searchQuery}"`);
            
            const searchResult = await searchLeads(searchQuery);
            
            if (searchResult && searchResult._embedded?.leads?.length > 0) {
                const foundLead = searchResult._embedded.leads.find((lead: any) => lead.name.includes(searchQuery));
                 if (foundLead) {
                    leadIdToUpdate = foundLead.id.toString();
                    console.log(`[LOGIFLOW_DEBUG] Found Kommo lead ID: ${leadIdToUpdate} by searching for Shopify order.`);
                }
            }
             if (!leadIdToUpdate) {
                console.warn(`[LOGIFLOW_DEBUG] Could not find a Kommo lead matching Shopify order: ${searchQuery}`);
                return NextResponse.json({ success: false, message: `Could not find a Kommo lead for Shopify order ${searchQuery}.` }, { status: 404 });
            }
        }
        
        if (!leadIdToUpdate) {
            console.warn("[LOGIFLOW_DEBUG] API Warning: Lead ID is missing and could not be found. Aborting Kommo update.");
            return NextResponse.json({ success: false, message: 'Lead ID is missing and could not be found.' }, { status: 400 });
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
            id: parseInt(leadIdToUpdate, 10),
            price: order.pago.monto_total,
            status_id: KOMMO_STATUS_ID_VENTA_CONFIRMADA,
            custom_fields_values,
             _embedded: {
                tags: [
                    { name: "Venta Confirmada LogiFlow" }
                ]
            }
        };

        console.log(`[LOGIFLOW_DEBUG] Attempting to update Kommo lead ID: ${leadIdToUpdate} with payload:`, JSON.stringify(updatePayload, null, 2));
        const result = await updateLead(leadIdToUpdate, updatePayload);

        if (result) {
            console.log(`[LOGIFLOW_DEBUG] Successfully updated Kommo lead ID: ${leadIdToUpdate}`);
            return NextResponse.json({ success: true, message: 'Lead updated in Kommo.', data: result });
        } else {
            console.error(`[LOGIFLOW_DEBUG] Failed to update Kommo lead ID: ${leadIdToUpdate}`);
            return NextResponse.json({ success: false, message: 'Failed to update lead in Kommo.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[LOGIFLOW_DEBUG] CRITICAL ERROR in /api/kommo/update-lead:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
