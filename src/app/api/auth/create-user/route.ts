
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string(),
  rol: z.string(),
  permisos: z.any(),
  activo: z.boolean(),
  avatar: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const db = getAdminDb();
    const auth = admin.auth();
    const json = await request.json();
    
    const parsedData = createUserSchema.safeParse(json);
    if (!parsedData.success) {
      return NextResponse.json({ message: 'Datos inválidos.', errors: parsedData.error.errors }, { status: 400 });
    }
    
    const { email, password, nombre, rol, permisos, activo, avatar } = parsedData.data;

    // 1. Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: nombre,
      disabled: !activo,
    });
    
    const uid = userRecord.uid;

    // 2. Create user document in Firestore
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.set({
      id_usuario: uid,
      email,
      nombre,
      rol,
      permisos,
      activo,
      avatar: avatar || `https://i.pravatar.cc/150?u=${email}`,
    });

    return NextResponse.json({ success: true, uid, email }, { status: 201 });

  } catch (error: any) {
    console.error('Error creando usuario:', error);
    let message = 'Error interno del servidor.';
    if (error.code === 'auth/email-already-exists') {
      message = 'El correo electrónico ya está en uso por otro usuario.';
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
