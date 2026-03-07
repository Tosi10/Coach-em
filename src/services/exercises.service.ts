/**
 * Serviço de Exercícios – Firestore (coleção coachemExercises)
 *
 * Exercícios criados pelo treinador são salvos aqui e aparecem na biblioteca.
 * Cada documento pode ter coachId (createdBy) para filtrar por treinador.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase.config';
import type { Exercise } from '@/src/types';

const COLLECTION = 'coachemExercises';

function removeUndefined<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map((item) => removeUndefined(item)) as T;
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) out[key] = removeUndefined(value);
    }
    return out as T;
  }
  return obj;
}

function docToExercise(docSnap: DocumentSnapshot): Exercise {
  const data = docSnap.data()!;
  const toStr = (v: unknown): string =>
    v instanceof Timestamp ? v.toDate().toISOString() : (v as string) || new Date().toISOString();
  return {
    id: docSnap.id,
    name: data.name,
    description: data.description || '',
    videoURL: data.videoURL,
    thumbnailURL: data.thumbnailURL,
    duration: data.duration,
    difficulty: data.difficulty || 'beginner',
    muscleGroups: data.muscleGroups || [],
    equipment: data.equipment,
    createdBy: data.createdBy || '',
    isGlobal: data.isGlobal === true,
    createdAt: toStr(data.createdAt),
    updatedAt: toStr(data.updatedAt),
  };
}

/**
 * Lista exercícios criados por um treinador (e opcionalmente globais).
 * No console do Firebase, eles aparecem em: Firestore > coachemExercises.
 */
export async function listExercisesByCoachId(coachId: string): Promise<Exercise[]> {
  const q = query(
    collection(db, COLLECTION),
    where('createdBy', '==', coachId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToExercise);
}

/**
 * Busca um exercício pelo id.
 */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return docToExercise(snap);
}

/**
 * Cria um exercício no Firestore (coleção coachemExercises).
 * O id pode ser passado ou será o id do documento.
 */
export async function createExercise(
  coachId: string,
  data: Omit<Exercise, 'createdBy' | 'createdAt' | 'updatedAt'> & {
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<Exercise> {
  const id = data.id || `exercise_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  const payload = removeUndefined({
    id,
    name: data.name,
    description: data.description,
    videoURL: data.videoURL,
    thumbnailURL: data.thumbnailURL,
    duration: data.duration,
    difficulty: data.difficulty,
    muscleGroups: data.muscleGroups,
    equipment: data.equipment,
    createdBy: coachId,
    isGlobal: data.isGlobal ?? true,
    createdAt: now,
    updatedAt: now,
  });
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, payload);
  return getExerciseById(id) as Promise<Exercise>;
}

/**
 * Atualiza um exercício existente.
 */
export async function updateExercise(
  id: string,
  data: Partial<Omit<Exercise, 'id' | 'createdBy' | 'createdAt'>>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const payload = removeUndefined({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(ref, payload);
}

/**
 * Remove um ou mais exercícios.
 */
export async function deleteExercises(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteDoc(doc(db, COLLECTION, id))));
}
