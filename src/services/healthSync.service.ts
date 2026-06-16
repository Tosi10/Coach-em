/**
 * Sincroniza métricas de saúde após conclusão de treino (opt-in).
 */

import { doc, getDoc } from 'firebase/firestore';

import { getHealthService } from '@/src/services/health.service';
import {
  getHealthIntegration,
  saveHealthSnapshot,
} from '@/src/services/healthFirestore.service';
import { HEALTH_FEATURES_ENABLED } from '@/src/constants/featureFlags';
import { canUseHealthForAthlete } from '@/src/utils/athleteCapabilities';
import { db } from '@/src/services/firebase.config';
import { UserType, type User } from '@/src/types';

const ATHLETES_COLLECTION = 'coachemAthletes';

/** Resolve `users/{uid}` a partir do `athleteId` do treino atribuído. */
export async function resolveAthleteUserUid(athleteId: string): Promise<string | null> {
  if (!athleteId) return null;

  try {
    const athleteSnap = await getDoc(doc(db, ATHLETES_COLLECTION, athleteId));
    if (athleteSnap.exists()) {
      const authUid = athleteSnap.data()?.authUid;
      if (typeof authUid === 'string' && authUid.trim()) {
        return authUid.trim();
      }
    }
  } catch {
    // tenta usar athleteId como uid de conta
  }

  try {
    const userSnap = await getDoc(doc(db, 'users', athleteId));
    if (userSnap.exists()) {
      return athleteId;
    }
  } catch {
    // noop
  }

  return athleteId;
}

/**
 * Lê a janela do treino no HealthKit / Health Connect e grava em Firestore.
 * Nunca lança — falhas ficam só em `notes` ou log silencioso.
 *
 * O id do doc em `health/{id}` deve ser o mesmo `athleteId` do treino atribuído
 * (regras Firestore). O consentimento continua em `users/{authUid}`.
 */
export async function syncHealthAfterWorkoutComplete(
  workoutId: string,
  athleteId: string,
  startedAt: Date,
  completedAt: Date,
  athleteUserUidHint?: string | null,
): Promise<void> {
  try {
    if (!HEALTH_FEATURES_ENABLED) return;

    const healthDocId = athleteId.trim();
    if (!healthDocId) return;

    const authUid =
      athleteUserUidHint?.trim() || (await resolveAthleteUserUid(healthDocId));
    if (!authUid) return;

    const integration = await getHealthIntegration(authUid);
    if (!integration?.enabled) return;

    const userSnap = await getDoc(doc(db, 'users', authUid));
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    const canUse = await canUseHealthForAthlete({
      id: authUid,
      userType: UserType.ATHLETE,
      email: typeof userData.email === 'string' ? userData.email : '',
      displayName: typeof userData.displayName === 'string' ? userData.displayName : '',
      athleteMode: userData.athleteMode,
      coachId: userData.coachId,
      subscriptionTier: userData.subscriptionTier,
    } as User);
    if (!canUse) return;

    const health = getHealthService();
    const snapshot = await health.readWindow(startedAt, completedAt);

    if (!snapshot.source) {
      return;
    }

    const hasData =
      snapshot.heartRate != null ||
      snapshot.caloriesActive != null ||
      snapshot.distanceMeters != null ||
      snapshot.steps != null ||
      snapshot.workoutSessions.length > 0;

    if (!hasData && snapshot.notes.length > 0) {
      // Grava mesmo assim para o treinador ver que tentámos (notas explicativas).
    }

    await saveHealthSnapshot(workoutId, healthDocId, snapshot);
  } catch (error) {
    console.warn('[HealthSync] sync skipped:', error);
  }
}
