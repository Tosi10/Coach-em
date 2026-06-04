import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase.config';

export interface CoachInviteDoc {
  id: string;
  coachId: string;
  athleteEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export async function sendCoachInviteToAthlete(email: string): Promise<void> {
  const fn = httpsCallable<{ email: string }, { ok: boolean }>(
    functions,
    'sendCoachInviteToAthlete'
  );
  await fn({ email: email.trim().toLowerCase() });
}

export async function acceptCoachInvite(inviteId: string): Promise<void> {
  const fn = httpsCallable<{ inviteId: string }, { ok: boolean }>(
    functions,
    'acceptCoachInvite'
  );
  await fn({ inviteId });
}

/** Repara coachemAthletes quando users já tem coach mas a lista do treinador não mostra o atleta. */
export async function syncCoachemAthleteWithUserLink(): Promise<void> {
  const fn = httpsCallable<Record<string, never>, { ok: boolean }>(
    functions,
    'syncCoachemAthleteWithUserLink'
  );
  await fn({});
}

export async function detachAthleteFromCoachByCoach(
  athleteId: string
): Promise<{ coachAccessEndsAt: string }> {
  const fn = httpsCallable<{ athleteId: string }, { ok: boolean; coachAccessEndsAt: string }>(
    functions,
    'detachAthleteFromCoachByCoach'
  );
  const res = await fn({ athleteId: athleteId.trim() });
  return { coachAccessEndsAt: res.data.coachAccessEndsAt };
}

export async function unlinkAthleteFromCoach(): Promise<{ coachAccessEndsAt: string }> {
  const fn = httpsCallable<Record<string, never>, { ok: boolean; coachAccessEndsAt: string }>(
    functions,
    'unlinkAthleteFromCoach'
  );
  const res = await fn({});
  return { coachAccessEndsAt: res.data.coachAccessEndsAt };
}

export async function linkAthleteToCoachByCode(code: string): Promise<{
  coachDisplayName: string;
}> {
  const fn = httpsCallable<
    { code: string },
    { ok: boolean; coachDisplayName: string }
  >(functions, 'linkAthleteToCoachByCode');
  const res = await fn({ code: code.trim() });
  return { coachDisplayName: res.data.coachDisplayName };
}

/** Convites pendentes para o email do atleta logado. */
export async function listPendingInvitesForEmail(
  athleteEmail: string
): Promise<CoachInviteDoc[]> {
  const q = query(
    collection(db, 'coachInvites'),
    where('athleteEmail', '==', athleteEmail.trim().toLowerCase()),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      coachId: String(data.coachId ?? ''),
      athleteEmail: String(data.athleteEmail ?? ''),
      status: data.status as CoachInviteDoc['status'],
    };
  });
}

export function subscribePendingInvitesForEmail(
  athleteEmail: string,
  onChange: (invites: CoachInviteDoc[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'coachInvites'),
    where('athleteEmail', '==', athleteEmail.trim().toLowerCase()),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snap) => {
    onChange(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          coachId: String(data.coachId ?? ''),
          athleteEmail: String(data.athleteEmail ?? ''),
          status: data.status as CoachInviteDoc['status'],
        };
      })
    );
  });
}
