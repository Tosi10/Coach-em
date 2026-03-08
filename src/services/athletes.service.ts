/**
 * Serviço de Atletas – Firestore (coleção coachemAthletes)
 *
 * Atletas cadastrados pelo treinador. Cada documento tem coachId para filtrar.
 * Use o id do documento como athleteId ao atribuir treinos.
 *
 * createAthleteWithLogin: chama a Cloud Function para criar conta (Auth + users + coachemAthletes).
 * O atleta consegue fazer login com o email e a senha provisória.
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
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase.config';

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

export interface CreateAthleteWithLoginData {
  displayName: string;
  email: string;
  temporaryPassword: string;
  sport?: string;
}

/**
 * Cria atleta com conta de login (email + senha provisória) via Cloud Function.
 * O atleta fica vinculado ao treinador e pode fazer login no app.
 * Retorna o athleteId (uid do Auth) para uso em atribuição de treinos.
 */
export async function createAthleteWithLogin(
  data: CreateAthleteWithLoginData
): Promise<{ athleteId: string }> {
  const createAthleteByCoach = httpsCallable<
    CreateAthleteWithLoginData,
    { data: { athleteId: string } }
  >(functions, 'createAthleteByCoach');

  try {
    const res = await createAthleteByCoach({
      displayName: data.displayName.trim(),
      email: data.email.trim().toLowerCase(),
      temporaryPassword: data.temporaryPassword,
      sport: data.sport?.trim(),
    });
    const result = res.data as { athleteId: string };
    if (!result?.athleteId) throw new Error('Resposta inválida da função.');
    return { athleteId: result.athleteId };
  } catch (err: any) {
    const code = err?.code ?? err?.details?.code;
    const msg = err?.message ?? err?.details?.message ?? '';
    if (code === 'unauthenticated') throw new Error('É preciso estar logado.');
    if (code === 'permission-denied') throw new Error('Apenas treinadores podem cadastrar atletas com login.');
    if (code === 'already-exists') throw new Error('Já existe uma conta com este email.');
    if (code === 'invalid-argument') throw new Error(msg || 'Dados inválidos.');
    if (msg.includes('email-already-exists') || msg.includes('already in use')) {
      throw new Error('Já existe uma conta com este email.');
    }
    throw new Error(msg || 'Não foi possível criar o atleta. Verifique se a Cloud Function está publicada.');
  }
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
