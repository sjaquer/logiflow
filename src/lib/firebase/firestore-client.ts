'use client';
import { db } from './firebase';
import { collection, getDocs, onSnapshot, type Unsubscribe, type DocumentData, doc, getDoc } from 'firebase/firestore';
import type { Order, User, InventoryItem } from '@/lib/types';

export async function getCollectionData<T extends DocumentData>(collectionName: string): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as T));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

export async function getDocumentData<T extends DocumentData>(collectionName: string, docId: string): Promise<T | null> {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as unknown as T;
        } else {
            console.warn(`Document with ID ${docId} not found in ${collectionName}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching document ${docId} from ${collectionName}:`, error);
        return null;
    }
}


export function listenToCollection<T extends DocumentData>(
  collectionName: string,
  callback: (data: T[]) => void
): Unsubscribe {
  const collectionRef = collection(db, collectionName);
  const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
  const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as T));
    callback(data);
  }, (error) => {
    console.error(`Error listening to ${collectionName}:`, error);
  });
  return unsubscribe;
}
