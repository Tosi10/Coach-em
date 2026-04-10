/**
 * Serviço de Exercícios – Firestore (coleção coachemExercises)
 *
 * Exercícios criados pelo treinador são salvos aqui e aparecem na biblioteca.
 * Cada documento pode ter coachId (createdBy) para filtrar por treinador.
 */

import {
  collection,
  deleteField,
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
import type { Exercise, WorkoutBlockData, WorkoutExercise } from '@/src/types';

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
  return snap.docs
    .filter((d) => {
      const data = d.data();
      return !data?.deletedAt;
    })
    .map(docToExercise);
}

/**
 * Busca um exercício pelo id.
 */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data?.deletedAt) return null;
  return docToExercise(snap);
}

/**
 * Mescla cada `exerciseId` com o documento atual em `coachemExercises`.
 * Treinos atribuídos guardam uma cópia dos blocos; assim o vídeo e demais campos
 * passam a refletir a biblioteca mesmo se o template estava desatualizado.
 */
export async function enrichWorkoutBlocksWithLatestExercises(
  blocks: WorkoutBlockData[]
): Promise<WorkoutBlockData[]> {
  if (!blocks?.length) return blocks;
  const ids = new Set<string>();
  for (const b of blocks) {
    for (const we of b.exercises || []) {
      if (we?.exerciseId) ids.add(we.exerciseId);
    }
  }
  if (ids.size === 0) return blocks;

  const cache = new Map<string, Exercise | null>();
  await Promise.all(
    [...ids].map(async (id) => {
      try {
        cache.set(id, await getExerciseById(id));
      } catch {
        cache.set(id, null);
      }
    })
  );

  return blocks.map((block) => ({
    ...block,
    exercises: (block.exercises || []).map((we: WorkoutExercise) => {
      const latest = cache.get(we.exerciseId);
      if (!latest) return we;
      return {
        ...we,
        exercise: {
          ...(we.exercise || {}),
          ...latest,
        },
      };
    }),
  }));
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
 * Passe `videoURL: null` para remover o vídeo do documento (deleteField).
 */
export async function updateExercise(
  id: string,
  data: Partial<Omit<Exercise, 'id' | 'createdBy' | 'createdAt'>> & { videoURL?: string | null }
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const { videoURL, ...rest } = data;
  const payload: Record<string, unknown> = removeUndefined({
    ...rest,
    updatedAt: new Date().toISOString(),
  });
  if (videoURL === null) {
    payload.videoURL = deleteField();
  } else if (videoURL !== undefined) {
    payload.videoURL = videoURL;
  }
  await updateDoc(ref, payload as { [x: string]: unknown });
}

/**
 * Remove um ou mais exercícios.
 */
export async function deleteExercises(ids: string[]): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all(
    ids.map((id) =>
      updateDoc(doc(db, COLLECTION, id), {
        deletedAt: now,
        updatedAt: now,
      })
    )
  );
}
