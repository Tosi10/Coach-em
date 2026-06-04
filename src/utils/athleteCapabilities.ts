/**
 * Capacidades do atleta (solo / coached / Pro).
 * Ver docs/ROADMAP_ATLETA_SOLO_E_VINCULO_COACH.md
 */

import type { User } from '@/src/types';
import { UserType } from '@/src/types';
import { isCoachedAthlete, isSoloAthlete, resolveAthleteMode } from '@/src/types/athleteMode';
import type { SubscriptionTier } from '@/src/constants/freePlan';

export function getAthleteSubscriptionTier(user: User | null | undefined): SubscriptionTier {
  if (!user || user.userType !== UserType.ATHLETE) return 'free';
  const tier = (user as { subscriptionTier?: string }).subscriptionTier;
  return tier === 'pro' ? 'pro' : 'free';
}

/** Athlete Pro (RevenueCat no uid do atleta — P5). */
export function isAthletePro(user: User | null | undefined): boolean {
  return getAthleteSubscriptionTier(user) === 'pro';
}

/** Pode criar biblioteca / treinos próprios (solo ou coached + Athlete Pro). */
export function canManageOwnTraining(user: User | null | undefined): boolean {
  if (!user || user.userType !== UserType.ATHLETE) return false;
  if (isSoloAthlete(user)) return true;
  if (isCoachedAthlete(user) && isAthletePro(user)) return true;
  return false;
}

/** Wearables: coached + coach Pro (via treino) ou Athlete Pro — simplificado P1. */
export function canShowHealthConsentForAthlete(user: User | null | undefined): boolean {
  if (!user || user.userType !== UserType.ATHLETE) return false;
  if (isAthletePro(user)) return true;
  if (isCoachedAthlete(user)) return true;
  return false;
}

export function getAthleteModeLabel(user: User | null | undefined): 'solo' | 'coached' | null {
  if (!user || user.userType !== UserType.ATHLETE) return null;
  return resolveAthleteMode(user);
}
