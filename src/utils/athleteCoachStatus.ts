/** Status do atleta na lista do treinador (`coachemAthletes.status`). */

export const ATHLETE_COACH_STATUS_ACTIVE = 'Ativo';
export const ATHLETE_COACH_STATUS_UNLINKED = 'Desvinculado';
export const ATHLETE_COACH_STATUS_BLOCKED = 'Bloqueado';
export const ATHLETE_COACH_STATUS_REMOVED_ACCOUNT = 'Conta removida';

export function normalizeAthleteCoachStatus(status: unknown): string {
  const s = String(status ?? '').trim();
  return s.length > 0 ? s : ATHLETE_COACH_STATUS_ACTIVE;
}

/** Vínculo ativo: pode atribuir treinos (não confundir com bloqueio de login). */
export function isAthleteActiveForCoach(status: unknown): boolean {
  const n = normalizeAthleteCoachStatus(status).toLowerCase();
  return n === ATHLETE_COACH_STATUS_ACTIVE.toLowerCase() || n === 'active';
}

export function isAthleteUnlinkedFromCoach(status: unknown): boolean {
  return (
    normalizeAthleteCoachStatus(status).toLowerCase() ===
    ATHLETE_COACH_STATUS_UNLINKED.toLowerCase()
  );
}

export function isAthleteBlockedForLogin(status: unknown): boolean {
  return normalizeAthleteCoachStatus(status).toLowerCase() === ATHLETE_COACH_STATUS_BLOCKED.toLowerCase();
}
