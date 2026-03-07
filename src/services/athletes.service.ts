/**
 * Serviço de Atletas – Firestore (coleção coachemAthletes)
 *
 * Atletas cadastrados pelo treinador. Cada documento tem coachId para filtrar.
 * Use o id do documento como athleteId ao atribuir treinos.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase.config';

const COLLECTION = 'coachemAthletes';

export interface AthleteDoc {
  id: string;
  coachId: string;
  name: string;
  sport?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

function removeUndefined<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) out[key] = removeUndefined(value);
    }
    return out as T;
  }
  return obj;
}

function toStr(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  return (v as string) || new Date().toISOString();
}

function docToAthlete(snap: DocumentSnapshot): AthleteDoc {
  const data = snap.data()!;
  return {
    id: snap.id,
    coachId: data.coachId || '',
    name: data.name || '',
    sport: data.sport,
    status: data.status || 'Ativo',
    createdAt: toStr(data.createdAt),
    updatedAt: toStr(data.updatedAt),
  };
}

export async function listAthletesByCoachId(coachId: string): Promise<AthleteDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where('coachId', '==', coachId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToAthlete);
}

export async function getAthleteById(id: string): Promise<AthleteDoc | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return docToAthlete(snap);
}

export async function createAthlete(
  coachId: string,
  data: { name: string; sport?: string; status?: string }
): Promise<AthleteDoc> {
  const now = new Date().toISOString();
  const payload = removeUndefined({
    coachId,
    name: data.name.trim(),
    sport: data.sport?.trim(),
    status: data.status || 'Ativo',
    createdAt: now,
    updatedAt: now,
  });
  const ref = await addDoc(collection(db, COLLECTION), payload);
  const created = await getDoc(ref);
  return docToAthlete(created);
}

export async function updateAthlete(
  id: string,
  data: Partial<Pick<AthleteDoc, 'name' | 'sport' | 'status'>>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const payload = removeUndefined({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(ref, payload);
}

export async function deleteAthlete(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
