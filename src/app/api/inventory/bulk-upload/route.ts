
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import * as xlsx from 'xlsx';
import type { InventoryItem } from '@/lib/types';
import { SHOPS } from '@/lib/constants';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        
        const sheetName = 'Inventario';
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            return NextResponse.json({ message: `La hoja de cálculo debe llamarse "${sheetName}".` }, { status: 400 });
        }
        
        const data: any[] = xlsx.utils.sheet_to_json(worksheet);
        
        const db = getAdminDb();
        const batch = db.batch();
        let createdCount = 0;
        let updatedCount = 0;

        for (const row of data) {
            const sku = row.sku?.toString().trim();
            if (!sku) {
                // Now we stop and inform the user if a SKU is missing.
                return NextResponse.json({ message: `Se encontró una fila sin SKU. Todas las filas deben tener un SKU único. Fila problemática: ${JSON.stringify(row)}` }, { status: 400 });
            }

            const inventoryRef = db.collection('inventory').doc(sku);
            const docSnap = await inventoryRef.get();

            const itemData: Partial<InventoryItem> & { 'precios.compra'?: number; 'precios.venta'?: number; 'proveedor.nombre'?: string } = {
                sku,
                nombre: row.nombre?.toString() || 'Nombre no especificado',
                descripcion: row.descripcion?.toString() || '',
                stock_actual: Number(row.stock_actual) || 0,
                stock_minimo: Number(row.stock_minimo) || 0,
                precios: {
                    compra: Number(row['precios.compra']) || 0,
                    venta: Number(row['precios.venta']) || 0,
                },
                tienda: SHOPS.includes(row.tienda) ? row.tienda : SHOPS[0],
                proveedor: {
                    id_proveedor: 'N/A', // We can't know the ID from just the name
                    nombre: row['proveedor.nombre']?.toString() || 'N/A',
                },
                ubicacion_almacen: row.ubicacion_almacen?.toString() || '',
            };

            if (docSnap.exists) {
                // Update existing document
                batch.update(inventoryRef, itemData);
                updatedCount++;
            } else {
                // Create new document with default fields
                const newItem: InventoryItem = {
                    id_producto_base: `P-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    estado: 'ACTIVO',
                    variantes: [],
                    historial_stock: [],
                    ...itemData,
                } as InventoryItem;
                batch.set(inventoryRef, newItem);
                createdCount++;
            }
        }

        await batch.commit();

        return NextResponse.json({ 
            success: true, 
            message: 'Inventario importado exitosamente.',
            created: createdCount,
            updated: updatedCount,
        });

    } catch (error) {
        console.error('Error processing bulk upload:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        return NextResponse.json({ message: 'Error interno del servidor.', error: errorMessage }, { status: 500 });
    }
}
