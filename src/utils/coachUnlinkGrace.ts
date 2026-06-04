/**
 * Período de graça após desvincular do treinador (30 dias).
 * Ver docs/ROADMAP_ATLETA_SOLO_E_VINCULO_COACH.md §6
 */

import type { Athlete, User } from '@/src/types';
import { UserType } from '@/src/types';

export const COACH_UNLINK_GRACE_DAYS = 30;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const d = (value as { toDate: () => Date }).toDate();
    return d instanceof Date ? d : null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function getCoachAccessEndsAt(user: User | null | undefined): Date | null {
  if (!user || user.userType !== UserType.ATHLETE) return null;
  return toDate((user as Athlete).coachAccessEndsAt);
}

export function isAssignedWorkoutCompleted(status: unknown): boolean {
  const v = String(status ?? '').trim().toLowerCase();
  return v === 'concluído' || v === 'concluido' || v === 'completed' || v === 'done';
}

/** Oculta pendentes do ex-coach após fim da graça; concluídos mantêm-se no histórico. */
export function filterAssignedWorkoutsAfterCoachUnlink<T extends { coachId?: string; status?: string }>(
  workouts: T[],
  user: User | null | undefined
): T[] {
  if (!user || user.userType !== UserType.ATHLETE) return workouts;
  const athlete = user as Athlete;
  const exCoachId =
    typeof athlete.coachUnlinkedFromCoachId === 'string'
      ? athlete.coachUnlinkedFromCoachId.trim()
      : '';
  if (!exCoachId) return workouts;

  const accessEnds = getCoachAccessEndsAt(user);
  if (!accessEnds) return workouts;

  const graceActive = Date.now() <= accessEnds.getTime();
  const selfId = user.id;

  return workouts.filter((w) => {
    const coachId = typeof w.coachId === 'string' ? w.coachId : '';
    if (!coachId || coachId === selfId || coachId !== exCoachId) return true;
    if (isAssignedWorkoutCompleted(w.status)) return true;
    return graceActive;
  });
}

export function formatCoachGraceRemaining(user: User | null | undefined): string | null {
  const ends = getCoachAccessEndsAt(user);
  if (!ends || Date.now() > ends.getTime()) return null;
  const days = Math.ceil((ends.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return String(Math.max(0, days));
}
