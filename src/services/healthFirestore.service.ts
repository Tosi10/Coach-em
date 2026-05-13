/**
 * Coach'em - Serviço Firestore de saúde (Pro+ Health)
 *
 * Persistência de dados de saúde no Firestore:
 *  - **Consentimento do atleta** em `users/{uid}.healthIntegration`.
 *  - **Cache do plano do treinador** em `users/{uid}.proPlusHealth` (autoridade real é RevenueCat).
 *  - **Resumo de saúde por treino** em
 *    `coachemAssignedWorkouts/{workoutId}/health/{athleteUid}`.
 *
 * Princípios:
 *  - Apenas **agregados** vão para o Firestore. A série crua de FC (`hrSeries`) fica
 *    apenas no telefone (não persistida).
 *  - Nenhuma função aqui dispara hooks UI; apenas leituras/escritas.
 *  - Todas as funções tratam erros internamente e devolvem `null` ou estado neutro.
 *
 * Nota: as regras de segurança correspondentes serão aplicadas no Dia 7.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from './firebase.config';
import type {
  HealthPlatform,
  HealthSnapshot,
  HRAggregates,
  WorkoutSession,
} from '@/src/types/health';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const USERS_COLLECTION = 'users';
const ASSIGNED_WORKOUTS_COLLECTION = 'coachemAssignedWorkouts';
const HEALTH_SUBCOLLECTION = 'health';

// ---------------------------------------------------------------------------
// Tipos persistidos em Firestore
// ---------------------------------------------------------------------------

/**
 * Bloco gravado em `users/{uid}.healthIntegration` para representar o consentimento
 * do atleta em compartilhar saúde com o seu treinador.
 */
export interface HealthIntegrationDoc {
  /** O atleta autorizou compartilhar. */
  enabled: boolean;
  /** Plataforma usada na última autorização. */
  platform: HealthPlatform;
  /** Data da concessão. */
  permissionsGrantedAt: string | null;
  /** Data da última revogação. */
  permissionsRevokedAt: string | null;
  /** FCmáx informada manualmente pelo atleta (override). */
  fcMaxOverride: number | null;
  /** Idade informada manualmente (usada para estimar FCmáx se não houver override). */
  ageOverride: number | null;
}

/**
 * Bloco gravado em `users/{uid}.proPlusHealth` (cache da entitlement RevenueCat).
 * Apenas o coach lê isto para UI rápida; o RevenueCat continua sendo a autoridade.
 */
export interface ProPlusHealthDoc {
  active: boolean;
  since: string | null;
  via: 'apple' | 'google' | null;
}

/**
 * Snapshot persistido em
 * `coachemAssignedWorkouts/{workoutId}/health/{athleteUid}`.
 *
 * Versão "Firestore-friendly" do `HealthSnapshot`:
 *  - `Date` → `Timestamp`.
 *  - Sem `hrSeries` (mantida só em memória).
 *  - Apenas agregados de FC.
 */
export interface HealthSnapshotDoc {
  collectedAt: Timestamp;
  startedAt: Timestamp;
  completedAt: Timestamp;
  source: HealthPlatform;
  device: string | null;
  heartRate: HRAggregates | null;
  caloriesActive: number | null;
  distanceMeters: number | null;
  steps: number | null;
  workoutSessions: WorkoutSession[];
  notes: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

function dateToTimestamp(value: Date): Timestamp {
  return Timestamp.fromDate(value);
}

/** Converte snapshot do app → versão Firestore (sem série bruta de FC). */
export function toFirestoreSnapshot(snapshot: HealthSnapshot): HealthSnapshotDoc {
  return {
    collectedAt: dateToTimestamp(snapshot.collectedAt),
    startedAt: dateToTimestamp(snapshot.startedAt),
    completedAt: dateToTimestamp(snapshot.completedAt),
    source: snapshot.source,
    device: snapshot.device,
    heartRate: snapshot.heartRate,
    caloriesActive: snapshot.caloriesActive,
    distanceMeters: snapshot.distanceMeters,
    steps: snapshot.steps,
    workoutSessions: snapshot.workoutSessions,
    notes: snapshot.notes,
  };
}

/** Converte versão Firestore → snapshot do app (sem série; vinda do banco). */
export function fromFirestoreSnapshot(doc: HealthSnapshotDoc): HealthSnapshot {
  return {
    collectedAt: doc.collectedAt.toDate(),
    startedAt: doc.startedAt.toDate(),
    completedAt: doc.completedAt.toDate(),
    source: doc.source,
    device: doc.device,
    heartRate: doc.heartRate,
    hrSeries: [],
    caloriesActive: doc.caloriesActive,
    distanceMeters: doc.distanceMeters,
    steps: doc.steps,
    workoutSessions: doc.workoutSessions,
    notes: doc.notes,
  };
}

// ---------------------------------------------------------------------------
// Consentimento do atleta (users/{uid}.healthIntegration)
// ---------------------------------------------------------------------------

/** Lê o estado atual de consentimento do atleta. `null` se nunca foi configurado. */
export async function getHealthIntegration(uid: string): Promise<HealthIntegrationDoc | null> {
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    const data = snap.data()?.healthIntegration;
    if (!data || typeof data !== 'object') return null;
    return {
      enabled: Boolean(data.enabled),
      platform: (data.platform ?? null) as HealthPlatform,
      permissionsGrantedAt: typeof data.permissionsGrantedAt === 'string' ? data.permissionsGrantedAt : null,
      permissionsRevokedAt: typeof data.permissionsRevokedAt === 'string' ? data.permissionsRevokedAt : null,
      fcMaxOverride: typeof data.fcMaxOverride === 'number' ? data.fcMaxOverride : null,
      ageOverride: typeof data.ageOverride === 'number' ? data.ageOverride : null,
    };
  } catch {
    return null;
  }
}

