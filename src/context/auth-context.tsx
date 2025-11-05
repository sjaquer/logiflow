'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { app, auth } from '@/lib/firebase/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { getCollectionData } from '@/lib/firebase/firestore-client';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { User as AppUser, UserRole } from '@/lib/types';
import { USER_ROLES } from '@/lib/types';
import { useState as useReactState } from 'react';

interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  showOnboarding: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  createAppUser: (nombre: string, rol: UserRole) => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  showOnboarding: false,
  login: async () => {},
  logout: async () => {},
  createAppUser: async () => null,
});


function OnboardingForm({ onCreate, email }: { onCreate: (nombre: string, rol: UserRole) => Promise<AppUser | null>, email: string }) {
  const [nombre, setNombre] = useState(email ? email.split('@')[0] : '');
  const [rol, setRol] = useState<UserRole>(USER_ROLES[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate(nombre, rol);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm block mb-1">Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full input" />
      </div>
      <div>
        <label className="text-sm block mb-1">Rol</label>
        <select value={rol} onChange={(e) => setRol(e.target.value as UserRole)} className="w-full input">
          {USER_ROLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Perfil'}</button>
      </div>
    </form>
  );
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      // When auth user exists, try to resolve app user record
      if (user && user.email) {
        try {
          const users = await getCollectionData<AppUser>('users');
          const found = users.find(u => u.email === user.email) || null;
          if (found) {
            setAppUser(found);
            setShowOnboarding(false);
          } else {
            // trigger onboarding UI
            setAppUser(null);
            setShowOnboarding(true);
          }
        } catch (err) {
          console.error('Error resolving app user for', user.email, err);
        }
      } else {
        setAppUser(null);
        setShowOnboarding(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    appUser,
    loading,
    showOnboarding,
    login,
    logout,
    createAppUser: async (nombre: string, rol: UserRole) => {
      try {
        const usersRef = collection(db, 'users');
        const payload = {
          nombre,
          email: user?.email || '',
          rol,
          activo: true,
          permisos: {
            puede_crear_pedido: true,
            puede_preparar: false,
            puede_despachar: false,
            puede_confirmar_entrega: false,
            puede_anular: false,
            puede_gestionar_inventario: false,
            puede_ver_reportes: false,
          }
        } as any;
        const ref = await addDoc(usersRef, payload);
        const created: AppUser = { ...payload, id_usuario: ref.id } as AppUser;
        setAppUser(created);
        setShowOnboarding(false);
        return created;
      } catch (err) {
        console.error('Failed to create app user', err);
        return null;
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}
    {showOnboarding && user && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-card p-6 rounded-lg w-full max-w-md">
          <h3 className="text-lg font-semibold mb-2">Completa tu perfil</h3>
          <p className="text-sm text-muted-foreground mb-4">Antes de continuar, indica tu nombre y rol dentro de la empresa.</p>
          <OnboardingForm onCreate={value.createAppUser} email={user.email || ''} />
        </div>
      </div>
    )}
  </AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
