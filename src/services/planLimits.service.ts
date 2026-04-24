import { FREE_PLAN_LIMITS, type FreePlanResource } from '@/src/constants/freePlan';
import { listAthletesByCoachId } from '@/src/services/athletes.service';
import { listExercisesByCoachId } from '@/src/services/exercises.service';
import { listWorkoutTemplatesByCoachId } from '@/src/services/workoutTemplates.service';

type Usage = {
  athletes: number;
  workoutTemplates: number;
  exercises: number;
};

export class FreePlanLimitError extends Error {
  code: FreePlanResource;
  limit: number;

  constructor(code: FreePlanResource, limit: number, message: string) {
    super(message);
    this.name = 'FreePlanLimitError';
    this.code = code;
    this.limit = limit;
  }
}

function buildLimitMessage(resource: FreePlanResource, limit: number): string {
  if (resource === 'athletes') {
    return `Você atingiu o limite do plano gratuito (${limit} atletas). Para continuar, será necessário ativar o plano pago.`;
  }
  if (resource === 'workoutTemplates') {
    return `Você atingiu o limite do plano gratuito (${limit} treinos-modelo). Para continuar, será necessário ativar o plano pago.`;
  }
  return `Você atingiu o limite do plano gratuito (${limit} exercícios). Para continuar, será necessário ativar o plano pago.`;
}

export async function getCoachFreePlanUsage(coachId: string): Promise<Usage> {
  const [athletes, workoutTemplates, exercises] = await Promise.all([
    listAthletesByCoachId(coachId),
    listWorkoutTemplatesByCoachId(coachId),
    listExercisesByCoachId(coachId),
  ]);

  return {
    athletes: athletes.length,
    workoutTemplates: workoutTemplates.length,
    exercises: exercises.length,
  };
}

export async function assertCanCreateResource(
  coachId: string,
  resource: FreePlanResource
): Promise<void> {
  const usage = await getCoachFreePlanUsage(coachId);
  const limit = FREE_PLAN_LIMITS[resource];
  const current = usage[resource];
  if (current >= limit) {
    throw new FreePlanLimitError(resource, limit, buildLimitMessage(resource, limit));
  }
}
