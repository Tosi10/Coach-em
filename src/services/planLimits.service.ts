import {
  getLimitsForTier,
  type PlanResource,
  type SubscriptionTier,
} from '@/src/constants/freePlan';
import { db } from '@/src/services/firebase.config';
import { listAthletesByCoachId } from '@/src/services/athletes.service';
import { listExercisesByCoachId } from '@/src/services/exercises.service';
import { listWorkoutTemplatesByCoachId } from '@/src/services/workoutTemplates.service';
import { doc, getDoc } from 'firebase/firestore';

type Usage = {
  athletes: number;
  workoutTemplates: number;
  exercises: number;
};

export class FreePlanLimitError extends Error {
  code: PlanResource;
  limit: number;

  constructor(code: PlanResource, limit: number, message: string) {
    super(message);
    this.name = 'FreePlanLimitError';
    this.code = code;
    this.limit = limit;
  }
}

function buildLimitMessage(
  resource: PlanResource,
  limit: number,
  tier: SubscriptionTier
): string {
  const planLabel = tier === 'pro' ? 'plano Pro' : 'plano gratuito';
  if (resource === 'athletes') {
    return `Você atingiu o limite do ${planLabel} (${limit} atletas). Para continuar, será necessário fazer upgrade ou ajustar seu plano.`;
  }
  if (resource === 'workoutTemplates') {
    return `Você atingiu o limite do ${planLabel} (${limit} treinos-modelo). Para continuar, será necessário fazer upgrade ou ajustar seu plano.`;
  }
  return `Você atingiu o limite do ${planLabel} (${limit} exercícios). Para continuar, será necessário fazer upgrade ou ajustar seu plano.`;
}

/**
 * Lê o plano comercial do treinador em `users/{coachId}`.
 * Campos opcionais no Firestore (preenchidos depois pelo webhook RevenueCat):
 * - `subscriptionTier`: 'free' | 'pro'
 * - `subscriptionExpiresAt`: Timestamp — se passado, volta a tratar como free.
 */
export async function getCoachSubscriptionTier(coachId: string): Promise<SubscriptionTier> {
  const snap = await getDoc(doc(db, 'users', coachId));
  const data = snap.data() as Record<string, unknown> | undefined;
  const raw = data?.subscriptionTier;
  if (raw !== 'pro') return 'free';

  const exp = data?.subscriptionExpiresAt as { toMillis?: () => number } | undefined;
  if (exp && typeof exp.toMillis === 'function') {
    if (exp.toMillis() < Date.now()) return 'free';
  }

  return 'pro';
}

export async function getCoachFreePlanUsage(coachId: string): Promise<Usage> {
  const [athletes, workoutTemplates, exercises] = await Promise.all([
    listAthletesByCoachId(coachId),
    listWorkoutTemplatesByCoachId(coachId),
    listExercisesByCoachId(coachId),
  ]);

  return {
    athletes: athletes.length,
    workoutTemplates: workoutTemplates.length,
    exercises: exercises.length,
  };
}

export async function assertCanCreateResource(
  coachId: string,
  resource: PlanResource
): Promise<void> {
  const [usage, tier] = await Promise.all([
    getCoachFreePlanUsage(coachId),
    getCoachSubscriptionTier(coachId),
  ]);
  const limits = getLimitsForTier(tier);
  const limit = limits[resource];
  const current = usage[resource];
  if (current >= limit) {
    throw new FreePlanLimitError(resource, limit, buildLimitMessage(resource, limit, tier));
  }
}
