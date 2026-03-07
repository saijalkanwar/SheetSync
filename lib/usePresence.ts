'use client';
/**
 * usePresence
 * -----------
 * Tracks which users are currently in a document and their selected cell.
 *
 * Firestore schema
 * ────────────────
 * /documents/{docId}/presence/{userId}
 *   name: string
 *   color: string
 *   initial: string
 *   cell: string        (e.g. "B3")
 *   updatedAt: Timestamp
 *
 * Each client writes its own presence record.  A presence record older than
 * 30 s is treated as "gone" (poor-man's TTL without Cloud Functions).
 */
import { useEffect, useCallback, useRef } from 'react';
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  Timestamp,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { Collaborator } from '../app/components/PresenceBar';

const STALE_MS = 30_000; // 30 s

export function usePresence(
  docId: string,
  user: { uid: string; name: string; color: string; initial: string } | null,
  activeCell: string,
  onCollaboratorsChange: (collaborators: Collaborator[]) => void
) {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Write own presence ──────────────────────────────────────────────────
  const writePresence = useCallback(async (cell: string) => {
    if (!isConfigured || !user) return;
    const presenceRef = doc(db, 'documents', docId, 'presence', user.uid);
    await setDoc(presenceRef, {
      name:    user.name,
      color:   user.color,
      initial: user.initial,
      cell,
      updatedAt: serverTimestamp(),
    });
  }, [docId, user]);

  // ── Remove presence on unmount ──────────────────────────────────────────
  const removePresence = useCallback(async () => {
    if (!isConfigured || !user) return;
    const presenceRef = doc(db, 'documents', docId, 'presence', user.uid);
    await deleteDoc(presenceRef);
  }, [docId, user]);

  // ── Subscribe & heartbeat ────────────────────────────────────────────────
  useEffect(() => {
    if (!isConfigured || !user) return;

    // Write initial presence
    writePresence(activeCell);

    // Heartbeat every 15 s so we stay fresh
    heartbeatRef.current = setInterval(() => writePresence(activeCell), 15_000);

    // Listen to all presence records
    const presenceCollection = collection(db, 'documents', docId, 'presence');
    const unsub = onSnapshot(presenceCollection, snapshot => {
      const now = Date.now();
      const collaborators: Collaborator[] = [];

      snapshot.docs.forEach(d => {
        if (d.id === user.uid) return; // skip self
        const data = d.data();
        const updatedAt = (data.updatedAt as Timestamp)?.toMillis?.() ?? 0;
        if (now - updatedAt > STALE_MS) return; // skip stale
        collaborators.push({
          id:      d.id,
          name:    data.name,
          color:   data.color,
          initial: data.initial,
          cell:    data.cell ?? '',
        });
      });

      onCollaboratorsChange(collaborators);
    });

    // Cleanup
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      unsub();
      removePresence();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, user?.uid]);

  // Write presence when active cell changes
  useEffect(() => {
    writePresence(activeCell);
  }, [activeCell, writePresence]);
}
