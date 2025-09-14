
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/firebase-admin';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const deleteUserSchema = z.object({
  uid: z.string().min(1, 'UID es requerido.'),
});

export async function POST(request: Request) {
  const json = await request.json();
  const { uid } = json;
    
  try {
    const db = getAdminDb();
    const auth = admin.auth();

    const parsedData = deleteUserSchema.safeParse(json);
    if (!parsedData.success) {
      return NextResponse.json({ message: 'Datos inválidos.', errors: parsedData.error.errors }, { status: 400 });
    }
    
    // 1. Delete user from Firebase Authentication
    await auth.deleteUser(uid);
    
    // 2. Delete user document from Firestore
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.delete();

    return NextResponse.json({ success: true, message: `Usuario con UID ${uid} eliminado correctamente.` }, { status: 200 });

  } catch (error: any) {
    console.error(`Error eliminando usuario ${uid}:`, error);
    let message = 'Error interno del servidor.';
     if (error.code === 'auth/user-not-found') {
      message = 'El usuario no fue encontrado en Firebase Authentication.';
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