/** Marca o consentimento como ativo (atleta autorizou). */
export async function markHealthIntegrationGranted(
  uid: string,
  platform: HealthPlatform,
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      healthIntegration: {
        enabled: true,
        platform,
        permissionsGrantedAt: nowIso(),
        permissionsRevokedAt: null,
      },
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Falha silenciosa — UI mostra estado neutro.
  }
}

/** Marca o consentimento como revogado (atleta desligou). */
export async function markHealthIntegrationRevoked(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      'healthIntegration.enabled': false,
      'healthIntegration.permissionsRevokedAt': nowIso(),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // idem.
  }
}

/** Atualiza overrides do atleta (FCmáx manual, idade). */
export async function updateHealthIntegrationOverrides(
  uid: string,
  patch: Partial<Pick<HealthIntegrationDoc, 'fcMaxOverride' | 'ageOverride'>>,
): Promise<void> {
  try {
    const updates: Record<string, unknown> = {};
    if ('fcMaxOverride' in patch) {
      updates['healthIntegration.fcMaxOverride'] = patch.fcMaxOverride ?? null;
    }
    if ('ageOverride' in patch) {
      updates['healthIntegration.ageOverride'] = patch.ageOverride ?? null;
    }
    if (Object.keys(updates).length === 0) return;
    updates.updatedAt = serverTimestamp();
    await updateDoc(doc(db, USERS_COLLECTION, uid), updates);
  } catch {
    // idem.
  }
}

// ---------------------------------------------------------------------------
// Snapshot de treino (coachemAssignedWorkouts/{id}/health/{uid})
// ---------------------------------------------------------------------------

/**
 * Grava o resumo de saúde de um treino para um atleta.
 *
 * O id do documento é o `athleteUid` para garantir 1 snapshot por (treino, atleta).
 */
export async function saveHealthSnapshot(
  workoutId: string,
  athleteUid: string,
  snapshot: HealthSnapshot,
): Promise<boolean> {
  try {
    const ref = doc(
      db,
      ASSIGNED_WORKOUTS_COLLECTION,
      workoutId,
      HEALTH_SUBCOLLECTION,
      athleteUid,
    );
    await setDoc(ref, toFirestoreSnapshot(snapshot), { merge: false });
    return true;
  } catch {
    return false;
  }
}

/** Lê o snapshot de saúde de um treino para um atleta específico. */
export async function getHealthSnapshot(
  workoutId: string,
  athleteUid: string,
): Promise<HealthSnapshot | null> {
  try {
    const ref = doc(
      db,
      ASSIGNED_WORKOUTS_COLLECTION,
      workoutId,
      HEALTH_SUBCOLLECTION,
      athleteUid,
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return fromFirestoreSnapshot(snap.data() as HealthSnapshotDoc);
  } catch {
    return null;
  }
}

/**
 * Lista snapshots de saúde para todos os treinos de um atleta sob um treinador.
 *
 * Para o coach montar painel de histórico no perfil do atleta.
 * **Nota:** requer índice composto (será criado no Sprint 4 quando montarmos o painel).
 */
export async function listAthleteHealthSnapshots(
  coachId: string,
  athleteUid: string,
): Promise<HealthSnapshot[]> {
  try {
    // 1. Busca treinos do atleta sob este coach.
    const workoutsQ = query(
      collection(db, ASSIGNED_WORKOUTS_COLLECTION),
      where('coachId', '==', coachId),
      where('athleteId', '==', athleteUid),
    );
    const workoutsSnap = await getDocs(workoutsQ);

    // 2. Para cada treino, busca snapshot do atleta.
    const snapshots: HealthSnapshot[] = [];
    for (const workoutDoc of workoutsSnap.docs) {
      const healthRef = doc(
        db,
        ASSIGNED_WORKOUTS_COLLECTION,
        workoutDoc.id,
        HEALTH_SUBCOLLECTION,
        athleteUid,
      );
      const healthSnap = await getDoc(healthRef);
      if (healthSnap.exists()) {
        snapshots.push(fromFirestoreSnapshot(healthSnap.data() as HealthSnapshotDoc));
      }
    }

    return snapshots;
  } catch {
    return [];
  }
}
