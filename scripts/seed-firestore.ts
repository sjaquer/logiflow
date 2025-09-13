
// tsx -r dotenv/config --tsconfig tsconfig.scripts.json scripts/seed-firestore.ts
import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '../src/lib/firebase/firebase-admin';
import { users, inventory, orders as seedOrdersData } from '../src/lib/data';
import type { Order, OrderItem, User, Client } from '../src/lib/types';


const db = getAdminDb();
const auth = getAuth();

const BATCH_LIMIT = 400; // Firestore batch limit, reduced for safety

async function clearCollection(collectionName: string) {
    const collectionRef = db.collection(collectionName);
    let snapshot = await collectionRef.limit(BATCH_LIMIT).get();

    if (snapshot.empty) {
        console.log(`Collection ${collectionName} is already empty.`);
        return;
    }

    console.log(`Clearing collection ${collectionName}...`);
    let deletedCount = 0;
    while (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCount += snapshot.size;
        console.log(`Deleted ${deletedCount} documents from ${collectionName}.`);
        snapshot = await collectionRef.limit(BATCH_LIMIT).get();
    }
     console.log(`✅ Collection ${collectionName} cleared.`);
}


async function seedCollection<T extends { [key: string]: any }>(
  collectionName: string,
  data: T[],
  idField?: keyof T
) {
  console.log(`\nSeeding ${collectionName}...`);
  const collectionRef = db.collection(collectionName);
  let batch = db.batch();
  let count = 0;
  const generatedIds: string[] = [];

  for (const item of data) {
    const docId = idField ? String(item[idField]) : undefined;
    const docRef = docId ? collectionRef.doc(docId) : collectionRef.doc();
    
    const dataToSet: any = { ...item };

    if (!docId) {
      dataToSet.id = docRef.id;
    }

    if (collectionName === 'orders' && !docId) {
        dataToSet.id_pedido = docRef.id;
    }

    batch.set(docRef, dataToSet);
    generatedIds.push(docRef.id);
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
  return generatedIds;
}


async function seedUsers() {
    console.log(`\nSeeding Users and creating auth entries...`);

    // Delete all existing users from Firebase Auth except the developer
    const listUsersResult = await auth.listUsers(1000);
    const devEmail = 'sjaquer@outlook.es';
    for (const userRecord of listUsersResult.users) {
        if (userRecord.email !== devEmail) {
            await auth.deleteUser(userRecord.uid);
            console.log(`Deleted existing example auth user: ${userRecord.email}`);
        }
    }

    // Ensure dev user exists in Auth, if not, it's a critical error
    let devUserRecord;
    try {
        devUserRecord = await auth.getUserByEmail(devEmail);
    } catch (error) {
        console.error(`CRITICAL ERROR: Developer user ${devEmail} not found in Firebase Auth.`);
        console.error('Please create this user in Firebase Authentication before running the seed script.');
        process.exit(1);
    }

    // Prepare user data for Firestore
    const firestoreUsers: User[] = [];

    // Process dev user
    const devUserData = users.find(u => u.email === devEmail)!;
    firestoreUsers.push({ ...devUserData, id_usuario: devUserRecord.uid });

    // Process other users
    for (const userData of users.filter(u => u.email !== devEmail)) {
         try {
            const userRecord = await auth.createUser({
                email: userData.email,
                emailVerified: true,
                password: 'password123',
                displayName: userData.nombre,
                photoURL: userData.avatar,
                disabled: false,
            });
            firestoreUsers.push({ ...userData, id_usuario: userRecord.uid });
        } catch (error) {
            console.error(`Error creating auth user ${userData.email}:`, error);
        }
    }
    
    // Batch write all users to Firestore using their email as ID
    const batch = db.batch();
    firestoreUsers.forEach(user => {
        const userRef = db.collection('users').doc(user.id_usuario);
        batch.set(userRef, user);
    });
    await batch.commit();
    console.log(`✅ Seeded ${firestoreUsers.length} users into Firestore.`);
    return firestoreUsers;
}

async function seedInventory() {
    const dataWithSku = inventory.map((item, index) => ({
        ...item,
        sku: `SKU-${String(index + 1).padStart(4, '0')}`
    }));
    await seedCollection('inventory', dataWithSku, 'sku');
    return dataWithSku;
}

async function seedClients(): Promise<Client[]> {
    const clientData: Omit<Client, 'id'>[] = seedOrdersData.map(order => ({
        dni: order.cliente.dni,
        nombres: order.cliente.nombres,
        celular: order.cliente.celular,
        email: `cliente${order.cliente.dni}@example.com`,
        direccion: order.envio.direccion,
        distrito: order.envio.distrito || '',
        provincia: order.envio.provincia,
        source: 'manual',
        last_updated: new Date().toISOString(),
        call_status: 'VENTA_CONFIRMADA',
        first_interaction_at: new Date().toISOString()
    }));

    const uniqueClientsMap = new Map<string, Omit<Client, 'id'>>();
    clientData.forEach(c => uniqueClientsMap.set(c.dni, c));
    const uniqueClientsData = Array.from(uniqueClientsMap.values());
    
    const generatedIds = await seedCollection('clients', uniqueClientsData);

    const seededClients = uniqueClientsData.map((client, index) => ({
        ...client,
        id: generatedIds[index],
    }));

    return seededClients;
}

async function seedOrders(allUsers: User[], inventoryItems: any[], clients: Client[]) {
    console.log(`\nSeeding Orders...`);
    if (allUsers.length === 0) {
        console.log('No users available. Skipping order seeding.');
        return;
    }
     if (inventoryItems.length === 0) {
        console.log('No inventory items available. Skipping order seeding.');
        return;
    }

    const ordersWithDetails = seedOrdersData.map((order, index) => {
        const id_pedido = `PED-${String(new Date().getFullYear())}-${String(index + 1).padStart(5, '0')}`;
        const assignedUser = allUsers[index % allUsers.length];
        const client = clients.find(c => c.dni === order.cliente.dni)!;
        
        const item1 = inventoryItems[index % inventoryItems.length];
        const item2 = inventoryItems[(index + 1) % inventoryItems.length];
        
        const orderItems: OrderItem[] = [
            { sku: item1.sku, nombre: item1.nombre, variante: '', cantidad: 1, precio_unitario: item1.precios.venta, subtotal: item1.precios.venta, estado_item: 'PENDIENTE' },
            ...(index % 2 === 0 ? [{ sku: item2.sku, nombre: item2.nombre, variante: '', cantidad: 1, precio_unitario: item2.precios.venta, subtotal: item2.precios.venta, estado_item: 'PENDIENTE' }] : [])
        ];

        const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0) + order.envio.costo_envio;

        return {
            ...order,
            id_pedido: id_pedido,
            id_interno: `INT-${String(index + 1).padStart(5, '0')}`,
            cliente: { ...order.cliente, id_cliente: client.id, email: client.email },
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
            }],
            fechas_clave: {
                ...order.fechas_clave,
                confirmacion_llamada: new Date().toISOString(),
                procesamiento_iniciado: new Date().toISOString(),
            },
            source: 'manual',
        } as Omit<Order, 'id_pedido'> & { id_pedido: string };
    });

    await seedCollection('orders', ordersWithDetails, 'id_pedido');
}


async function main() {
  console.log('--- Starting Firestore Seeding ---');
  try {
    // Clear collections first
    await clearCollection('orders');
    await clearCollection('clients');
    await clearCollection('inventory');
    await clearCollection('users');
    
    // Seed collections
    const seededUsers = await seedUsers();
    const seededInventory = await seedInventory();
    const seededClients = await seedClients();
    await seedOrders(seededUsers, seededInventory, seededClients);

    console.log('\n--- Firestore Seeding Complete! ---');
    console.log('You can now run `npm run dev` to start the application.');
    console.log(`Log in with your developer account: ${process.env.DEV_USER_EMAIL || 'sjaquer@outlook.es'}`);
  } catch (error) {
    console.error('\n❌ An error occurred during seeding:', error);
    process.exit(1);
  }
}

main();
