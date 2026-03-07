'use client';
/**
 * useSpreadsheet
 * --------------
 * Real-time hook that syncs a document's cell data with Firestore.
 *
 * Firestore schema
 * ────────────────
 * /documents/{docId}
 *   title: string
 *   ownerId: string
 *   ownerName: string
 *   createdAt: Timestamp
 *   updatedAt: Timestamp
 *
 * /documents/{docId}/cells/{cellId}          (e.g. "A1", "B3")
 *   raw: string
 *   computed: string
 *   format?: { bold, italic, textColor, bgColor, align }
 *   updatedAt: Timestamp
 *
 * When Firestore is NOT configured the hook falls back to in-memory state
 * so the UI works in demo mode.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  getDoc,
  setLogLevel,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { GridData, CellFormat } from '../app/components/Grid';

setLogLevel('error'); // suppress Firestore debug noise

export type SaveState = 'saved' | 'saving' | 'error';

export interface DocMeta {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  updatedAt: Date;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
type PlainCell = {
  raw: string;
  computed: string;
  format?: CellFormat;
};

function gridToPlainCells(grid: GridData): Record<string, PlainCell> {
  const out: Record<string, PlainCell> = {};
  grid.forEach((v, k) => { out[k] = { raw: v.raw, computed: v.computed, format: v.format }; });
  return out;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSpreadsheet(docId: string, userId: string, userName: string) {
  const [gridData, setGridData] = useState<GridData>(new Map());
  const [title, setTitle]       = useState('Untitled spreadsheet');
  const [saveState, setSaveState] = useState<SaveState>('saved');

  // Debounce timer per cell so rapid keystrokes don't hammer Firestore
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Subscribe to Firestore ──────────────────────────────────────────────
  useEffect(() => {
    if (!isConfigured || !docId) return;

    // Ensure the document record exists (first visit)
    const docRef = doc(db, 'documents', docId);
    getDoc(docRef).then(snap => {
      if (!snap.exists()) {
        setDoc(docRef, {
          title: 'Untitled spreadsheet',
          ownerId: userId,
          ownerName: userName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    // Listen to document meta (title)
    const unsubDoc = onSnapshot(docRef, snap => {
      if (snap.exists()) setTitle(snap.data().title ?? 'Untitled spreadsheet');
    });

    // Listen to all cells
    const cellsRef = collection(db, 'documents', docId, 'cells');
    const unsubCells = onSnapshot(cellsRef, snapshot => {
      setGridData(prev => {
        const next = new Map(prev);
        snapshot.docChanges().forEach(change => {
          const id = change.doc.id;
          if (change.type === 'removed') {
            next.delete(id);
          } else {
            const d = change.doc.data() as PlainCell;
            next.set(id, { raw: d.raw, computed: d.computed, format: d.format });
          }
        });
        return next;
      });
    });

    return () => {
      unsubDoc();
      unsubCells();
    };
  }, [docId, userId, userName]);

  // ── Write a cell ───────────────────────────────────────────────────────
  const updateCell = useCallback(
    (cellId: string, raw: string, computed: string, format?: CellFormat) => {
      // Optimistic local update
      setGridData(prev => {
        const next = new Map(prev);
        if (!raw && !computed) {
          next.delete(cellId);
        } else {
          next.set(cellId, { raw, computed, format });
        }
        return next;
      });

      if (!isConfigured) return;

      setSaveState('saving');

      // Clear any pending timer for this cell
      const existing = saveTimers.current.get(cellId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(async () => {
        try {
          const cellRef = doc(db, 'documents', docId, 'cells', cellId);
          if (!raw && !computed) {
            await deleteDoc(cellRef);
          } else {
            await setDoc(cellRef, {
              raw, computed,
              ...(format ? { format } : {}),
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
          // Touch the document's updatedAt
          await updateDoc(doc(db, 'documents', docId), { updatedAt: serverTimestamp() });
          setSaveState('saved');
        } catch {
          setSaveState('error');
        }
        saveTimers.current.delete(cellId);
      }, 400); // 400 ms debounce

      saveTimers.current.set(cellId, timer);
    },
    [docId]
  );

  // ── Rename document ─────────────────────────────────────────────────────
  const renameDocument = useCallback(async (newTitle: string) => {
    setTitle(newTitle);
    if (!isConfigured) return;
    await updateDoc(doc(db, 'documents', docId), {
      title: newTitle,
      updatedAt: serverTimestamp(),
    });
  }, [docId]);

  return { gridData, title, saveState, updateCell, renameDocument, setGridData };
}
