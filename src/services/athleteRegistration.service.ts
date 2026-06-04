/**
 * Cadastro de atleta (solo / código do treinador) via Cloud Functions.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.config';
import type { AthleteMode } from '@/src/types/athleteMode';
import { sendVerificationEmailTo } from './auth.service';

export type ValidateCoachCodeResult =
  | { valid: false }
  | { valid: true; coachDisplayName: string };

export async function validateCoachInviteCode(code: string): Promise<ValidateCoachCodeResult> {
  const fn = httpsCallable<{ code: string }, ValidateCoachCodeResult>(
    functions,
    'validateCoachInviteCode'
  );
  const res = await fn({ code: code.trim() });
  return res.data;
}

export interface RegisterAthleteSelfInput {
  email: string;
  password: string;
  displayName: string;
  athleteMode: AthleteMode;
  coachInviteCode?: string;
  sport?: string;
}

export async function registerAthleteSelf(input: RegisterAthleteSelfInput): Promise<void> {
  const fn = httpsCallable<
    RegisterAthleteSelfInput,
    { ok: boolean; email?: string }
  >(functions, 'registerAthleteSelf');
  const res = await fn(input);
  const email = res.data?.email ?? input.email.trim().toLowerCase();
  await sendVerificationEmailTo(email);
}
