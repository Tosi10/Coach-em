import type { HealthSnapshot } from '@/src/types/health';

import { canUseNativeHealth } from './healthRuntime';

function emptySnapshot(start: Date, end: Date, note: string): HealthSnapshot {
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
    notes: [note],
  };
}

export async function readNativeHealthWindow(start: Date, end: Date): Promise<HealthSnapshot> {
  if (!canUseNativeHealth()) {
    return emptySnapshot(start, end, 'native_health_unavailable');
  }
  try {
    const mod = await import('./healthReadWindow.impl');
    return mod.readNativeHealthWindowImpl(start, end);
  } catch (error) {
    return emptySnapshot(
      start,
      end,
      error instanceof Error ? error.message : 'health_read_failed',
    );
  }
}
