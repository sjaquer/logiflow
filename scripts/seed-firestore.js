// Usa CommonJS para compatibilidad con Node.js
const { initializeApp, getApps, getApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, getDocs, doc } = require('firebase/firestore');
const { users, inventory, orders } = require('../src/lib/data');

// Carga las variables de entorno para el script
require('dotenv').config({ path: '.env.local' });

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validar que la configuración de Firebase esté presente
if (!firebaseConfig.projectId) {
  console.error("Error: Firebase configuration is missing. Make sure your .env.local file is set up correctly.");
  process.exit(1);
}

// Inicializar Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function seedCollection(collectionName, data, idField) {
  const collectionRef = collection(db, collectionName);
  const batch = writeBatch(db);

  // Opcional: borrar datos existentes para evitar duplicados
  const querySnapshot = await getDocs(collectionRef);
  querySnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Cleared existing data from "${collectionName}" collection.`);

  // Nuevo batch para añadir los nuevos datos
  const newBatch = writeBatch(db);
  console.log(`Seeding ${collectionName}...`);
  data.forEach(item => {
    const docId = item[idField].toString();
    const docRef = doc(db, collectionName, docId);
    newBatch.set(docRef, item);
  });

  await newBatch.commit();
  console.log(`Seeded ${data.length} documents into "${collectionName}" collection.`);
}

async function main() {
  try {
    console.log('Starting database seed...');
    await seedCollection('users', users, 'email'); // Usar email como ID para usuarios
    await seedCollection('inventory', inventory, 'sku');
    await seedCollection('orders', orders, 'id_pedido');
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

main();
