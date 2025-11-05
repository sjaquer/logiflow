/**
 * Script para inicializar el usuario administrador en Firebase Authentication
 * 
 * Este script crea el usuario admin con las credenciales especificadas.
 * Solo debe ejecutarse una vez en la configuración inicial del proyecto.
 * 
 * Uso:
 * npx ts-node --project tsconfig.scripts.json scripts/init-admin-user.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') }); // Override con .env.local si existe

// Credenciales del usuario admin
const ADMIN_EMAIL = 'sjaquer@outlook.es';
const ADMIN_PASSWORD = 'A901230b';
const ADMIN_DISPLAY_NAME = 'Santiago Jaquer (Dev)';

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  // Verificar que las variables estén configuradas
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error('❌ Error: Variables de Firebase no configuradas');
    console.error('   Asegúrate de tener configuradas:');
    console.error('   - FIREBASE_PROJECT_ID');
    console.error('   - FIREBASE_PRIVATE_KEY');
    console.error('   - FIREBASE_CLIENT_EMAIL');
    process.exit(1);
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const auth = admin.auth();

async function initAdminUser() {
  console.log('🚀 Iniciando configuración del usuario administrador...\n');

  try {
    // Verificar si el usuario ya existe
    let userExists = false;
    try {
      const existingUser = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log(`ℹ️  Usuario encontrado con UID: ${existingUser.uid}`);
      userExists = true;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('ℹ️  Usuario no existe, procediendo a crear...');
      } else {
        throw error;
      }
    }

    if (userExists) {
      // Usuario existe - actualizar contraseña
      console.log('🔄 Actualizando contraseña del usuario existente...');
      
      const user = await auth.getUserByEmail(ADMIN_EMAIL);
      await auth.updateUser(user.uid, {
        password: ADMIN_PASSWORD,
        displayName: ADMIN_DISPLAY_NAME,
        emailVerified: true,
      });

      console.log('✅ Usuario actualizado correctamente');
      console.log(`   UID: ${user.uid}`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Nombre: ${ADMIN_DISPLAY_NAME}`);
      console.log(`   Contraseña: ********** (actualizada)`);
    } else {
      // Usuario no existe - crear nuevo
      console.log('➕ Creando nuevo usuario administrador...');
      
      const newUser = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_DISPLAY_NAME,
        emailVerified: true,
      });

      console.log('✅ Usuario creado correctamente');
      console.log(`   UID: ${newUser.uid}`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Nombre: ${ADMIN_DISPLAY_NAME}`);
      console.log(`   Email verificado: Sí`);
    }

    console.log('\n📋 Credenciales de acceso:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    
    console.log('\n🎉 Configuración completada exitosamente!');
    console.log('💡 Ahora puedes iniciar sesión en la aplicación con estas credenciales.\n');

  } catch (error) {
    console.error('❌ Error al configurar usuario administrador:', error);
    process.exit(1);
  }
}

// Ejecutar el script
initAdminUser()
  .then(() => {
    console.log('✅ Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
