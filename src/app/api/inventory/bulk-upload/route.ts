
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import * as formidable from 'formidable';
import * as fs from 'fs';
import * as xlsx from 'xlsx';
import type { InventoryItem } from '@/lib/types';
import { SHOPS } from '@/lib/constants';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: Request): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({});
        form.parse(req as any, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
};

export async function POST(request: Request) {
    try {
        const { files } = await parseForm(request);
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }

        const buffer = fs.readFileSync(file.filepath);
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
                console.warn('Row skipped: SKU is missing.', row);
                continue;
            }

            const inventoryRef = db.collection('inventory').doc(sku);
            const doc = await inventoryRef.get();

            const itemData: Partial<InventoryItem> = {
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
                    id_proveedor: row['proveedor.id_proveedor']?.toString() || 'N/A',
                    nombre: row['proveedor.nombre']?.toString() || 'N/A',
                },
                ubicacion_almacen: row.ubicacion_almacen?.toString() || '',
            };

            if (doc.exists) {
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
        return NextResponse.json({ message: 'Error interno del servidor.', error: (error as Error).message }, { status: 500 });
    }
}
