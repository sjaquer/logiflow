'use server';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Order, LegacyUser as User, LegacyInventoryItem as InventoryItem } from '@/lib/types';

async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

export const getOrders = async (): Promise<Order[]> => {
    // This uses the old Order type for now to match the UI components
    return getCollectionData<any>('orders');
};

export const getInventory = async (): Promise<InventoryItem[]> => {
    return getCollectionData<InventoryItem>('inventory');
};

export const getUsers = async (): Promise<User[]> => {
    return getCollectionData<User>('users');
};
