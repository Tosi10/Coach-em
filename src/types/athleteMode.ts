/**
 * Modo do atleta — solo (sem PT) ou coached (vinculado a treinador).
 * Ver docs/ROADMAP_ATLETA_SOLO_E_VINCULO_COACH.md
 */

export type AthleteMode = 'solo' | 'coached';

export function normalizeAthleteMode(value: unknown): AthleteMode | null {
  if (value === 'solo' || value === 'coached') return value;
  return null;
}

/** Atletas antigos sem `athleteMode`: com coachId → coached; senão solo. */
export function resolveAthleteMode(userData: {
  athleteMode?: unknown;
  coachId?: unknown;
} | null | undefined): AthleteMode {
  const explicit = normalizeAthleteMode(userData?.athleteMode);
  if (explicit) return explicit;
  const coachId = typeof userData?.coachId === 'string' ? userData.coachId.trim() : '';
  return coachId.length > 0 ? 'coached' : 'solo';
}

export function isSoloAthlete(userData: { athleteMode?: unknown; coachId?: unknown } | null | undefined): boolean {
  return resolveAthleteMode(userData) === 'solo';
}

export function isCoachedAthlete(userData: { athleteMode?: unknown; coachId?: unknown } | null | undefined): boolean {
  return resolveAthleteMode(userData) === 'coached';
}
