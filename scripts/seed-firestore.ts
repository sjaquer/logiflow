// To run this script:
// 1. Make sure you have ts-node and dotenv installed: npm install ts-node dotenv
// 2. Set up Application Default Credentials: gcloud auth application-default login
// 3. Create a .env.local file in the root directory with your Firebase config.
// 4. Run the script: npx ts-node scripts/seed-firestore.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { inventory, orders, users as legacyUsers } from '../src/lib/data'; // Using legacy data structure
import type { User, LegacyUser } from '../src/lib/types';
import dotenv from 'dotenv';
import { firebaseConfig } from '../src/lib/firebase/config';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });


if (!firebaseConfig.projectId) {
    console.error("Firebase project ID is not defined in environment variables. Please check your .env.local file.");
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
    
    // Add the admin user
    const adminDocRef = doc(usersCollection, adminUser.id_usuario);
    batch.set(adminDocRef, adminUser);
    console.log(`- Added admin user: ${adminUser.email}`);

    // Add other legacy users, converting them to the new structure
    legacyUsers.forEach(user => {
        const docRef = doc(usersCollection, user.id);
        const newUser: Partial<User> = {
            id_usuario: user.id,
            nombre: user.name,
            email: user.email,
            rol: 'OPERADOR_LOGISTICO', // Default role
            activo: true,
            // You can define default permissions here
        };
        batch.set(docRef, newUser);
        console.log(`- Added user: ${user.email}`);
    });


    // Seed Inventory
    console.log('Seeding inventory...');
    const inventoryCollection = collection(db, 'inventory');
    inventory.forEach(item => {
        const docRef = doc(inventoryCollection, item.sku); // Use SKU as ID for new model
        batch.set(docRef, item);
        console.log(`- Added inventory item: ${item.name}`);
    });

    // Seed Orders
    console.log('Seeding orders...');
    const ordersCollection = collection(db, 'orders');
    orders.forEach(order => {
        const docRef = doc(ordersCollection, order.id_pedido); // Use id_pedido as ID
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
