'use client';
/**
 * useDocuments
 * ------------
 * Fetches and subscribes to the list of all documents for the dashboard.
 * Falls back to in-memory demo data when Firestore is not configured.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';

export interface DocMeta {
  id: string;
  title: string;
  lastModified: Date;
  ownerName: string;
  ownerColor: string;
  ownerInitial: string;
  ownerId: string;
}

// Demo seed data (no Firebase)
function seedDocs(): DocMeta[] {
  const now = Date.now();
  return [
    { id: 'doc-1', title: 'Q1 2025 Budget',       lastModified: new Date(now - 5 * 60000),    ownerName: 'Saijal Kanwar', ownerColor: '#7c3aed', ownerInitial: 'S', ownerId: 'demo' },
    { id: 'doc-2', title: 'Marketing Campaign',    lastModified: new Date(now - 2 * 3600000), ownerName: 'Alex Johnson',  ownerColor: '#1a73e8', ownerInitial: 'A', ownerId: 'demo' },
    { id: 'doc-3', title: 'Sales Tracker',         lastModified: new Date(now - 86400000),    ownerName: 'Maria Lopez',   ownerColor: '#059669', ownerInitial: 'M', ownerId: 'demo' },
    { id: 'doc-4', title: 'Product Roadmap 2025',  lastModified: new Date(now - 3 * 86400000),ownerName: 'Saijal Kanwar', ownerColor: '#7c3aed', ownerInitial: 'S', ownerId: 'demo' },
    { id: 'doc-5', title: 'Inventory Sheet',        lastModified: new Date(now - 7 * 86400000),ownerName: 'Jordan Kim',   ownerColor: '#d97706', ownerInitial: 'J', ownerId: 'demo' },
  ];
}

export function useDocuments(
  user: { uid: string; name: string; color: string; initial: string } | null
) {
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setDocs(seedDocs());
      setLoading(false);
      return;
    }

    // Real-time subscription, newest-first
    const q = query(collection(db, 'documents'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, snapshot => {
      const list: DocMeta[] = snapshot.docs.map(d => {
        const data = d.data();
        const ts = data.updatedAt as Timestamp | null;
        return {
          id:           d.id,
          title:        data.title ?? 'Untitled spreadsheet',
          lastModified: ts?.toDate() ?? new Date(),
          ownerName:    data.ownerName ?? 'Unknown',
          ownerColor:   '#1a73e8',
          ownerInitial: (data.ownerName as string)?.[0]?.toUpperCase() ?? '?',
          ownerId:      data.ownerId ?? '',
        };
      });
      setDocs(list);
      setLoading(false);
    });

    return unsub;
  }, []);

  // Create a new document and return its id
  const createDoc = useCallback(async (): Promise<string> => {
    if (!isConfigured || !user) {
      const id = `doc-${Date.now()}`;
      setDocs(prev => [{
        id, title: 'Untitled spreadsheet',
        lastModified: new Date(),
        ownerName: user?.name ?? 'You',
        ownerColor: user?.color ?? '#7c3aed',
        ownerInitial: user?.initial ?? 'Y',
        ownerId: user?.uid ?? 'demo',
      }, ...prev]);
      return id;
    }

    const ref = await addDoc(collection(db, 'documents'), {
      title:     'Untitled spreadsheet',
      ownerId:   user.uid,
      ownerName: user.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }, [user]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!isConfigured) {
      setDocs(prev => prev.filter(d => d.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'documents', id));
  }, []);

  return { docs, loading, createDoc, deleteDocument };
}
