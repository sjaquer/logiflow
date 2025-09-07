
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import type { Order, User, InventoryItem, PaymentMethod, Shop, Courier, OrderStatus, PaymentStatus } from '@/lib/types';

const db = getAdminDb();

// --- Schemas for incoming data from external sources (like Landing Pages) ---

const ClientSchema = z.object({
  dni: z.string().min(8, 'El DNI es requerido y debe tener 8 dígitos.'),
  nombres: z.string().min(1, 'El nombre es requerido.'),
  celular: z.string().optional(),
  email: z.string().email('Email inválido.').optional(),
  direccion: z.string().optional(),
  distrito: z.string().optional(),
  provincia: z.string().optional(),
  source: z.string().default('landing-page'),
});

const InventorySchema = z.object({
    sku: z.string().min(1, "SKU es requerido"),
    nombre: z.string().min(1, "Nombre es requerido"),
    stock_actual: z.number().default(0),
    precios: z.object({
        compra: z.number().default(0),
        venta: z.number().default(0),
    }),
    tienda: z.string().min(1, "Tienda requerida"),
    proveedor: z.object({
        id_proveedor: z.string().optional().default('N/A'),
        nombre: z.string().optional().default('N/A'),
    }).optional(),
    ubicacion_almacen: z.string().optional().default(''),
    estado: z.enum(['ACTIVO', 'DESCONTINUADO', 'SIN_STOCK']).default('ACTIVO'),
    stock_minimo: z.number().default(5),
});

const OrderSchema = z.object({
    tienda: z.object({
        id_tienda: z.string(),
        nombre: z.custom<Shop>(),
    }),
    cliente: z.object({
        nombres: z.string(),
        dni: z.string().nullable(),
        celular: z.string(),
    }),
    items: z.array(z.object({
        sku: z.string(),
        nombre: z.string(),
        cantidad: z.number().min(1),
        precio_unitario: z.number(),
        subtotal: z.number(),
        estado_item: z.enum(['CONFIRMADO', 'SIN_STOCK', 'BACKORDER', 'PENDIENTE']).default('PENDIENTE'),
    })).min(1, 'El pedido debe tener al menos un ítem.'),
    pago: z.object({
        monto_total: z.number(),
        estado_pago: z.custom<PaymentStatus>().default('PENDIENTE'),
        metodo_pago_previsto: z.custom<PaymentMethod>(),
    }),
    envio: z.object({
        direccion: z.string(),
        distrito: z.string(),
        provincia: z.string(),
        courier: z.custom<Courier>(),
        costo_envio: z.number(),
    }),
});

const IngestionRequestSchema = z.object({
  collection: z.enum(['clients', 'inventory', 'orders']),
  payload: z.any(),
});


/**
 * API Endpoint for external data ingestion (e.g., from Landing Pages).
 * This endpoint is the public "mailbox" for your application.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.split('Bearer ')[1];

  if (!apiKey || apiKey !== process.env.MAKE_API_KEY) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedRequest = IngestionRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json({ message: 'La solicitud no tiene el formato correcto (collection, payload)', errors: parsedRequest.error.flatten() }, { status: 400 });
    }

    const { collection, payload } = parsedRequest.data;

    let docId: string | undefined = undefined;
    let dataToSave: any;

    switch (collection) {
      case 'clients':
        const parsedClient = ClientSchema.parse(payload);
        docId = parsedClient.dni;
        dataToSave = parsedClient;
        break;
      
      case 'inventory':
        const parsedInventory = InventorySchema.parse(payload);
        docId = parsedInventory.sku;
        dataToSave = parsedInventory;
        break;

      case 'orders':
        const parsedOrder = OrderSchema.parse(payload);
        
        dataToSave = {
            ...parsedOrder,
            id_interno: `EXT-${Date.now()}`,
            estado_actual: 'PENDIENTE' as OrderStatus,
            pago: {
                ...parsedOrder.pago,
                monto_pendiente: parsedOrder.pago.estado_pago === 'PENDIENTE' ? parsedOrder.pago.monto_total : 0,
                comprobante_url: null,
                fecha_pago: parsedOrder.pago.estado_pago === 'PAGADO' ? new Date().toISOString() : null,
            },
            envio: {
                ...parsedOrder.envio,
                tipo: parsedOrder.envio.provincia.toLowerCase() === 'lima' ? 'LIMA' : 'PROVINCIA',
                nro_guia: null,
                link_seguimiento: null,
            },
            asignacion: {
                id_usuario_actual: 'system_landing_page',
                nombre_usuario_actual: 'Sistema (Landing Page)',
            },
            historial: [{
                fecha: new Date().toISOString(),
                id_usuario: 'system_landing_page',
                nombre_usuario: 'Sistema (Landing Page)',
                accion: 'Creación de Pedido',
                detalle: 'Pedido creado desde servicio externo (LP).'
            }],
            fechas_clave: {
                creacion: new Date().toISOString(),
                preparacion: null,
                despacho: null,
                entrega_estimada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                entrega_real: null,
                anulacion: null,
            },
            notas: {
                nota_pedido: '',
                observaciones_internas: 'Ingresado vía API desde LP.',
                motivo_anulacion: null,
            }
        } as Omit<Order, 'id_pedido'>;
        break;
        
      default:
        return NextResponse.json({ message: 'Colección no soportada' }, { status: 400 });
    }

    const docRef = docId ? db.collection(collection).doc(docId) : db.collection(collection).doc();
    
    if (collection === 'orders') {
        dataToSave.id_pedido = docRef.id;
    }

    await docRef.set(dataToSave, { merge: true });

    console.log(`Datos guardados en ${collection} con ID: ${docRef.id}`);
    
    return NextResponse.json({ success: true, message: `Datos guardados en '${collection}'.`, id: docRef.id }, { status: 201 });

  } catch (error) {
    console.error(`Error procesando la solicitud de ingesta:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Error de validación en el payload", errors: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
