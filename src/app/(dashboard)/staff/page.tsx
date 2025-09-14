
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import type { User, UserRole } from '@/lib/types';
import { listenToCollection } from '@/lib/firebase/firestore-client';
import { db } from '@/lib/firebase/firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { StaffTable } from './components/staff-table';
import { StaffDialog } from './components/staff-dialog';

const ALLOWED_ROLES: UserRole[] = ['Admin', 'Desarrolladores'];

export default function StaffPage() {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
     if (authUser) {
      const unsubUser = listenToCollection<User>('users', (users) => {
        const foundUser = users.find(u => u.email === authUser.email);
        setCurrentUser(foundUser || null);
        setStaff(users);
        setLoading(false);
      });
      return () => unsubUser();
    }
  }, [authUser]);

  const filteredStaff = useMemo(() => {
    return staff.filter(user =>
      user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staff, searchQuery]);

  const handleOpenDialog = (user: User | null = null) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      if (editingUser) {
        // Update existing user
        const userRef = doc(db, 'users', editingUser.id_usuario);
        const { password, ...updateData } = userData; // Exclude password from update
        await updateDoc(userRef, updateData);
        toast({ title: 'Éxito', description: 'Usuario actualizado correctamente.' });
      } else {
        // Create new user
        if (!userData.email || !userData.password) {
            toast({ title: 'Error', description: 'Email y contraseña son requeridos para nuevos usuarios.', variant: 'destructive' });
            return;
        }

        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const newUserId = userCredential.user.uid;

        const { password, ...newUser } = userData;
        const userRef = doc(db, 'users', newUserId);
        await setDoc(userRef, { ...newUser, id_usuario: newUserId });
        
        toast({ title: 'Éxito', description: 'Usuario creado correctamente.' });
      }
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error saving user:', error);
       if (error.code === 'auth/email-already-in-use') {
         toast({ title: 'Error', description: 'El correo electrónico ya está en uso.', variant: 'destructive' });
      } else if (error.code === 'auth/weak-password') {
          toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres.', variant: 'destructive' });
      } else {
         toast({ title: 'Error', description: 'No se pudo guardar el usuario.', variant: 'destructive' });
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === authUser?.uid) {
        toast({ title: 'Error', description: 'No puedes eliminarte a ti mismo.', variant: 'destructive' });
        return;
    }
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción es permanente y no se puede deshacer.')) return;
    try {
      // Note: Deleting from Firebase Auth is a more complex operation that should be handled
      // via a backend function for security reasons. Here we just delete from Firestore.
      await deleteDoc(doc(db, 'users', userId));
      toast({ title: 'Éxito', description: 'Usuario eliminado de Firestore.' });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el usuario.', variant: 'destructive' });
    }
  };
  
  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser && !ALLOWED_ROLES.includes(currentUser.rol)) {
    return (
        <div className="flex-1 flex items-center justify-center p-8">
             <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Esta sección es exclusiva para administradores y desarrolladores.
                    </p>
                </CardContent>
             </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Roles y Personal</CardTitle>
            <CardDescription>Añade, edita o elimina usuarios y gestiona sus permisos.</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Personal
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <StaffTable
              staff={filteredStaff}
              onEdit={handleOpenDialog}
              onDelete={handleDeleteUser}
            />
          </div>
        </CardContent>
      </Card>
      
      <StaffDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveUser}
        user={editingUser}
        currentUser={currentUser}
      />
    </div>
  );
}

