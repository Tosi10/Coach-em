import type { HealthSnapshot, HRSample, WorkoutSessionType } from '@/src/types/health';

import { computeHRAggregates, resolveFcMax } from './healthAggregates';
import { canUseNativeHealth } from './healthRuntime';

function empty(start: Date, end: Date, note: string): HealthSnapshot {
  return {
    collectedAt: new Date(),
    startedAt: start,
    completedAt: end,
    source: 'healthconnect',
    device: 'Health Connect',
    heartRate: null,
    hrSeries: [],
    caloriesActive: null,
    distanceMeters: null,
    steps: null,
    workoutSessions: [],
    notes: [note],
  };
}

export async function readNativeHealthWindowImpl(start: Date, end: Date): Promise<HealthSnapshot> {
  if (!canUseNativeHealth()) {
    return empty(start, end, 'expo_go');
  }

  const notes: string[] = [];
  const timeRangeFilter = {
    operator: 'between' as const,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };

  try {
    const { initialize, readRecords } = await import('react-native-health-connect');
    const ok = await initialize();
    if (!ok) {
      return empty(start, end, 'health_connect_init_failed');
    }

    const hrSamples: HRSample[] = [];
    try {
      const hr = await readRecords('HeartRate', { timeRangeFilter });
      for (const record of hr.records ?? []) {
        const samples = (record as { samples?: Array<{ beatsPerMinute?: number; time?: string }> }).samples ?? [];
        for (const s of samples) {
          const bpm = Number(s.beatsPerMinute);
          if (!Number.isFinite(bpm) || bpm <= 0) continue;
          hrSamples.push({
            timestamp: new Date(s.time ?? start.toISOString()),
            bpm,
          });
        }
      }
    } catch {
      notes.push('heart_rate_unavailable');
    }

    let caloriesActive: number | null = null;
    try {
      const cal = await readRecords('ActiveCaloriesBurned', { timeRangeFilter });
      let total = 0;
      let has = false;
      for (const record of cal.records ?? []) {
        const energy = (record as { energy?: { inKilocalories?: number } }).energy;
        const kcal = Number(energy?.inKilocalories);
        if (Number.isFinite(kcal)) {
          total += kcal;
          has = true;
        }
      }
      caloriesActive = has ? Math.round(total * 10) / 10 : null;
    } catch {
      notes.push('calories_unavailable');
    }

    let distanceMeters: number | null = null;
    try {
      const dist = await readRecords('Distance', { timeRangeFilter });
      let total = 0;
      let has = false;
      for (const record of dist.records ?? []) {
        const distance = (record as { distance?: { inMeters?: number } }).distance;
        const m = Number(distance?.inMeters);
        if (Number.isFinite(m)) {
          total += m;
          has = true;
        }
      }
      distanceMeters = has ? Math.round(total) : null;
    } catch {
      notes.push('distance_unavailable');
    }

    let steps: number | null = null;
    try {
      const stepsResult = await readRecords('Steps', { timeRangeFilter });
      let total = 0;
      let has = false;
      for (const record of stepsResult.records ?? []) {
        const count = Number((record as { count?: number }).count);
        if (Number.isFinite(count)) {
          total += count;
          has = true;
        }
      }
      steps = has ? Math.round(total) : null;
    } catch {
      notes.push('steps_unavailable');
    }

    const workoutSessions: Array<{
      type: WorkoutSessionType;
      durationSec: number;
      caloriesActive: number | null;
      distanceMeters: number | null;
      avgHeartRate: number | null;
      maxHeartRate: number | null;
    }> = [];

    try {
      const sessions = await readRecords('ExerciseSession', { timeRangeFilter });
      for (const record of sessions.records ?? []) {
        const r = record as {
          startTime?: string;
          endTime?: string;
          exerciseType?: number;
        };
        const s = new Date(r.startTime ?? start.toISOString());
        const e = new Date(r.endTime ?? end.toISOString());
        workoutSessions.push({
          type: 'other',
          durationSec: Math.max(0, Math.round((e.getTime() - s.getTime()) / 1000)),
          caloriesActive: null,
          distanceMeters: null,
          avgHeartRate: null,
          maxHeartRate: null,
        });
      }
    } catch {
      notes.push('workouts_unavailable');
    }

    const heartRate = computeHRAggregates(hrSamples, resolveFcMax(null, null));

    return {
      collectedAt: new Date(),
      startedAt: start,
      completedAt: end,
      source: 'healthconnect',
      device: 'Health Connect',
      heartRate,
      hrSeries: hrSamples,
      caloriesActive,
      distanceMeters,
      steps,
      workoutSessions,
      notes,
    };
  } catch (error) {
    return empty(start, end, error instanceof Error ? error.message : 'health_connect_read_failed');
  }
}
