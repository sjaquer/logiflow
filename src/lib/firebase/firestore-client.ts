'use client';
import { db } from './firebase';
import { collection, getDocs, onSnapshot, type Unsubscribe, type DocumentData } from 'firebase/firestore';
import type { Order, User, InventoryItem } from '@/lib/types';

export async function getCollectionData<T extends DocumentData>(collectionName: string): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

export function listenToCollection<T extends DocumentData>(
  collectionName: string,
  callback: (data: T[]) => void
): Unsubscribe {
  const collectionRef = collection(db, collectionName);
  const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
    callback(data);
  }, (error) => {
    console.error(`Error listening to ${collectionName}:`, error);
  });
  return unsubscribe;
}
