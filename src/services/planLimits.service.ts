import {
  FREE_PLAN_LIMITS,
  getLimitsForTier,
  type PlanResource,
  type SubscriptionTier,
} from '@/src/constants/freePlan';
import { db } from '@/src/services/firebase.config';
import { listAthletesByCoachId } from '@/src/services/athletes.service';
import { isAthleteActiveForCoach } from '@/src/utils/athleteCoachStatus';
import { listExercisesByCoachId } from '@/src/services/exercises.service';
import { listWorkoutTemplatesByCoachId } from '@/src/services/workoutTemplates.service';
import { doc, getDoc } from 'firebase/firestore';

type Usage = {
  athletes: number;
  workoutTemplates: number;
  exercises: number;
};

export type CoachAthleteAccess = {
  tier: SubscriptionTier;
  freeLimit: number;
  allowedAthleteIds: string[];
  blockedAthleteIds: string[];
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

function sortAthletesByCreatedAtAsc<T extends { id: string; createdAt?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.createdAt ?? '') || 0;
    const tb = Date.parse(b.createdAt ?? '') || 0;
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Regra de fallback do Free:
 * - nunca apaga dados;
 * - mantém acesso total somente aos `FREE_PLAN_LIMITS.athletes` atletas mais antigos;
 * - atletas excedentes ficam em modo leitura até renovar Pro.
 */
export async function getCoachAthleteAccess(coachId: string): Promise<CoachAthleteAccess> {
  const [tier, athletes] = await Promise.all([
    getCoachSubscriptionTier(coachId),
    listAthletesByCoachId(coachId),
  ]);

  const ordered = sortAthletesByCreatedAtAsc(
    athletes.filter((a) => isAthleteActiveForCoach(a.status))
  );
  if (tier === 'pro') {
    const ids = ordered.map((a) => a.id);
    return {
      tier,
      freeLimit: FREE_PLAN_LIMITS.athletes,
      allowedAthleteIds: ids,
      blockedAthleteIds: [],
    };
  }

  const allowedAthleteIds = ordered.slice(0, FREE_PLAN_LIMITS.athletes).map((a) => a.id);
  const blockedAthleteIds = ordered.slice(FREE_PLAN_LIMITS.athletes).map((a) => a.id);
  return {
    tier,
    freeLimit: FREE_PLAN_LIMITS.athletes,
    allowedAthleteIds,
    blockedAthleteIds,
  };
}

export async function assertCanManageAthleteInCurrentPlan(
  coachId: string,
  athleteId: string
): Promise<void> {
  const { getAthleteById } = await import('@/src/services/athletes.service');
  const athlete = await getAthleteById(athleteId);
  if (!athlete || !isAthleteActiveForCoach(athlete.status)) {
    throw new Error('Este atleta não está mais vinculado. Não é possível atribuir treinos.');
  }
  const access = await getCoachAthleteAccess(coachId);
  if (access.tier === 'pro') return;
  if (access.allowedAthleteIds.includes(athleteId)) return;
  throw new Error(
    `Athlete locked by free plan: only first ${access.freeLimit} athletes are editable/assignable until Pro renewal.`
  );
}
