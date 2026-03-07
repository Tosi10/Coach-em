/**
 * Serviço de Templates de Treino – Firestore (coleção coachemWorkoutTemplates)
 *
 * Passo 1 da migração: substitui leitura/escrita em AsyncStorage por Firestore.
 * Todos os templates são vinculados ao coach (coachId = uid do usuário logado).
 */

import { WorkoutBlockData } from '@/src/types';
import {
  collection,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase.config';

const COLLECTION = 'coachemWorkoutTemplates';

/**
 * Remove campos undefined de um objeto/array (o Firestore não aceita undefined).
 * Usado antes de setDoc/updateDoc para evitar FirebaseError.
 */
function removeUndefined<T>(obj: T): T {
  if (obj === undefined || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefined(item)) as T;
  }
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        out[key] = removeUndefined(value);
      }
    }
    return out as T;
  }
  return obj;
}

/** Formato do documento no Firestore (com timestamps nativos). */
export interface WorkoutTemplateDoc {
  id: string;
  name: string;
  description?: string;
  coachId: string;
  blocks: WorkoutBlockData[];
  isActive: boolean;
  createdAt: string | ReturnType<typeof serverTimestamp>;
  updatedAt: string | ReturnType<typeof serverTimestamp>;
}

/** Formato retornado para o app (createdAt/updatedAt como string). */
export interface WorkoutTemplateForApp {
  id: string;
  name: string;
  description?: string;
  coachId: string;
  blocks: WorkoutBlockData[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toAppTemplate(docSnap: DocumentSnapshot): WorkoutTemplateForApp | null {
  const data = docSnap.data();
  if (!data) return null;
  const createdAt = data.createdAt instanceof Timestamp
    ? data.createdAt.toDate().toISOString()
    : (data.createdAt as string) || new Date().toISOString();
  const updatedAt = data.updatedAt instanceof Timestamp
    ? data.updatedAt.toDate().toISOString()
    : (data.updatedAt as string) || new Date().toISOString();
  return {
    id: docSnap.id,
    name: data.name,
    description: data.description,
    coachId: data.coachId,
    blocks: data.blocks || [],
    isActive: data.isActive !== false,
    createdAt,
    updatedAt,
  };
}

/**
 * Lista todos os templates de um treinador.
 */
export async function listWorkoutTemplatesByCoachId(coachId: string): Promise<WorkoutTemplateForApp[]> {
  const q = query(collection(db, COLLECTION), where('coachId', '==', coachId));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => toAppTemplate(d)!).filter(Boolean);
  list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return list;
}

/**
 * Busca um template pelo ID (document id = template id).
 */
export async function getWorkoutTemplateById(templateId: string): Promise<WorkoutTemplateForApp | null> {
  const ref = doc(db, COLLECTION, templateId);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? toAppTemplate(snapshot) : null;
}

/**
 * Cria um novo template. O id pode ser passado (ex.: workout_123) ou gerado.
 */
export async function createWorkoutTemplate(
  coachId: string,
  data: {
    id: string;
    name: string;
    description?: string;
    blocks: WorkoutBlockData[];
  }
): Promise<WorkoutTemplateForApp> {
  const ref = doc(db, COLLECTION, data.id);
  const payload = {
    name: data.name,
    description: data.description ?? '',
    coachId,
    blocks: removeUndefined(data.blocks),
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    coachId,
    blocks: data.blocks,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Atualiza um template existente.
 */
export async function updateWorkoutTemplate(
  templateId: string,
  data: { name?: string; description?: string; blocks?: WorkoutBlockData[] }
): Promise<void> {
  const ref = doc(db, COLLECTION, templateId);
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.blocks !== undefined) updates.blocks = removeUndefined(data.blocks);
  await updateDoc(ref, updates);
}

/**
 * Remove um template.
 */
export async function deleteWorkoutTemplate(templateId: string): Promise<void> {
  const ref = doc(db, COLLECTION, templateId);
  await deleteDoc(ref);
}
