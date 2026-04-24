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
const ASSIGNED_WORKOUTS_COLLECTION = 'coachemAssignedWorkouts';

export interface AthleteDoc {
  id: string;
  coachId: string;
  name: string;
  sport?: string;
  status?: string;
  /** Mesmo uid do Auth quando criado pela Cloud Function (doc id costuma ser igual). */
  authUid?: string;
  /** URL pública (Storage) – espelha users/{uid}.photoURL quando o atleta tem conta. */
  photoURL?: string;
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
    authUid: typeof data.authUid === 'string' ? data.authUid : undefined,
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
    createdAt: toStr(data.createdAt),
    updatedAt: toStr(data.updatedAt),
  };
}

/** Quando coachemAthletes não tem photoURL, tenta users (treinador precisa das regras que permitem leitura). */
async function enrichAthletePhotoFromUsersDoc(a: AthleteDoc): Promise<AthleteDoc> {
  if (a.photoURL) return a;
  const tryIds = [...new Set([a.authUid, a.id].filter(Boolean) as string[])];
  for (const uid of tryIds) {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      const url = userSnap.data()?.photoURL;
      if (typeof url === 'string' && url.length > 0) {
        return { ...a, photoURL: url };
      }
    } catch {
      // sem permissão ou rede
    }
  }
  return a;
}

export async function listAthletesByCoachId(coachId: string): Promise<AthleteDoc[]> {
  const q = query(
    collection(db, COLLECTION),
    where('coachId', '==', coachId)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map(docToAthlete);
  return Promise.all(list.map((a) => enrichAthletePhotoFromUsersDoc(a)));
}

export async function getAthleteById(id: string): Promise<AthleteDoc | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return enrichAthletePhotoFromUsersDoc(docToAthlete(snap));
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
    { athleteId: string }
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
    if (code === 'failed-precondition' && msg.toLowerCase().includes('limite do plano gratuito')) {
      throw new Error(msg);
    }
    if (code === 'already-exists') throw new Error('Já existe uma conta com este email.');
    if (code === 'invalid-argument') throw new Error(msg || 'Dados inválidos.');
    if (code === 'functions/resource-exhausted' || code === 'resource-exhausted') {
      throw new Error(
        'Limite de cadastros de atletas com email nesta hora. Tente novamente mais tarde.'
      );
    }
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

/**
 * Bloqueia/desbloqueia o acesso de login do atleta no app.
 * Atualiza status em coachemAthletes e espelha em users/{uid} quando existir.
 */
export async function setAthleteBlockedStatus(id: string, blocked: boolean): Promise<void> {
  const now = new Date().toISOString();
  const status = blocked ? 'Bloqueado' : 'Ativo';

  // Fonte principal da gestão do atleta no app
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    updatedAt: now,
  });

  // Espelha no perfil de login (users) para facilitar validações de auth
  try {
    await updateDoc(doc(db, 'users', id), {
      status,
      blockedAt: blocked ? now : null,
      updatedAt: now,
    });
  } catch {
    // Pode não existir em casos legados sem conta de Auth vinculada.
  }
}

/**
 * Espelha informações públicas do treinador nos docs dos atletas vinculados.
 * Isso permite que o atleta veja nome/mensagem/foto do treinador sem depender
 * de leitura direta em users/{coachId}.
 */
export async function syncCoachPublicProfileToAthletes(
  coachId: string,
  data: {
    coachPublicName?: string;
    coachWelcomeMessage?: string;
    coachPhotoURL?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const updatePayload = removeUndefined({
    coachPublicName: data.coachPublicName,
    coachWelcomeMessage: data.coachWelcomeMessage,
    coachPhotoURL: data.coachPhotoURL,
    updatedAt: now,
  });

  const refsToUpdate = new Map<string, any>();
  const athleteAccountIds = new Set<string>();

  // Caminho principal: atletas vinculados pelo coachId
  const byCoachQ = query(collection(db, COLLECTION), where('coachId', '==', coachId));
  const byCoachSnap = await getDocs(byCoachQ);
  byCoachSnap.docs.forEach((d) => {
    refsToUpdate.set(d.ref.path, d.ref);
    const row = d.data() as any;
    if (typeof d.id === 'string' && d.id.trim()) athleteAccountIds.add(d.id);
    if (typeof row?.authUid === 'string' && row.authUid.trim()) athleteAccountIds.add(row.authUid);
  });

  // Caminho robusto: atletas encontrados nos treinos atribuídos desse treinador
  // (cobre bases legadas onde coachId do atleta pode não estar consistente)
  const workoutsQ = query(
    collection(db, ASSIGNED_WORKOUTS_COLLECTION),
    where('coachId', '==', coachId)
  );
  const workoutsSnap = await getDocs(workoutsQ);
  const athleteIdsFromWorkouts = [
    ...new Set(
      workoutsSnap.docs
        .map((d) => d.data()?.athleteId)
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    ),
  ];

  for (const athleteId of athleteIdsFromWorkouts) {
    athleteAccountIds.add(athleteId);
    try {
      // Tenta por id direto do doc
      const directRef = doc(db, COLLECTION, athleteId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        refsToUpdate.set(directRef.path, directRef);
      }
    } catch {
      // ignora e tenta por authUid
    }

    try {
      // Tenta docs legados com authUid = athleteId
      const legacyQ = query(collection(db, COLLECTION), where('authUid', '==', athleteId));
      const legacySnap = await getDocs(legacyQ);
      legacySnap.docs.forEach((d) => {
        refsToUpdate.set(d.ref.path, d.ref);
        const row = d.data() as any;
        if (typeof d.id === 'string' && d.id.trim()) athleteAccountIds.add(d.id);
        if (typeof row?.authUid === 'string' && row.authUid.trim()) athleteAccountIds.add(row.authUid);
      });
    } catch {
      // ignora docs sem permissão/ausentes
    }
  }

  // Atualiza docs em coachemAthletes quando existirem
  if (refsToUpdate.size > 0) {
    await Promise.all(
      Array.from(refsToUpdate.values()).map((ref) => updateDoc(ref, updatePayload))
    );
  }

  // Nota: não gravamos em users/{atleta} — nas regras atuais só o próprio usuário pode
  // atualizar o próprio users/{uid}. O atleta lê coach* em coachemAthletes.

  // Espelha também nos treinos atribuídos para leitura direta no Home do atleta.
  // Isso reduz dependência de vínculos legados em coachemAthletes.
  await Promise.all(
    workoutsSnap.docs.map((d) =>
      updateDoc(
        d.ref,
        removeUndefined({
          coachPublicName: data.coachPublicName,
          coachWelcomeMessage: data.coachWelcomeMessage,
          coachPhotoURL: data.coachPhotoURL,
        })
      )
    )
  );

  // E para bases legadas onde treino não tem coachId consistente,
  // atualiza treinos por athleteId dos atletas vinculados.
  await Promise.all(
    Array.from(athleteAccountIds).map(async (athleteUid) => {
      try {
        const byAthleteQ = query(
          collection(db, ASSIGNED_WORKOUTS_COLLECTION),
          where('athleteId', '==', athleteUid)
        );
        const byAthleteSnap = await getDocs(byAthleteQ);
        await Promise.all(
          byAthleteSnap.docs.map((d) =>
            updateDoc(
              d.ref,
              removeUndefined({
                coachPublicName: data.coachPublicName,
                coachWelcomeMessage: data.coachWelcomeMessage,
                coachPhotoURL: data.coachPhotoURL,
              })
            )
          )
        );
      } catch {
        // ignora falhas pontuais
      }
    })
  );
}

export async function deleteAthlete(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
