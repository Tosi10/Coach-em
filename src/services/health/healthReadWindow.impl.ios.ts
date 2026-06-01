import type { HealthSnapshot, HRSample, WorkoutSession, WorkoutSessionType } from '@/src/types/health';

import { computeHRAggregates, resolveFcMax, sumSampleValues } from './healthAggregates';
import { getAppleHealthKit } from './healthKitBridge';

type HealthValue = {
  value?: number;
  startDate?: string;
  endDate?: string;
};

function healthOptions(start: Date, end: Date) {
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

function promisifySamples<T>(
  fn: (options: { startDate: string; endDate: string }, cb: (err: string, results: T) => void) => void,
  start: Date,
  end: Date,
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn(healthOptions(start, end), (err, results) => {
      if (err) {
        reject(new Error(String(err)));
        return;
      }
      resolve(results);
    });
  });
}

function mapWorkoutType(raw: string | undefined): WorkoutSessionType {
  const key = String(raw ?? '').toLowerCase();
  if (key.includes('run')) return 'running';
  if (key.includes('walk')) return 'walking';
  if (key.includes('cycle') || key.includes('bike')) return 'cycling';
  if (key.includes('swim')) return 'swimming';
  if (key.includes('yoga')) return 'yoga';
  if (key.includes('hiit') || key.includes('interval')) return 'hiit';
  if (key.includes('strength') || key.includes('traditional')) return 'strength';
  return 'other';
}

export async function readNativeHealthWindowImpl(start: Date, end: Date): Promise<HealthSnapshot> {
  const notes: string[] = [];
  const AppleHealthKit = getAppleHealthKit();

  let hrSamples: HRSample[] = [];
  try {
    const samples = await promisifySamples<HealthValue[]>(
      AppleHealthKit.getHeartRateSamples.bind(AppleHealthKit),
      start,
      end,
    );
    hrSamples = (samples ?? [])
      .map((s) => ({
        timestamp: new Date(s.startDate ?? s.endDate ?? start.toISOString()),
        bpm: Number(s.value),
      }))
      .filter((s) => Number.isFinite(s.bpm) && s.bpm > 0);
  } catch {
    notes.push('heart_rate_unavailable');
  }

  let caloriesActive: number | null = null;
  try {
    const energy = await promisifySamples<HealthValue[]>(
      AppleHealthKit.getActiveEnergyBurned.bind(AppleHealthKit),
      start,
      end,
    );
    caloriesActive = sumSampleValues(energy ?? []);
  } catch {
    notes.push('calories_unavailable');
  }

  let distanceMeters: number | null = null;
  try {
    const distance = await promisifySamples<HealthValue>(
      AppleHealthKit.getDistanceWalkingRunning.bind(AppleHealthKit),
      start,
      end,
    );
    const meters = Number(distance?.value);
    distanceMeters = Number.isFinite(meters) ? Math.round(meters) : null;
  } catch {
    notes.push('distance_unavailable');
  }

  let steps: number | null = null;
  try {
    const stepSample = await promisifySamples<HealthValue>(
      AppleHealthKit.getStepCount.bind(AppleHealthKit),
      start,
      end,
    );
    const n = Number(stepSample?.value);
    steps = Number.isFinite(n) ? Math.round(n) : null;
  } catch {
    notes.push('steps_unavailable');
  }

  const workoutSessions: WorkoutSession[] = [];
  try {
    const anchored = await new Promise<{ data?: unknown[] }>((resolve, reject) => {
      AppleHealthKit.getAnchoredWorkouts(healthOptions(start, end), (err, results) => {
        if (err) {
          reject(new Error(String((err as { message?: string })?.message ?? err)));
          return;
        }
        resolve(results as { data?: unknown[] });
      });
    });

    for (const raw of anchored.data ?? []) {
      const w = raw as Record<string, unknown>;
      const wStart = new Date(String(w.start ?? w.startDate ?? start.toISOString()));
      const wEnd = new Date(String(w.end ?? w.endDate ?? end.toISOString()));
      const durationSec = Math.max(0, Math.round((wEnd.getTime() - wStart.getTime()) / 1000));
      workoutSessions.push({
        type: mapWorkoutType(String(w.activityName ?? w.activityId ?? 'other')),
        durationSec,
        caloriesActive: Number.isFinite(Number(w.calories)) ? Number(w.calories) : null,
        distanceMeters: Number.isFinite(Number(w.distance)) ? Math.round(Number(w.distance)) : null,
        avgHeartRate: null,
        maxHeartRate: null,
      });
    }
  } catch {
    notes.push('workouts_unavailable');
  }

  const fcMax = resolveFcMax(null, null);
  const heartRate = computeHRAggregates(hrSamples, fcMax);

  return {
    collectedAt: new Date(),
    startedAt: start,
    completedAt: end,
    source: 'healthkit',
    device: 'Apple Health',
    heartRate,
    hrSeries: hrSamples,
    caloriesActive,
    distanceMeters,
    steps,
    workoutSessions,
    notes,
  };
}
