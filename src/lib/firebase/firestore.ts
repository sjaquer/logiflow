'use server';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Order, User, InventoryItem } from '@/lib/types';

async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    // Firestore returns data with id separate from the rest of the document data
    // We combine it here for easier use in the application
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    // In case of error, return an empty array to prevent app crash
    return [];
  }
}

export const getOrders = async (): Promise<Order[]> => {
    return getCollectionData<Order>('orders');
};

export const getInventory = async (): Promise<InventoryItem[]> => {
    return getCollectionData<InventoryItem>('inventory');
};

export const getUsers = async (): Promise<User[]> => {
    return getCollectionData<User>('users');
};
