export const FREE_PLAN_LIMITS = {
  athletes: 3,
  workoutTemplates: 5,
  exercises: 7,
} as const;

export type FreePlanResource = keyof typeof FREE_PLAN_LIMITS;
