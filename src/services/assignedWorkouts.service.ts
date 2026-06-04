/**
 * Serviço de Treinos Atribuídos – Firestore (coleção coachemAssignedWorkouts)
 *
 * Passo 2 da migração: substitui AsyncStorage assigned_workouts por Firestore.
 * Cada documento tem coachId e athleteId para consultas por treinador ou atleta.
 */

import { parseFeedbackLevelFromFirestore } from '@/src/utils/feedbackIcons';
import {
    collection,
    doc,
    DocumentSnapshot,
    getDoc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import type { User } from '@/src/types';
import { filterAssignedWorkoutsAfterCoachUnlink } from '@/src/utils/coachUnlinkGrace';
import { db } from './firebase.config';
import { enrichWorkoutBlocksWithLatestExercises } from './exercises.service';

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
  coachPublicName?: string;
  dayOfWeek?: string;
  isToday?: boolean;
  isThisWeek?: boolean;
  createdAt: string;
  blocks: any[];
  isRecurring?: boolean;
  recurrenceGroupId?: string | null;
  completedDate?: string;
  /** Início da sessão (atleta tocou Iniciar treino). ISO 8601. */
  startedAt?: string;
  /** Fim da sessão (atleta concluiu). ISO 8601 — alinhado a `completedDate`. */
  completedAt?: string;
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
  const startedAt = data.startedAt
    ? (data.startedAt instanceof Timestamp
        ? data.startedAt.toDate().toISOString()
        : (data.startedAt as string))
    : undefined;
  const completedAtField = data.completedAt
    ? (data.completedAt instanceof Timestamp
        ? data.completedAt.toDate().toISOString()
        : (data.completedAt as string))
    : completedDate;
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
    coachPublicName: data.coachPublicName,
    dayOfWeek: data.dayOfWeek,
    isToday: data.isToday,
    isThisWeek: data.isThisWeek,
    createdAt,
    blocks: data.blocks || [],
    isRecurring: data.isRecurring,
    recurrenceGroupId: data.recurrenceGroupId ?? null,
    completedDate,
    startedAt,
    completedAt: completedAtField,
    feedback: (() => {
      const v = parseFeedbackLevelFromFirestore(data.feedback);
      return v === null ? undefined : v;
    })(),
    feedbackEmoji: data.feedbackEmoji,
    feedbackText: data.feedbackText,
  };
}

async function hydrateAssignedWorkout(workout: AssignedWorkoutDoc): Promise<AssignedWorkoutDoc> {
  return {
    ...workout,
    blocks: await enrichWorkoutBlocksWithLatestExercises(workout.blocks || []),
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
export async function listAssignedWorkoutsByAthleteId(
  athleteId: string,
  options?: { viewer?: User | null; coachId?: string | null }
): Promise<AssignedWorkoutDoc[]> {
  const constraints = [where('athleteId', '==', athleteId)];
  if (options?.coachId) {
    constraints.push(where('coachId', '==', options.coachId));
  }
  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);
  let list = await Promise.all(snapshot.docs.map((d) => hydrateAssignedWorkout(docToAssigned(d))));
  list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (options?.viewer) {
    list = filterAssignedWorkoutsAfterCoachUnlink(list, options.viewer);
  }
  return list;
}

/**
 * Lista treinos atribuídos criados por um treinador.
 */
export async function listAssignedWorkoutsByCoachId(coachId: string): Promise<AssignedWorkoutDoc[]> {
  const q = query(collection(db, COLLECTION), where('coachId', '==', coachId));
  const snapshot = await getDocs(q);
  const list = await Promise.all(snapshot.docs.map((d) => hydrateAssignedWorkout(docToAssigned(d))));
  list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return list;
}

/**
 * Busca um treino atribuído pelo ID.
 */
export async function getAssignedWorkoutById(id: string): Promise<AssignedWorkoutDoc | null> {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? hydrateAssignedWorkout(docToAssigned(snapshot)) : null;
}

/**
 * Atualiza um treino atribuído (status, feedback ou conteúdo: nome, descrição, blocos).
 */
export async function updateAssignedWorkout(
  id: string,
  data: {
    status?: string;
    completedDate?: string;
    startedAt?: string;
    completedAt?: string;
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
  if (data.startedAt !== undefined) updates.startedAt = data.startedAt;
  if (data.completedAt !== undefined) updates.completedAt = data.completedAt;
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
 * Marca o início da sessão (`startedAt`). Idempotente se já existir.
 * @returns ISO do início gravado.
 */
export async function markAssignedWorkoutStarted(id: string): Promise<string> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('assigned_workout_not_found');
  }

  const existing = snap.data()?.startedAt;
  if (existing) {
    return existing instanceof Timestamp
      ? existing.toDate().toISOString()
      : String(existing);
  }

  const startedAt = new Date().toISOString();
  await updateDoc(ref, { startedAt });
  return startedAt;
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
