import { getAthleteById } from './athletes.service';
import { listAssignedWorkoutsByAthleteId } from './assignedWorkouts.service';
import { listExerciseWeightHistoryByAthlete } from './exerciseWeightHistory.service';
import { getHealthSnapshot } from './healthFirestore.service';
import { getFeedbackLabel } from '@/src/utils/feedbackIcons';
import type { HealthSnapshot } from '@/src/types/health';

export type AthleteReportPeriod = {
  startDate: string;
  endDate: string;
};

export type AthleteReportWorkoutHealth = {
  avgHr: number | null;
  maxHr: number | null;
  minHr: number | null;
  calories: number | null;
  distanceKm: number | null;
};

export type AthleteReportWorkoutItem = {
  id: string;
  name: string;
  date: string;
  status: string;
  completedDate?: string;
  feedbackLabel?: string;
  health?: AthleteReportWorkoutHealth;
};

export type AthleteReportHealthSummary = {
  completedWorkouts: number;
  workoutsWithHealth: number;
  avgHrMean: number | null;
  maxHrPeak: number | null;
  minHrLow: number | null;
  totalCalories: number;
  totalDistanceKm: number;
  hrTrend: Array<{ label: string; avgHr: number }>;
};

export type AthleteReportWeightPoint = {
  label: string;
  value: number;
  exerciseName: string;
};

export type AthleteReportData = {
  generatedAt: string;
  period: AthleteReportPeriod;
  athlete: {
    id: string;
    name: string;
    sport?: string;
    status?: string;
    photoURL?: string;
  };
  coach: {
    name: string;
    message?: string;
  };
  metrics: {
    totalWorkouts: number;
    completedWorkouts: number;
    pendingWorkouts: number;
    completionRate: number;
    feedbackCounts: Array<{ label: string; count: number }>;
  };
  weeklyTrend: Array<{ label: string; completed: number }>;
  weightTrend: AthleteReportWeightPoint[];
  weightByExercise: Array<{ exerciseName: string; points: Array<{ label: string; value: number }> }>;
  healthSummary: AthleteReportHealthSummary | null;
  workouts: AthleteReportWorkoutItem[];
};

function toDateOnly(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function inPeriod(dateValue: string, period: AthleteReportPeriod): boolean {
  const d = new Date(dateValue).getTime();
  const start = new Date(period.startDate).getTime();
  const end = new Date(period.endDate).getTime();
  return d >= start && d <= end;
}

function buildWeeklyTrend(workouts: any[]): Array<{ label: string; completed: number }> {
  const byWeek = new Map<string, number>();
  for (const w of workouts) {
    if (w.status !== 'Concluído') continue;
    const baseDate = new Date(w.completedDate || w.date);
    const weekStart = new Date(baseDate);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    const key = toDateOnly(weekStart.toISOString());
    byWeek.set(key, (byWeek.get(key) || 0) + 1);
  }
  return Array.from(byWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, completed]) => ({ label, completed }));
}

function buildFeedbackCounts(workouts: any[]): Array<{ label: string; count: number }> {
  const labels = [
    'Muito fácil',
    'Fácil',
    'Moderado',
    'Difícil',
    'Muito difícil',
    'Sem feedback',
  ];
  const map = new Map<string, number>();
  labels.forEach((l) => map.set(l, 0));

  for (const w of workouts) {
    const rawLabel = getFeedbackLabel(w.feedback, w.feedbackEmoji);
    const label = rawLabel || 'Sem feedback';
    map.set(label, (map.get(label) || 0) + 1);
  }

  return labels.map((label) => ({ label, count: map.get(label) || 0 }));
}

function mapWorkoutHealth(snapshot: HealthSnapshot): AthleteReportWorkoutHealth {
  const hr = snapshot.heartRate;
  const distanceM = snapshot.distanceMeters;
  return {
    avgHr: hr?.avg ?? null,
    maxHr: hr?.max ?? null,
    minHr: hr?.min ?? null,
    calories: snapshot.caloriesActive ?? null,
    distanceKm:
      distanceM != null && distanceM > 0 ? Math.round((distanceM / 1000) * 100) / 100 : null,
  };
}

