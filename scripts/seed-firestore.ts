// To run this script:
// 1. Make sure you have ts-node and dotenv installed: npm install ts-node dotenv
// 2. Make sure you have credentials set up for your Firebase project in a .env.local file.
// 3. Run the script: npx ts-node scripts/seed-firestore.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { inventory, orders, users as appUsers } from '../src/lib/data';
import type { User } from '../src/lib/types';

// IMPORTANT: Do NOT import from ../src/lib/firebase/config
// as it can cause module resolution issues in this script.
// Instead, we construct the config object directly.
const firebaseConfig = {
    apiKey: "AIzaSyBn63Dp1eXlDJPQgK-E2ltyaR-HUUj_KDU",
    authDomain: "logistics-flow-dp1gz.firebaseapp.com",
    projectId: "logistics-flow-dp1gz",
    storageBucket: "logistics-flow-dp1gz.appspot.com",
    messagingSenderId: "440587721618",
    appId: "1:440587721618:web:c54541af217589361b7f4b"
};


if (!firebaseConfig.projectId) {
    console.error("Firebase project ID is not defined. Please check your firebaseConfig object.");
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const adminUser: User = {
    id_usuario: 'admin-sjaquer',
    nombre: 'SJAQUER',
    email: 'sjaquer@outlook.es',
    rol: 'ADMIN',
    activo: true,
    permisos: {
        puede_crear_pedido: true,
        puede_preparar: true,
        puede_despachar: true,
        puede_confirmar_entrega: true,
        puede_anular: true,
        puede_gestionar_inventario: true,
        puede_ver_reportes: true,
    }
};

const seedDatabase = async () => {
    console.log('Starting to seed database...');
    const batch = writeBatch(db);

    // Seed Users
    console.log('Seeding users...');
    const usersCollection = collection(db, 'users');
    
    // Add the admin user, using their email as the document ID for easy lookup
    const adminDocRef = doc(usersCollection, adminUser.email);
    batch.set(adminDocRef, adminUser);
    console.log(`- Added admin user: ${adminUser.email}`);

    // Add other sample users
    appUsers.forEach(user => {
        const docRef = doc(usersCollection, user.email); // Use email as unique ID
        batch.set(docRef, user);
        console.log(`- Added user: ${user.email}`);
    });


    // Seed Inventory
    console.log('Seeding inventory...');
    const inventoryCollection = collection(db, 'inventory');
    inventory.forEach(item => {
        const docRef = doc(inventoryCollection, item.sku); // Use SKU as the document ID
        batch.set(docRef, item);
        console.log(`- Added inventory item: ${item.nombre}`);
    });

    // Seed Orders
    console.log('Seeding orders...');
    const ordersCollection = collection(db, 'orders');
    orders.forEach(order => {
        const docRef = doc(ordersCollection, order.id_pedido); // Use id_pedido as the document ID
        batch.set(docRef, order);
        console.log(`- Added order: ${order.id_pedido}`);
    });

    try {
        await batch.commit();
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

seedDatabase().then(() => {
    console.log('Script finished.');
    process.exit(0);
}).catch(err => {
    console.error("Script failed", err);
    process.exit(1);
});
