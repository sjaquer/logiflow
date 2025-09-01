// src/app/api/webhooks/kommo/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebase-admin';
import type { Order, OrderStatus, PaymentStatus, PaymentMethod, ShippingType, Courier, Shop } from '@/lib/types';

/**
 * Transforms the incoming Kommo webhook data into our Order format.
 * NOTE: This is a placeholder. The mapping needs to be defined based on
 * the actual data structure received from Kommo.
 * @param kommoData - The data received from the Kommo webhook.
 * @returns A partial Order object.
 */
function transformKommoToOrder(kommoData: any): Partial<Order> {
  // =======================================================================
  // TODO: Define the mapping from Kommo data to Order fields here.
  // This is a placeholder structure and needs to be adapted.
  // The fields from Kommo might be in `kommoData.leads.add[0]` or similar.
  // =======================================================================

  const lead = kommoData?.leads?.add?.[0] || kommoData?.leads?.status?.[0] || {};
  const contact = kommoData?.contacts?.add?.[0] || kommoData?.contacts?.update?.[0] || {};
  
  // Placeholder logic - replace with actual field mapping
  const customerName = contact?.name || 'Cliente de Kommo';
  const customerPhone = contact?.custom_fields?.find((f: any) => f.name === 'Phone')?.values?.[0]?.value || '999999999';
  const totalAmount = parseFloat(lead?.price || '0');

  const transformedOrder: Partial<Order> = {
    tienda: { id_tienda: 'KOMMO-01', nombre: 'Marketplace' },
    estado_actual: 'PENDIENTE',
    cliente: {
      id_cliente: contact?.id || `KOMMO-${Date.now()}`,
      nombres: customerName,
      dni: null,
      celular: customerPhone,
    },
    pago: {
      monto_total: totalAmount,
      monto_pendiente: totalAmount,
      metodo_pago_previsto: 'Transferencia Bancaria', // Default or map from Kommo
      estado_pago: 'PENDIENTE',
      comprobante_url: null,
      fecha_pago: null,
    },
    envio: {
      tipo: 'LIMA', // Default or map from Kommo
      provincia: 'Lima', // Default or map from Kommo
      direccion: 'Dirección a definir', // Default or map from Kommo
      courier: 'INTERNO', // Default or map from Kommo
      agencia_shalom: null,
      nro_guia: null,
      link_seguimiento: null,
      costo_envio: 0, // Default or map from Kommo
    },
    notas: {
        nota_pedido: `Pedido creado desde Kommo. Lead ID: ${lead?.id || 'N/A'}`,
        observaciones_internas: '',
        motivo_anulacion: null,
    }
  };

  return transformedOrder;
}


export async function POST(request: Request) {
  try {
    const kommoData = await request.json();
    console.log('Received Kommo Webhook Data:', JSON.stringify(kommoData, null, 2));

    const partialOrder = transformKommoToOrder(kommoData);
    
    if (!partialOrder.cliente?.id_cliente) {
        return NextResponse.json({ message: 'No valid lead or contact data found in payload.' }, { status: 400 });
    }

    const ordersCollection = adminDb.collection('orders');
    const orderCountSnapshot = await ordersCollection.count().get();
    const orderCount = orderCountSnapshot.data().count;

    const newOrderId = `PED-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, '0')}`;
    const firstUser = (await adminDb.collection('users').limit(1).get()).docs[0]?.data();

    const newOrder: Omit<Order, 'id_pedido'> & { id_pedido?: string } = {
      id_interno: `INT-${String(orderCount + 1).padStart(5, '0')}`,
      ...partialOrder,
      items: [], // Kommo webhook might not contain items, handle this separately
      asignacion: {
        id_usuario_actual: firstUser?.id_usuario || 'default_user',
        nombre_usuario_actual: firstUser?.nombre || 'Sistema',
      },
      historial: [{
          fecha: new Date().toISOString(),
          id_usuario: 'SYSTEM_KOMMO',
          nombre_usuario: 'Kommo Webhook',
          accion: 'Creación de Pedido',
          detalle: 'Pedido creado automáticamente desde Kommo.'
      }],
      fechas_clave: {
          creacion: new Date().toISOString(),
          preparacion: null,
          despacho: null,
          entrega_estimada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Estimate 3 days
          entrega_real: null,
          anulacion: null,
      },
    };

    const orderRef = ordersCollection.doc(newOrderId);
    await orderRef.set(newOrder);

    console.log(`Successfully created order ${newOrderId} from Kommo lead.`);

    return NextResponse.json({
      message: 'Webhook received and order created successfully.',
      orderId: newOrderId,
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing Kommo webhook:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
