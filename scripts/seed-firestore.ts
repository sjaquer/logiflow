// tsx -r dotenv/config --tsconfig tsconfig.scripts.json scripts/seed-firestore.ts
import 'dotenv/config';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { users, inventory, orders } from '../src/lib/data';
import type { Order, OrderItem, User } from '../src/lib/types';

// Check for required environment variables
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  console.log('Please create a .env.local file in the root directory and add:');
  console.log('GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json');
  process.exit(1);
}

// Initialize Firebase Admin SDK
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
} catch (error: any) {
     if (error.code !== 'app/duplicate-app') {
        console.error('Firebase Admin initialization error:', error);
        process.exit(1);
    }
}


const db = getFirestore();
const auth = getAuth();

const BATCH_LIMIT = 500; // Firestore batch limit

async function seedCollection<T extends { [key: string]: any }>(
  collectionName: string,
  data: T[],
  idField?: keyof T
) {
  console.log(`\nSeeding ${collectionName}...`);
  const collectionRef = db.collection(collectionName);
  let batch = db.batch();
  let count = 0;

  // Clear existing documents
  const snapshot = await collectionRef.get();
  if (!snapshot.empty) {
    console.log(`Deleting ${snapshot.size} existing documents from ${collectionName}...`);
    const deleteBatch = db.batch();
    snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log(`Deletion complete.`);
  }

  for (const item of data) {
    const docId = idField ? String(item[idField]) : undefined;
    const docRef = docId ? collectionRef.doc(docId) : collectionRef.doc();
    batch.set(docRef, item);
    count++;
    if (count % BATCH_LIMIT === 0) {
      console.log(`Committing batch of ${BATCH_LIMIT} documents to ${collectionName}...`);
      await batch.commit();
      batch = db.batch();
    }
  }

  if (count % BATCH_LIMIT !== 0) {
    console.log(`Committing final batch of ${count % BATCH_LIMIT} documents to ${collectionName}...`);
    await batch.commit();
  }

  console.log(`✅ Seeded ${count} documents into ${collectionName}.`);
}

async function seedUsers() {
    console.log(`\nSeeding Users and creating auth entries...`);
    const userIds: string[] = [];

    // Separate admin user from others
    const adminData = users.find(u => u.email === 'sjaquer@outlook.es');
    const otherUsersData = users.filter(u => u.email !== 'sjaquer@outlook.es');

    if (adminData) {
        try {
            console.log(`Looking for existing admin user: ${adminData.email}...`);
            const adminUserRecord = await auth.getUserByEmail(adminData.email);
            console.log(`Found existing admin user: ${adminUserRecord.uid}`);
            const adminDoc: User = { ...adminData, id_usuario: adminUserRecord.uid };
            await db.collection('users').doc(adminDoc.email).set(adminDoc);
            userIds.push(adminUserRecord.uid);
            console.log(`Updated admin user ${adminData.email} in Firestore.`);
        } catch (error: any) {
             if (error.code === 'auth/user-not-found') {
                 console.error(`Error: Admin user ${adminData.email} not found in Firebase Auth.`);
                 console.error('Please make sure this user exists before running the seed script.');
             } else {
                console.error(`Error processing admin user ${adminData.email}:`, error);
             }
        }
    }


    // Delete and recreate other example users
    for (const userData of otherUsersData) {
         try {
            // Delete if exists
            const existingUser = await auth.getUserByEmail(userData.email).catch(() => null);
            if (existingUser) {
                await auth.deleteUser(existingUser.uid);
                console.log(`Deleted existing example user: ${userData.email}`);
            }

            console.log(`Creating auth user for ${userData.email}...`);
            const userRecord = await auth.createUser({
                email: userData.email,
                emailVerified: true,
                password: 'password123', // Set a default password
                displayName: userData.nombre,
                photoURL: userData.avatar,
                disabled: false,
            });

            console.log(`Successfully created auth user: ${userRecord.uid}`);
            
            const userDoc: User = {
                ...userData,
                id_usuario: userRecord.uid,
            };

            await db.collection('users').doc(userDoc.email).set(userDoc);
            userIds.push(userRecord.uid);
            console.log(`Stored user ${userData.email} in Firestore.`);

        } catch (error) {
            console.error(`Error creating user ${userData.email}:`, error);
        }
    }
    console.log(`✅ Seeded ${userIds.length} users.`);
    return userIds;
}

async function seedInventory() {
    const dataWithSku = inventory.map((item, index) => ({
        ...item,
        sku: `SKU-${String(index + 1).padStart(4, '0')}`
    }));
    await seedCollection('inventory', dataWithSku, 'sku');
    return dataWithSku;
}

async function seedOrders(userIds: string[], inventoryItems: any[]) {
    console.log(`\nSeeding Orders...`);
    if (userIds.length === 0) {
        console.log('No users available to assign orders. Skipping order seeding.');
        return;
    }
     if (inventoryItems.length === 0) {
        console.log('No inventory items available to create orders. Skipping order seeding.');
        return;
    }

    const allUsers = await db.collection('users').get();
    const userDocs = allUsers.docs.map(doc => doc.data() as User);

    const ordersWithDetails = orders.map((order, index) => {
        const id_pedido = `PED-${String(new Date().getFullYear())}-${String(index + 1).padStart(5, '0')}`;
        const assignedUser = userDocs[index % userDocs.length]; // Cycle through users
        const item1 = inventoryItems[index % inventoryItems.length];
        const item2 = inventoryItems[(index + 1) % inventoryItems.length];
        
        const orderItems: OrderItem[] = [
            {
                sku: item1.sku,
                nombre: item1.nombre,
                variante: '',
                cantidad: 1,
                precio_unitario: item1.precios.venta,
                subtotal: item1.precios.venta,
                estado_item: 'PENDIENTE',
            },
            ...(index % 2 === 0 ? [{ // Add a second item to even-indexed orders
                sku: item2.sku,
                nombre: item2.nombre,
                variante: '',
                cantidad: 1,
                precio_unitario: item2.precios.venta,
                subtotal: item2.precios.venta,
                estado_item: 'PENDIENTE',
            }] : [])
        ];

        const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0) + order.envio.costo_envio;

        return {
            ...order,
            id_pedido: id_pedido,
            id_interno: `INT-${String(index + 1).padStart(5, '0')}`,
            asignacion: {
                id_usuario_actual: assignedUser.id_usuario,
                nombre_usuario_actual: assignedUser.nombre,
            },
            items: orderItems,
            pago: {
                ...order.pago,
                monto_total: totalAmount,
                monto_pendiente: order.pago.estado_pago === 'PENDIENTE' ? totalAmount : 0,
            },
            historial: [{
                fecha: new Date().toISOString(),
                id_usuario: assignedUser.id_usuario,
                nombre_usuario: assignedUser.nombre,
                accion: 'Creación de Pedido',
                detalle: 'Pedido creado a través del script de seed.'
            }]
        } as Omit<Order, 'fechas_clave'> & { fechas_clave: any };
    });

    await seedCollection('orders', ordersWithDetails, 'id_pedido');
}


async function main() {
  console.log('--- Starting Firestore Seeding ---');
  try {
    const userIds = await seedUsers();
    const seededInventory = await seedInventory();
    await seedOrders(userIds, seededInventory);
    console.log('\n--- Firestore Seeding Complete! ---');
    console.log('You can now run `npm run dev` to start the application.');
    console.log('Log in with your admin account: sjaquer@outlook.es');
  } catch (error) {
    console.error('\n❌ An error occurred during seeding:', error);
  }
}

main();
