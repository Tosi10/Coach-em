/** Plano gratuito — baseline na loja. */
export const FREE_PLAN_LIMITS = {
  athletes: 3,
  workoutTemplates: 5,
  exercises: 7,
} as const;

/** Plano Pro — alinhado a `docs/MONETIZACAO.md`. */
export const PRO_PLAN_LIMITS = {
  athletes: 25,
  workoutTemplates: 50,
  exercises: 100,
} as const;

export type SubscriptionTier = 'free' | 'pro';

export type PlanResource = keyof typeof FREE_PLAN_LIMITS;

/** @deprecated use PlanResource */
export type FreePlanResource = PlanResource;

export function getLimitsForTier(tier: SubscriptionTier): Record<PlanResource, number> {
  return tier === 'pro' ? PRO_PLAN_LIMITS : FREE_PLAN_LIMITS;
}
