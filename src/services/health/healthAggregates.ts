import type { HRAggregates, HRSample, HRZones } from '@/src/types/health';

/** FC máx: override do atleta ou estimativa 220 − idade. */
export function resolveFcMax(ageOverride: number | null | undefined, fcMaxOverride: number | null | undefined): number {
  if (typeof fcMaxOverride === 'number' && fcMaxOverride >= 120 && fcMaxOverride <= 220) {
    return fcMaxOverride;
  }
  if (typeof ageOverride === 'number' && ageOverride >= 10 && ageOverride <= 100) {
    return Math.round(220 - ageOverride);
  }
  return 180;
}

export function computeHRAggregates(samples: HRSample[], fcMax: number): HRAggregates | null {
  if (samples.length === 0) {
    return null;
  }

  let sum = 0;
  let max = samples[0].bpm;
  let min = samples[0].bpm;
  const zones: HRZones = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };

  for (const sample of samples) {
    const bpm = sample.bpm;
    if (!Number.isFinite(bpm) || bpm <= 0) continue;
    sum += bpm;
    if (bpm > max) max = bpm;
    if (bpm < min) min = bpm;

    const pct = bpm / fcMax;
    if (pct < 0.6) zones.z1 += 1;
    else if (pct < 0.7) zones.z2 += 1;
    else if (pct < 0.8) zones.z3 += 1;
    else if (pct < 0.9) zones.z4 += 1;
    else zones.z5 += 1;
  }

  const count = samples.length;
  return {
    avg: Math.round(sum / count),
    max: Math.round(max),
    min: Math.round(min),
    samplesCount: count,
    zones,
  };
}

/** Soma valores numéricos de amostras HealthKit (calorias, etc.). */
export function sumSampleValues(samples: Array<{ value?: number }>): number | null {
  if (!samples.length) return null;
  let total = 0;
  let hasValue = false;
  for (const s of samples) {
    const v = Number(s.value);
    if (!Number.isFinite(v)) continue;
    total += v;
    hasValue = true;
  }
  return hasValue ? Math.round(total * 10) / 10 : null;
}
