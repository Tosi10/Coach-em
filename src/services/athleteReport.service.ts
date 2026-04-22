import { getAthleteById } from './athletes.service';
import { listAssignedWorkoutsByAthleteId } from './assignedWorkouts.service';
import { listExerciseWeightHistoryByAthlete } from './exerciseWeightHistory.service';
import { getFeedbackLabel } from '@/src/utils/feedbackIcons';

export type AthleteReportPeriod = {
  startDate: string;
  endDate: string;
};

export type AthleteReportWorkoutItem = {
  id: string;
  name: string;
  date: string;
  status: string;
  completedDate?: string;
  feedbackLabel?: string;
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
  weightTrend: Array<{ label: string; value: number }>;
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

export async function buildAthleteReportData(
  athleteId: string,
  period: AthleteReportPeriod
): Promise<AthleteReportData> {
  const [athleteDoc, allWorkouts, allWeight] = await Promise.all([
    getAthleteById(athleteId),
    listAssignedWorkoutsByAthleteId(athleteId),
    listExerciseWeightHistoryByAthlete(athleteId),
  ]);

  const workouts = allWorkouts.filter((w) => {
    const baseDate = w.completedDate || w.date;
    return inPeriod(baseDate, period);
  });

  const weightTrend = allWeight
    .filter((r) => inPeriod(r.date, period))
    .slice(-24)
    .map((r) => ({
      label: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: Number(r.weight) || 0,
    }));

  const completedWorkouts = workouts.filter((w) => w.status === 'Concluído').length;
  const pendingWorkouts = workouts.filter((w) => w.status !== 'Concluído').length;
  const totalWorkouts = workouts.length;
  const completionRate = totalWorkouts === 0 ? 0 : Math.round((completedWorkouts / totalWorkouts) * 100);

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
    workouts: workouts.map((w) => ({
      id: w.id,
      name: w.name,
      date: w.date,
      status: w.status,
      completedDate: w.completedDate,
      feedbackLabel: getFeedbackLabel(w.feedback, w.feedbackEmoji) || undefined,
    })),
  };
}
