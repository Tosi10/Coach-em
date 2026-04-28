import type { WorkoutExercise } from '@/src/types';

export type IntervalPhase = NonNullable<WorkoutExercise['intervalProtocol']>[number];

export const PRESCRIPTION_LABELS: Record<NonNullable<WorkoutExercise['prescriptionType']>, string> = {
  strength: 'Força',
  timed: 'Tempo',
  interval: 'Intervalado',
  circuit: 'Circuito',
  free: 'Livre',
};

export function inferPrescriptionType(exercise: WorkoutExercise): NonNullable<WorkoutExercise['prescriptionType']> {
  if (exercise.prescriptionType) return exercise.prescriptionType;
  if (exercise.intervalProtocol?.length) return 'interval';
  if (exercise.sets || exercise.reps) return 'strength';
  if (exercise.duration) return 'timed';
  return 'strength';
}

export function createPyramidProtocol(): IntervalPhase[] {
  const steps = [10, 20, 30, 40, 40, 30, 20, 10];
  return steps.flatMap((seconds, index) => [
    {
      id: `pyramid_${index + 1}_trote`,
      name: `Trote ${seconds}s`,
      duration: seconds,
      intensity: 'moderate' as const,
    },
    {
      id: `pyramid_${index + 1}_pique`,
      name: `Pique ${seconds}s`,
      duration: seconds,
      intensity: 'high' as const,
    },
  ]);
}

export function getProtocolTotalDuration(
  protocol?: IntervalPhase[],
  rounds = 1,
  options?: { roundRest?: number }
): number {
  const base = (protocol || []).reduce((total, phase) => total + (Number(phase.duration) || 0), 0);
  const normalizedRounds = Math.max(1, Number(rounds) || 1);
  const roundRest = Math.max(0, Number(options?.roundRest) || 0);
  const roundsRestTotal = normalizedRounds > 1 ? (normalizedRounds - 1) * roundRest : 0;
  return base * normalizedRounds + roundsRestTotal;
}

export function buildPyramidPrescription(exercise: WorkoutExercise): Partial<WorkoutExercise> {
  const intervalProtocol = createPyramidProtocol();
  return {
    ...exercise,
    prescriptionType: 'interval',
    protocolName: 'Pirâmide 10-20-30-40-40-30-20-10',
    rounds: 1,
    intervalProtocol,
    duration: getProtocolTotalDuration(intervalProtocol, 1),
    sets: undefined,
    reps: undefined,
  };
}
