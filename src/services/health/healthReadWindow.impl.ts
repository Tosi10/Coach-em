import type { HealthSnapshot } from '@/src/types/health';

/** Web / fallback — leitura nativa em `.ios.ts` / `.android.ts`. */
export async function readNativeHealthWindowImpl(start: Date, end: Date): Promise<HealthSnapshot> {
  return {
    collectedAt: new Date(),
    startedAt: start,
    completedAt: end,
    source: null,
    device: null,
    heartRate: null,
    hrSeries: [],
    caloriesActive: null,
    distanceMeters: null,
    steps: null,
    workoutSessions: [],
    notes: ['unsupported_platform'],
  };
}
