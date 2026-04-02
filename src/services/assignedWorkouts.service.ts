/**
 * Serviço de Treinos Atribuídos – Firestore (coleção coachemAssignedWorkouts)
 *
 * Passo 2 da migração: substitui AsyncStorage assigned_workouts por Firestore.
 * Cada documento tem coachId e athleteId para consultas por treinador ou atleta.
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
  writeBatch,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { parseFeedbackLevelFromFirestore } from '@/src/utils/feedbackIcons';
import { db } from './firebase.config';

const COLLECTION = 'coachemAssignedWorkouts';

function normalizeWorkoutStatus(rawStatus: unknown): string {
  const value = String(rawStatus ?? '').trim().toLowerCase();
  if (!value) return 'Pendente';

  // Normaliza variacoes antigas/inconsistentes para manter os graficos corretos.
  if (value === 'concluído' || value === 'concluido' || value === 'completed' || value === 'done') {
    return 'Concluído';
  }
  if (value === 'pendente' || value === 'pending') {
    return 'Pendente';
  }

  // Mantem o valor original para nao perder estados futuros/customizados.
  return String(rawStatus);
}

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

/** Formato de um treino atribuído (como usado no app). */
export interface AssignedWorkoutDoc {
  id: string;
  workoutTemplateId: string;
  name: string;
  description?: string;
  athleteId: string;
  coachId: string;
  scheduledDate: string;
  date: string;
  scheduledTime?: string;
  status: string;
  coach?: string;
  dayOfWeek?: string;
  isToday?: boolean;
  isThisWeek?: boolean;
  createdAt: string;
  blocks: any[];
  isRecurring?: boolean;
  recurrenceGroupId?: string | null;
  completedDate?: string;
  feedback?: number;
  feedbackEmoji?: string;
  feedbackText?: string;
}

function docToAssigned(docSnap: DocumentSnapshot): AssignedWorkoutDoc {
  const data = docSnap.data()!;
  const createdAt = data.createdAt instanceof Timestamp
    ? data.createdAt.toDate().toISOString()
    : (data.createdAt as string) || new Date().toISOString();
  const completedDate = data.completedDate
    ? (data.completedDate instanceof Timestamp
        ? data.completedDate.toDate().toISOString()
        : (data.completedDate as string))
    : undefined;
  return {
    id: docSnap.id,
    workoutTemplateId: data.workoutTemplateId,
    name: data.name,
    description: data.description,
    athleteId: data.athleteId,
    coachId: data.coachId,
    scheduledDate: data.scheduledDate,
    date: data.date,
    scheduledTime: data.scheduledTime,
    status: normalizeWorkoutStatus(data.status),
    coach: data.coach,
    dayOfWeek: data.dayOfWeek,
    isToday: data.isToday,
    isThisWeek: data.isThisWeek,
    createdAt,
    blocks: data.blocks || [],
    isRecurring: data.isRecurring,
    recurrenceGroupId: data.recurrenceGroupId ?? null,
    completedDate,
    feedback: (() => {
      const v = parseFeedbackLevelFromFirestore(data.feedback);
      return v === null ? undefined : v;
    })(),
    feedbackEmoji: data.feedbackEmoji,
    feedbackText: data.feedbackText,
  };
}

/**
 * Cria vários treinos atribuídos em batch (ex.: atribuição recorrente).
 */
export async function createAssignedWorkouts(
  coachId: string,
  assignments: Omit<AssignedWorkoutDoc, 'coachId'>[]
): Promise<AssignedWorkoutDoc[]> {
  const batch = writeBatch(db);
  const result: AssignedWorkoutDoc[] = [];

  for (const a of assignments) {
    const ref = doc(db, COLLECTION, a.id);
    const payload = removeUndefined({
      ...a,
      coachId,
    });
    batch.set(ref, payload);
    result.push({ ...a, coachId });
  }

  await batch.commit();
  return result;
}

/**
 * Lista treinos atribuídos a um atleta.
 */
export async function listAssignedWorkoutsByAthleteId(athleteId: string): Promise<AssignedWorkoutDoc[]> {
  const q = query(collection(db, COLLECTION), where('athleteId', '==', athleteId));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => docToAssigned(d));
  list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return list;
}

/**
 * Lista treinos atribuídos criados por um treinador.
 */
export async function listAssignedWorkoutsByCoachId(coachId: string): Promise<AssignedWorkoutDoc[]> {
  const q = query(collection(db, COLLECTION), where('coachId', '==', coachId));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => docToAssigned(d));
  list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return list;
}

/**
 * Busca um treino atribuído pelo ID.
 */
export async function getAssignedWorkoutById(id: string): Promise<AssignedWorkoutDoc | null> {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? docToAssigned(snapshot) : null;
}

/**
 * Atualiza um treino atribuído (status, feedback ou conteúdo: nome, descrição, blocos).
 */
export async function updateAssignedWorkout(
  id: string,
  data: {
    status?: string;
    completedDate?: string;
    feedback?: number;
    feedbackEmoji?: string;
    feedbackText?: string;
    name?: string;
    description?: string;
    blocks?: any[];
  }
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const updates: Record<string, unknown> = {};
  if (data.status !== undefined) updates.status = data.status;
  if (data.completedDate !== undefined) updates.completedDate = data.completedDate;
  if (data.feedback !== undefined) updates.feedback = data.feedback;
  if (data.feedbackEmoji !== undefined) updates.feedbackEmoji = data.feedbackEmoji;
  if (data.feedbackText !== undefined) updates.feedbackText = data.feedbackText;
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.blocks !== undefined) updates.blocks = removeUndefined(data.blocks);
  if (Object.keys(updates).length === 0) return;
  await updateDoc(ref, updates);
}

/**
 * Remove um ou mais treinos atribuídos.
 */
export async function deleteAssignedWorkouts(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  for (const id of ids) {
    batch.delete(doc(db, COLLECTION, id));
  }
  await batch.commit();
}