function buildHealthSummary(
  completedCount: number,
  items: AthleteReportWorkoutItem[],
): AthleteReportHealthSummary | null {
  const withHealth = items.filter((w) => w.health && (w.health.avgHr != null || w.health.calories != null));
  if (withHealth.length === 0) return null;

  const avgs = withHealth.map((w) => w.health!.avgHr).filter((v): v is number => v != null && v > 0);
  const maxs = withHealth.map((w) => w.health!.maxHr).filter((v): v is number => v != null && v > 0);
  const mins = withHealth.map((w) => w.health!.minHr).filter((v): v is number => v != null && v > 0);

  const hrTrend = withHealth
    .filter((w) => w.health?.avgHr != null && w.health!.avgHr! > 0)
    .map((w) => ({
      label: new Date(w.completedDate || w.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      avgHr: w.health!.avgHr!,
    }))
    .slice(-12);

  return {
    completedWorkouts: completedCount,
    workoutsWithHealth: withHealth.length,
    avgHrMean: avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null,
    maxHrPeak: maxs.length ? Math.max(...maxs) : null,
    minHrLow: mins.length ? Math.min(...mins) : null,
    totalCalories: Math.round(
      withHealth.reduce((sum, w) => sum + (w.health?.calories ?? 0), 0),
    ),
    totalDistanceKm:
      Math.round(
        withHealth.reduce((sum, w) => sum + (w.health?.distanceKm ?? 0), 0) * 100,
      ) / 100,
    hrTrend,
  };
}

function buildWeightByExercise(
  records: Array<{ exerciseName: string; date: string; weight: number }>,
): Array<{ exerciseName: string; points: Array<{ label: string; value: number }> }> {
  const byExercise = new Map<string, Array<{ date: string; weight: number }>>();
  for (const r of records) {
    const name = r.exerciseName?.trim() || 'Exercício';
    const list = byExercise.get(name) || [];
    list.push({ date: r.date, weight: r.weight });
    byExercise.set(name, list);
  }

  const sorted = Array.from(byExercise.entries())
    .map(([exerciseName, rows]) => ({
      exerciseName,
      rows: rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }))
    .sort((a, b) => b.rows.length - a.rows.length)
    .slice(0, 4);

  return sorted.map(({ exerciseName, rows }) => ({
    exerciseName,
    points: rows.slice(-10).map((r) => ({
      label: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: r.weight,
    })),
  }));
}

export async function buildAthleteReportData(
  athleteId: string,
  period: AthleteReportPeriod,
  options?: { coachId?: string | null }
): Promise<AthleteReportData> {
  const [athleteDoc, allWorkouts, allWeight] = await Promise.all([
    getAthleteById(athleteId),
    listAssignedWorkoutsByAthleteId(athleteId, { coachId: options?.coachId ?? null }),
    listExerciseWeightHistoryByAthlete(athleteId),
  ]);

  const workouts = allWorkouts.filter((w) => {
    const baseDate = w.completedDate || w.date;
    return inPeriod(baseDate, period);
  });

  const weightInPeriod = allWeight.filter((r) => inPeriod(r.date, period));
  const weightTrend = weightInPeriod.slice(-24).map((r) => ({
    label: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    value: Number(r.weight) || 0,
    exerciseName: r.exerciseName || 'Exercício',
  }));
  const weightByExercise = buildWeightByExercise(
    weightInPeriod.map((r) => ({
      exerciseName: r.exerciseName,
      date: r.date,
      weight: Number(r.weight) || 0,
    })),
  );

  const completedWorkouts = workouts.filter((w) => w.status === 'Concluído').length;
  const pendingWorkouts = workouts.filter((w) => w.status !== 'Concluído').length;
  const totalWorkouts = workouts.length;
  const completionRate = totalWorkouts === 0 ? 0 : Math.round((completedWorkouts / totalWorkouts) * 100);

  const workoutItems: AthleteReportWorkoutItem[] = await Promise.all(
    workouts.map(async (w) => {
      let health: AthleteReportWorkoutHealth | undefined;
      if (w.status === 'Concluído') {
        const snap = await getHealthSnapshot(w.id, athleteId);
        if (snap && (snap.heartRate?.avg != null || snap.caloriesActive != null)) {
          health = mapWorkoutHealth(snap);
        }
      }
      return {
        id: w.id,
        name: w.name,
        date: w.date,
        status: w.status,
        completedDate: w.completedDate,
        feedbackLabel: getFeedbackLabel(w.feedback, w.feedbackEmoji) || undefined,
        health,
      };
    }),
  );

  const completedItems = workoutItems.filter((w) => w.status === 'Concluído');

  return {
    generatedAt: new Date().toISOString(),
    period,
    athlete: {
      id: athleteId,
      name: athleteDoc?.name || 'Atleta',
      sport: athleteDoc?.sport,
      status: athleteDoc?.status,
      photoURL: athleteDoc?.photoURL,
    },
    coach: {
      name: (athleteDoc as any)?.coachPublicName || 'Treinador',
      message: (athleteDoc as any)?.coachWelcomeMessage,
    },
    metrics: {
      totalWorkouts,
      completedWorkouts,
      pendingWorkouts,
      completionRate,
      feedbackCounts: buildFeedbackCounts(workouts.filter((w) => w.status === 'Concluído')),
    },
    weeklyTrend: buildWeeklyTrend(workouts),
    weightTrend,
    weightByExercise,
    healthSummary: buildHealthSummary(completedItems.length, completedItems),
    workouts: workoutItems,
  };
}
