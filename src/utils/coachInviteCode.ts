/** Gera código legível para vínculo atleta ↔ treinador (ex. COACH-7K3M). */
export function generateCoachInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `COACH-${suffix}`;
}
