/**
 * TELA INICIAL - Versão Simplificada para Aprendizado
 * 
 * Esta é a tela mais simples possível para você entender os conceitos básicos.
 * Vamos explicar TUDO linha por linha!
 */

import { EmptyState } from '@/components/EmptyState';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useToastContext } from '@/components/ToastProvider';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { listAssignedWorkoutsByAthleteId, listAssignedWorkoutsByCoachId } from '@/src/services/assignedWorkouts.service';
import { UserType } from '@/src/types';
import { getFeedbackIconSource, getFeedbackLabel } from '@/src/utils/feedbackIcons';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startDay = weekStart.getDate();
  const startMonth = weekStart.getMonth() + 1;
  const endDay = weekEnd.getDate();
  const endMonth = weekEnd.getMonth() + 1;
  if (startMonth === endMonth) {
    return `${startDay}/${startMonth}`;
  }
  return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
}

/**
 * O QUE É ISSO?
 * 
 * Esta é uma FUNÇÃO que retorna uma TELA (componente).
 * No React Native, cada tela é uma função que retorna elementos visuais.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [currentAthleteId, setCurrentAthleteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Estados para gráfico de evolução de peso (atleta)
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Array<{id: string, name: string}>>([]);
  
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [athletesList, setAthletesList] = useState<Array<{ id: string; name: string }>>([]);

  // Atletas derivados dos treinos; nome vindo do Firestore (coachemAthletes) quando existir
  const getAthletesFromWorkouts = useCallback(() => {
    const ids = new Set<string>();
    workouts.forEach((w: any) => {
      const id = w.athleteId || w.coach;
      if (id) ids.add(id);
    });
    return Array.from(ids).map((id) => ({
      id,
      name: athletesList.find((a) => a.id === id)?.name || `Atleta ${id.length > 8 ? id.slice(-8) : id}`,
    }));
  }, [workouts, athletesList]);

  useEffect(() => {
    const loadUserTypeAndWorkouts = async () => {
      const savedType = await AsyncStorage.getItem('userType');
      if (savedType) setUserType(savedType as UserType);

      let athleteId: string | null = null;
      if (savedType === UserType.ATHLETE) {
        athleteId = await AsyncStorage.getItem('currentAthleteId');
        if (athleteId) setCurrentAthleteId(athleteId);
      }

      let allWorkouts: any[] = [];
      try {
        if (savedType === UserType.ATHLETE && athleteId) {
          allWorkouts = await listAssignedWorkoutsByAthleteId(athleteId);
        } else if (savedType === UserType.COACH && user?.id) {
          allWorkouts = await listAssignedWorkoutsByCoachId(user.id);
        }
      } catch (e) {
        console.warn('Erro ao carregar treinos atribuídos:', e);
      }
      setWorkouts(allWorkouts);
    };
    loadUserTypeAndWorkouts();
  }, [user?.id]);

  // Onboarding simples: mostra apenas na primeira vez após login
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding_v1');
        if (!seen) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Erro ao verificar onboarding:', error);
      }
    };
    checkOnboarding();
  }, []);

  const loadAthletesList = useCallback(async () => {
    if (!user?.id) {
      setAthletesList([]);
      return;
    }
    try {
      const { listAthletesByCoachId } = await import('@/src/services/athletes.service');
      const list = await listAthletesByCoachId(user.id);
      setAthletesList(list.map((a) => ({ id: a.id, name: a.name })));
    } catch {
      setAthletesList([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (userType === UserType.COACH) loadAthletesList();
    else setAthletesList([]);
  }, [userType, loadAthletesList]);

  useFocusEffect(
    useCallback(() => {
      if (userType === UserType.COACH) loadAthletesList();
    }, [userType, loadAthletesList])
  );

  // Carregar histórico de peso do atleta
  const loadWeightHistory = useCallback(async () => {
    if (userType !== UserType.ATHLETE || !currentAthleteId) return;
    
    try {
      const { listExerciseWeightHistoryByAthlete } = await import('@/src/services/exerciseWeightHistory.service');
      let athleteHistory = await listExerciseWeightHistoryByAthlete(currentAthleteId);
      if (athleteHistory.length === 0) {
        // Compatibilidade com histórico legado salvo localmente.
        const weightHistoryJson = await AsyncStorage.getItem('exercise_weight_history');
        const allHistory = weightHistoryJson ? JSON.parse(weightHistoryJson) : [];
        athleteHistory = (Array.isArray(allHistory) ? allHistory : []).filter(
          (r: any) => r.athleteId === currentAthleteId
        );
      }
      if (athleteHistory.length === 0) {
        setWeightHistory([]);
        setAvailableExercises([]);
        setSelectedExercise(null);
        return;
      }
      
      // Agrupar por exercício para criar lista de exercícios disponíveis
      const exercisesMap = new Map<string, string>();
      athleteHistory.forEach((record: any) => {
        if (record.exerciseId && record.exerciseName) {
          exercisesMap.set(record.exerciseId, record.exerciseName);
        }
      });
      
      const exercises = Array.from(exercisesMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));
      
      setAvailableExercises(exercises);
      
      // Se há exercícios e nenhum selecionado, selecionar o primeiro
      if (exercises.length > 0 && !selectedExercise) {
        setSelectedExercise(exercises[0].id);
      }
      
      // Filtrar histórico pelo exercício selecionado
      if (selectedExercise) {
        const filtered = athleteHistory
          .filter((r: any) => r.exerciseId === selectedExercise)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setWeightHistory(filtered);
      } else {
        setWeightHistory([]);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de peso:', error);
    }
  }, [userType, currentAthleteId, selectedExercise]);

  // Carregar histórico quando necessário
  useEffect(() => {
    if (userType === UserType.ATHLETE && currentAthleteId) {
      loadWeightHistory();
    }
  }, [userType, currentAthleteId, selectedExercise, loadWeightHistory]); // Mantém vazio, mas vamos usar useFocusEffect também

  const todayWorkouts = useMemo(
    () => workouts.filter((w) => w.isToday && w.status === 'Pendente'),
    [workouts]
  );

  const completedWorkouts = useMemo(
    () => workouts.filter((w: any) => w.status === 'Concluído'),
    [workouts]
  );

  const weeklyFrequency = useMemo(() => {
    if (completedWorkouts.length === 0) return [];
    const weeklyMap = new Map<string, number>();
    completedWorkouts.forEach((workout: any) => {
      const workoutDate = workout.completedDate ? new Date(workout.completedDate) : new Date(workout.date);
      const weekStart = new Date(workoutDate);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + 1);
    });
    const weeklyData = Array.from(weeklyMap.entries())
      .map(([weekStart, count]) => ({
        weekStart: new Date(weekStart),
        count,
        label: formatWeekLabel(new Date(weekStart)),
      }))
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
    return weeklyData.slice(-8);
  }, [completedWorkouts]);

  const difficultyTrend = useMemo(() => {
    if (completedWorkouts.length === 0) return [];
    const weeklyMap = new Map<string, number[]>();
    completedWorkouts.forEach((workout: any) => {
      if (!workout.feedback || workout.feedback < 1 || workout.feedback > 5) return;
      const workoutDate = workout.completedDate ? new Date(workout.completedDate) : new Date(workout.date);
      const weekStart = new Date(workoutDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeklyMap.has(weekKey)) weeklyMap.set(weekKey, []);
      weeklyMap.get(weekKey)!.push(workout.feedback);
    });
    const weeklyData = Array.from(weeklyMap.entries())
      .map(([weekStart, feedbacks]) => {
        const average = feedbacks.reduce((sum, f) => sum + f, 0) / feedbacks.length;
        return {
          weekStart: new Date(weekStart),
          average: parseFloat(average.toFixed(2)),
          count: feedbacks.length,
          label: formatWeekLabel(new Date(weekStart)),
        };
      })
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
    return weeklyData.slice(-8);
  }, [completedWorkouts]);

  const difficultyTrendAnalysis = useMemo(() => {
    if (difficultyTrend.length < 2) return null;
    const firstWeek = difficultyTrend[0];
    const lastWeek = difficultyTrend[difficultyTrend.length - 1];
    const difference = lastWeek.average - firstWeek.average;
    const isImproving = difference < 0;
    const trend = Math.abs(difference) < 0.1 ? 'stable' : (isImproving ? 'improving' : 'declining');
    return {
      firstAverage: firstWeek.average,
      lastAverage: lastWeek.average,
      difference: parseFloat(difference.toFixed(2)),
      trend,
      isImproving,
    };
  }, [difficultyTrend]);

  const upcomingWorkouts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    const daysUntilSunday = 7 - today.getDay();
    endOfWeek.setDate(today.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    return workouts
      .filter((w: any) => {
        if (w.status !== 'Pendente') return false;
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate >= today && workoutDate <= endOfWeek;
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [workouts]);

  const athleteStats = useMemo(() => {
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeekWorkouts = workouts.filter((w: any) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= thisWeekStart && w.status === 'Pendente';
    });
    const completedThisWeek = workouts.filter((w: any) => {
      if (w.status !== 'Concluído') return false;
      const completedDate = w.completedDate ? new Date(w.completedDate) : new Date(w.date);
      return completedDate >= thisWeekStart;
    });
    const totalCompleted = workouts.filter((w: any) => w.status === 'Concluído').length;
    const sortedCompleted = [...workouts]
      .filter((w: any) => w.status === 'Concluído')
      .sort((a: any, b: any) => {
        const dateA = a.completedDate ? new Date(a.completedDate).getTime() : new Date(a.date).getTime();
        const dateB = b.completedDate ? new Date(b.completedDate).getTime() : new Date(b.date).getTime();
        return dateB - dateA;
      });
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < sortedCompleted.length; i++) {
      const workout = sortedCompleted[i] as any;
      const workoutDate = workout.completedDate ? new Date(workout.completedDate) : new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return {
      thisWeekPending: thisWeekWorkouts.length,
      thisWeekCompleted: completedThisWeek.length,
      totalCompleted,
      streak,
    };
  }, [workouts]);

  const averagePerWeekDisplay = useMemo(() => {
    if (weeklyFrequency.length === 0) return '0';
    const total = weeklyFrequency.reduce((sum, week) => sum + week.count, 0);
    return (total / weeklyFrequency.length).toFixed(1);
  }, [weeklyFrequency]);

  const weekComparison = useMemo(() => {
    if (weeklyFrequency.length < 2) return null;
    const currentWeek = weeklyFrequency[weeklyFrequency.length - 1];
    const previousWeek = weeklyFrequency[weeklyFrequency.length - 2];
    return {
      current: currentWeek.count,
      previous: previousWeek.count,
      difference: currentWeek.count - previousWeek.count,
      percentage:
        previousWeek.count > 0
          ? (((currentWeek.count - previousWeek.count) / previousWeek.count) * 100).toFixed(0)
          : '0',
    };
  }, [weeklyFrequency]);

  /** Ícone de dificuldade (1–5) a partir da média decimal (arredondada) */
  const feedbackIconForAverage = (average: number) => {
    const level = Math.max(1, Math.min(5, Math.round(average)));
    return getFeedbackIconSource(level, null);
  };

  const maxStreakData = useMemo(() => {
    if (completedWorkouts.length === 0) {
      return { maxStreak: 0, currentStreak: 0 };
    }

    const sortedWorkouts = [...completedWorkouts]
      .map((w: any) => {
        const date = w.completedDate ? new Date(w.completedDate) : new Date(w.date);
        date.setHours(0, 0, 0, 0);
        return { ...w, date };
      })
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

    // Remover duplicatas (mesmo dia)
    const uniqueDates = new Set<string>();
    const uniqueWorkouts: any[] = [];
    sortedWorkouts.forEach((w: any) => {
      const dateKey = w.date.toISOString().split('T')[0];
      if (!uniqueDates.has(dateKey)) {
        uniqueDates.add(dateKey);
        uniqueWorkouts.push(w);
      }
    });

    // Calcular sequências
    let maxStreak = 0;
    let currentStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < uniqueWorkouts.length; i++) {
      if (i === 0) {
        tempStreak = 1;
        continue;
      }

      const prevDate = uniqueWorkouts[i - 1].date;
      const currDate = uniqueWorkouts[i].date;
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Dias consecutivos
        tempStreak++;
      } else {
        // Sequência quebrada
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }

    // Verificar última sequência
    maxStreak = Math.max(maxStreak, tempStreak);

    // Calcular sequência atual (já temos essa função, mas vamos recalcular aqui para garantir)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streakCount = 0;
    let checkDate = new Date(today);

    for (let i = uniqueWorkouts.length - 1; i >= 0; i--) {
      const workoutDate = uniqueWorkouts[i].date;
      const daysDiff = Math.floor((checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streakCount) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      maxStreak,
      currentStreak: streakCount,
    };
  }, [completedWorkouts]);

  const bestWeekData = useMemo(() => {
    if (weeklyFrequency.length === 0) return null;
    const bestWeek = weeklyFrequency.reduce((best, week) => (week.count > best.count ? week : best));
    return {
      count: bestWeek.count,
      label: bestWeek.label,
      weekStart: bestWeek.weekStart,
    };
  }, [weeklyFrequency]);

  const bestMonthData = useMemo((): { count: number; label: string; monthKey: string } | null => {
    if (completedWorkouts.length === 0) return null;
    const monthlyMap = new Map<string, number>();
    completedWorkouts.forEach((workout: any) => {
      const workoutDate = workout.completedDate ? new Date(workout.completedDate) : new Date(workout.date);
      const monthKey = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
    });
    let bestMonth: { count: number; label: string; monthKey: string } | null = null;
    let maxCount = 0;
    monthlyMap.forEach((count, monthKey) => {
      if (count > maxCount) {
        maxCount = count;
        const [year, month] = monthKey.split('-');
        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
        ];
        bestMonth = {
          count,
          label: `${monthNames[parseInt(month, 10) - 1]} ${year}`,
          monthKey,
        };
      }
    });
    return bestMonth;
  }, [completedWorkouts]);

  const coachWeeklyStats = useMemo(() => {
    const allCompletedWorkouts = workouts.filter((w: any) => w.status === 'Concluído');
    if (allCompletedWorkouts.length === 0) return [];
    const weeklyMap = new Map<string, number>();
    allCompletedWorkouts.forEach((workout: any) => {
      const workoutDate = workout.completedDate ? new Date(workout.completedDate) : new Date(workout.date);
      const weekStart = new Date(workoutDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + 1);
    });
    const weeklyData = Array.from(weeklyMap.entries())
      .map(([weekStart, count]) => ({
        weekStart: new Date(weekStart),
        count,
        label: formatWeekLabel(new Date(weekStart)),
      }))
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
    return weeklyData.slice(-8);
  }, [workouts]);

  const coachWeeklyTrend = useMemo(() => {
    if (coachWeeklyStats.length < 2) return null;
    const firstWeek = coachWeeklyStats[0];
    const lastWeek = coachWeeklyStats[coachWeeklyStats.length - 1];
    const difference = lastWeek.count - firstWeek.count;
    const isIncreasing = difference > 0;
    const trend = Math.abs(difference) < 1 ? 'stable' : (isIncreasing ? 'increasing' : 'decreasing');
    return {
      firstCount: firstWeek.count,
      lastCount: lastWeek.count,
      difference,
      trend,
      isIncreasing,
    };
  }, [coachWeeklyStats]);

  // Função para calcular taxa de aderência de um atleta
  const calculateAdherenceRate = (athleteId: string) => {
    // Buscar todos os treinos atribuídos a este atleta
    const assignedWorkouts = workouts.filter((w: any) => 
      (w.athleteId || w.coach) === athleteId
    );
    
    if (assignedWorkouts.length === 0) {
      return null;
    }

    // Contar quantos foram concluídos
    const completedWorkouts = assignedWorkouts.filter((w: any) => 
      w.status === 'Concluído'
    );

    // Calcular porcentagem
    const rate = (completedWorkouts.length / assignedWorkouts.length) * 100;
    
    return {
      athleteId,
      rate: parseFloat(rate.toFixed(1)),
      completed: completedWorkouts.length,
      assigned: assignedWorkouts.length,
    };
  };

  const allAthletesAdherence = useMemo(() => {
    const athletes = getAthletesFromWorkouts();
    return athletes
      .map((athlete) => {
        const adherence = calculateAdherenceRate(athlete.id);
        if (!adherence) return null;
        return { ...adherence, athleteName: athlete.name };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.rate - a.rate);
  }, [workouts, athletesList]);

  // Função para calcular dificuldade média por treino (baseado no feedback)
  const getWorkoutDifficulty = (workoutName: string) => {
    // Buscar todos os treinos concluídos com este nome
    const workoutsWithName = workouts.filter((w: any) => {
      const hasFeedback = (w as any).feedback !== undefined && (w as any).feedback !== null;
      return w.status === 'Concluído' && 
        w.name === workoutName &&
        hasFeedback && 
        (w as any).feedback >= 1 && 
        (w as any).feedback <= 5;
    });

    if (workoutsWithName.length === 0) {
      return null;
    }

    // Calcular média de feedback
    const totalFeedback = workoutsWithName.reduce((sum, w: any) => sum + ((w.feedback || 0) as number), 0);
    const averageDifficulty = totalFeedback / workoutsWithName.length;

      return {
        workoutName,
        averageDifficulty: parseFloat(averageDifficulty.toFixed(2)),
        count: workoutsWithName.length,
        feedbacks: workoutsWithName.map((w: any) => (w.feedback as number)),
      };
  };

  const mostDifficultWorkoutsList = useMemo(() => {
    const workoutNames = new Set<string>();
    workouts.forEach((w: any) => {
      const hasFeedback = (w as any).feedback !== undefined && (w as any).feedback !== null;
      if (w.status === 'Concluído' && hasFeedback && (w as any).feedback >= 1 && (w as any).feedback <= 5) {
        workoutNames.add(w.name);
      }
    });
    return Array.from(workoutNames)
      .map((workoutName) => getWorkoutDifficulty(workoutName))
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.averageDifficulty - a.averageDifficulty)
      .slice(0, 5);
  }, [workouts]);

  const difficultyDistributionChart = useMemo(() => {
    const withFeedback = workouts.filter((w: any) => {
      const hasFeedback = (w as any).feedback !== undefined && (w as any).feedback !== null;
      return (
        w.status === 'Concluído' &&
        hasFeedback &&
        (w as any).feedback >= 1 &&
        (w as any).feedback <= 5
      );
    });
    if (withFeedback.length === 0) return [];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    withFeedback.forEach((w: any) => {
      const feedback = (w as any).feedback as number;
      if (feedback >= 1 && feedback <= 5) {
        distribution[feedback as keyof typeof distribution]++;
      }
    });
    return [
      { label: 'Muito Fácil', value: distribution[1], color: '#10b981' },
      { label: 'Fácil', value: distribution[2], color: '#22c55e' },
      { label: 'Normal', value: distribution[3], color: '#f59e0b' },
      { label: 'Difícil', value: distribution[4], color: '#f97316' },
      { label: 'Muito Difícil', value: distribution[5], color: '#ef4444' },
    ].filter((item) => item.value > 0);
  }, [workouts]);

  const todayCompletedForCoach = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return workouts.filter((w: any) => {
      if (w.status !== 'Concluído') return false;
      const completedDate = w.completedDate ? new Date(w.completedDate).toISOString().split('T')[0] : w.date;
      return completedDate === today;
    });
  }, [workouts]);

  const athletesWhoTrainedTodayList = useMemo(() => {
    const recentCompleted = workouts.filter((w: any) => {
      if (w.status !== 'Concluído') return false;
      const completedDate = w.completedDate ? new Date(w.completedDate) : new Date(w.date);
      const hoursAgo = (new Date().getTime() - completedDate.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 24;
    });
    const seenIds = new Set<string>();
    const athletes = getAthletesFromWorkouts();
    const activities = recentCompleted.map((w: any, index: number) => {
      const athleteId = w.athleteId || w.coach;
      const athlete = athletes.find((a) => a.id === athleteId);
      const completedTimestamp = w.completedDate ? new Date(w.completedDate).getTime() : new Date(w.date).getTime();
      let baseId = `${w.id}_${completedTimestamp}`;
      let uniqueId = baseId;
      let counter = 0;
      while (seenIds.has(uniqueId)) {
        counter++;
        uniqueId = `${baseId}_${counter}_${Date.now()}_${index}`;
      }
      seenIds.add(uniqueId);
      return {
        id: uniqueId,
        athleteId,
        athleteName: athlete?.name || `Atleta ${athleteId}`,
        workoutName: w.name,
        completedAt: w.completedDate || new Date().toISOString(),
        feedbackEmoji: w.feedbackEmoji || null,
      };
    });
    return activities.sort(
      (a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }, [workouts, athletesList]);

  const getTimeAgo = (completedDate: string) => {
    if (!completedDate) return 'há alguns minutos';
    const now = new Date().getTime();
    const completed = new Date(completedDate).getTime();
    const diffMinutes = Math.floor((now - completed) / (1000 * 60));
    
    if (diffMinutes < 1) return 'há alguns segundos';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  };

  const athletesNeedingAttentionList = useMemo(() => {
    const athletes = getAthletesFromWorkouts();
    return athletes
      .map((athlete) => {
        const athleteWorkouts = workouts.filter(
          (w: any) => (w.athleteId || w.coach) === athlete.id && w.status === 'Concluído'
        );
        const lastCompleted = athleteWorkouts.sort((a: any, b: any) => {
          const dateA = a.completedDate ? new Date(a.completedDate).getTime() : new Date(a.date).getTime();
          const dateB = b.completedDate ? new Date(b.completedDate).getTime() : new Date(b.date).getTime();
          return dateB - dateA;
        })[0];

        if (!lastCompleted) {
          return { ...athlete, daysSinceLastWorkout: 999 };
        }
        const lastCompletedDate = (lastCompleted as any).completedDate
          ? new Date((lastCompleted as any).completedDate).getTime()
          : new Date(lastCompleted.date).getTime();
        const daysSince = Math.floor((new Date().getTime() - lastCompletedDate) / (1000 * 60 * 60 * 24));
        if (daysSince <= 5) return null;
        return { ...athlete, daysSinceLastWorkout: daysSince };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.daysSinceLastWorkout - a.daysSinceLastWorkout);
  }, [workouts, athletesList]);

  const mostActiveAthletesList = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);

    const completedLastMonth = workouts.filter((w: any) => {
      if (w.status !== 'Concluído') return false;
      const completedDate = w.completedDate ? new Date(w.completedDate) : new Date(w.date);
      return completedDate >= oneMonthAgo;
    });

    const byAthlete = new Map<string, number>();
    completedLastMonth.forEach((w: any) => {
      const id = w.athleteId || w.coach;
      byAthlete.set(id, (byAthlete.get(id) || 0) + 1);
    });

    const athletes = getAthletesFromWorkouts();
    return Array.from(byAthlete.entries())
      .map(([athleteId, count]) => ({
        athleteId,
        athleteName: athletes.find((a) => a.id === athleteId)?.name || `Atleta ${athleteId}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [workouts, athletesList]);

  const weeklyStatsCoach = useMemo(
    () => ({
      athletesToday: athletesWhoTrainedTodayList.length,
      completedToday: todayCompletedForCoach.length,
      pendingWorkouts: workouts.filter((w: any) => w.status === 'Pendente').length,
    }),
    [athletesWhoTrainedTodayList, todayCompletedForCoach, workouts]
  );

  const loadWorkoutStatuses = useCallback(async () => {
    const savedType = await AsyncStorage.getItem('userType');
    if (savedType) setUserType(savedType as UserType);

    let athleteId: string | null = null;
    if (savedType === UserType.ATHLETE) {
      athleteId = await AsyncStorage.getItem('currentAthleteId');
      if (athleteId) setCurrentAthleteId(athleteId);
    }

    let allWorkouts: any[] = [];
    try {
      if (savedType === UserType.ATHLETE && athleteId) {
        allWorkouts = await listAssignedWorkoutsByAthleteId(athleteId);
      } else if (savedType === UserType.COACH && user?.id) {
        allWorkouts = await listAssignedWorkoutsByCoachId(user.id);
      }
    } catch (e) {
      console.warn('Erro ao carregar treinos:', e);
    }

    const finalWorkouts = allWorkouts;
    
    setWorkouts(finalWorkouts);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadWorkoutStatuses();
    }, [loadWorkoutStatuses])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadWorkoutStatuses();
      if (userType === UserType.ATHLETE && currentAthleteId) {
        await loadWeightHistory();
      }
      showToast('Dados atualizados!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      showToast('Erro ao atualizar dados', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [loadWorkoutStatuses, loadWeightHistory, userType, currentAthleteId, showToast]);

  const markWorkoutAsCompleted =(workoutId: string) => {
    setWorkouts(workouts.map((workout) => {
      if (workout.id === workoutId) {
        return {...workout, status: 'Concluído'};
      }
      return workout;
    }));
  };
  
  return (
    <ScrollView 
      className="flex-1 px-6 pt-12"
      style={{ backgroundColor: theme.colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
    <View className="flex-1 px-2 pt-12 pb-20" style={{ backgroundColor: theme.colors.background }}>
      {/* Onboarding / tour rápido */}
      <OnboardingModal
        visible={showOnboarding}
        onClose={async () => {
          setShowOnboarding(false);
          try {
            await AsyncStorage.setItem('hasSeenOnboarding_v1', 'true');
          } catch (error) {
            console.error('Erro ao salvar flag de onboarding:', error);
          }
        }}
        userType={userType}
      />

      {/* 
        TEMA ESCURO ESTILO ZEUS:
        - bg-dark-950 = Fundo preto quase absoluto (#0a0a0a)
        - text-white = Texto branco para contraste
        - primary-400/500 = Laranja vibrante como accent
      */}
      
      <View className="items-center mb-0">
        <Image
          source={require('../../assets/images/treinaLogo2.png')}
          style={{ width: 480, height: 192 }}
          resizeMode="contain"
        />
      </View>
      {userType === UserType.COACH && (
        <Text className="text-center mb-3 px-4 text-base leading-6" style={{ color: theme.colors.textSecondary, marginTop: -40 }}>
          Bem vindo Rodrigo ao seu app de gestão esportiva.
        </Text>
      )}

      {userType === UserType.COACH ? (
        //Dashboard do Treinador - Tema Escuro Estilo Zeus
        <View className="w-full mt-3">

          {/* Panorama Semanal - Cards de Estatísticas (altura reduzida) */}
          <View className="mb-4">
            <View className="flex-row items-center mb-4">
              <Image
                source={require('../../assets/images/PanoramaSemanal.png')}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
              <Text className="text-xl font-bold ml-2" style={themeStyles.text}>
                Panorama Semanal
              </Text>
            </View>
            <View className="flex-row gap-3">
              {/* Card: Ativos Hoje */}
              <View
                className="flex-1 rounded-xl py-2.5 px-3 border items-center"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#fb923c',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View
                  className="items-center justify-center mb-1.5 rounded-full"
                  style={{
                    width: 46,
                    height: 46,
                    backgroundColor: theme.mode === 'dark' ? 'rgba(14, 165, 233, 0.14)' : 'rgba(14, 165, 233, 0.08)',
                    borderWidth: 1,
                    borderColor: theme.mode === 'dark' ? 'rgba(14, 165, 233, 0.35)' : 'rgba(14, 165, 233, 0.2)',
                  }}
                >
                  <Image
                    source={require('../../assets/images/AtivosHoje.png')}
                    style={{ width: 36, height: 36 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  {weeklyStatsCoach.athletesToday}
                </Text>
                <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                  Ativos Hoje
                </Text>
              </View>

              {/* Card: Treinos Concluídos */}
              <View
                className="flex-1 rounded-xl py-2.5 px-3 border items-center"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View
                  className="items-center justify-center mb-1.5 rounded-full"
                  style={{
                    width: 46,
                    height: 46,
                    backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.08)',
                    borderWidth: 1,
                    borderColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <Image
                    source={require('../../assets/images/IconeWorkoutComplete.png')}
                    style={{ width: 36, height: 36 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  {weeklyStatsCoach.completedToday}
                </Text>
                <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                  Treinos Concluídos
                </Text>
              </View>

              {/* Card: Pendentes */}
              <View
                className="flex-1 rounded-xl py-2.5 px-3 border items-center"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View
                  className="items-center justify-center mb-1.5 rounded-full"
                  style={{
                    width: 46,
                    height: 46,
                    backgroundColor: theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.08)',
                    borderWidth: 1,
                    borderColor: theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <Image
                    source={require('../../assets/images/Pendentes.png')}
                    style={{ width: 36, height: 36 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  {weeklyStatsCoach.pendingWorkouts}
                </Text>
                <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                  Pendentes
                </Text>
              </View>
            </View>
          </View>

          {/* Botão Ver Agenda (Calendário do treinador) - espaçamento equilibrado com os quadrados e os botões */}
          <TouchableOpacity
            className="rounded-xl mt-5 mb-5"
            style={{
              borderWidth: 1,
              borderColor: 'rgba(251, 146, 60, 0.65)',
              shadowColor: '#fb923c',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 5,
              overflow: 'hidden',
            }}
            onPress={() => router.push('/coach-calendar')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                theme.mode === 'dark'
                  ? ['rgba(251,146,60,0.24)', 'rgba(251,146,60,0.12)']
                  : ['rgba(251,146,60,0.18)', 'rgba(251,146,60,0.08)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View className="flex-row items-center">
                <View
                  className="rounded-full items-center justify-center mr-3"
                  style={{
                    width: 30,
                    height: 30,
                    backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.28)' : 'rgba(251, 146, 60, 0.18)',
                    borderWidth: 1,
                    borderColor: 'rgba(251,146,60,0.55)',
                  }}
                >
                  <FontAwesome name="calendar" size={16} color={theme.colors.primary} />
                </View>
                <Text className="font-bold text-base" style={{ color: theme.colors.primary }}>
                  Ver minha agenda
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={theme.colors.primary} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Botões principais - estilo premium da marca Treina+ */}
          <View className="flex-row gap-5 mb-8">
            {/* Botão Biblioteca de Exercícios */}
            <TouchableOpacity 
              className="rounded-xl flex-1 border"
              style={{ 
                ...themeStyles.card,
                borderColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.55)' : 'rgba(251, 146, 60, 0.35)',
                backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.01)' : theme.colors.card,
                shadowColor: '#fb923c',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.22,
                shadowRadius: 6,
                elevation: 4,
                overflow: 'hidden',
              }}
              onPress={() => router.push('/exercises-library')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  theme.mode === 'dark'
                    ? ['rgba(251,146,60,0.12)', 'rgba(251,146,60,0.02)']
                    : ['rgba(251,146,60,0.10)', 'rgba(251,146,60,0.03)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 12, paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}
              >
                <Image
                  source={require('../../assets/images/BibliotecaDeExercicios.png')}
                  style={{ width: 84, height: 84, marginBottom: 12 }}
                  resizeMode="contain"
                />
                <Text 
                  className="font-bold text-center text-base tracking-tight"
                  style={themeStyles.text}
                >
                  Biblioteca de Exercícios
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Botão Meus Treinos */}
            <TouchableOpacity 
              className="rounded-xl flex-1 border"
              style={{ 
                ...themeStyles.card,
                borderColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.55)' : 'rgba(251, 146, 60, 0.35)',
                backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.01)' : theme.colors.card,
                shadowColor: '#fb923c',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.22,
                shadowRadius: 6,
                elevation: 4,
                overflow: 'hidden',
              }}
              onPress={() => router.push('/workouts-library')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  theme.mode === 'dark'
                    ? ['rgba(251,146,60,0.12)', 'rgba(251,146,60,0.02)']
                    : ['rgba(251,146,60,0.10)', 'rgba(251,146,60,0.03)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 12, paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}
              >
                <Image
                  source={require('../../assets/images/MeusTreinos1.png')}
                  style={{ width: 84, height: 84, marginBottom: 12 }}
                  resizeMode="contain"
                />
                <Text 
                  className="font-bold text-center text-base tracking-tight"
                  style={themeStyles.text}
                >
                  Meus Treinos
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Gráfico de Treinos Concluídos por Semana */}
          {coachWeeklyStats.length > 0 && (
            <View className="w-full mb-4">
              <View className="flex-row items-center mb-3">
                <Image
                  source={require('../../assets/images/IconeWorkoutComplete.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
                <Text className="text-xl font-bold ml-2" style={themeStyles.text}>
                  Treinos Concluídos por Semana
                </Text>
              </View>
              
              <View className="rounded-xl p-3 mb-3 border" style={themeStyles.card}>
                <BarChart
                  data={coachWeeklyStats.map((week) => ({
                    value: week.count,
                    label: week.label,
                    frontColor: '#3b82f6',
                    topLabelText: week.count.toString(),
                    topLabelTextStyle: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
                  }))}
                  width={300}
                  height={120}
                  barWidth={30}
                  spacing={12}
                  hideRules
                  xAxisThickness={1}
                  xAxisColor={theme.colors.borderSecondary}
                  yAxisThickness={1}
                  yAxisColor={theme.colors.borderSecondary}
                  yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 9 }}
                  xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 8 }}
                  noOfSections={4}
                  maxValue={Math.max(...coachWeeklyStats.map(w => w.count)) + 2}
                  isAnimated
                  animationDuration={800}
                  showGradient
                  gradientColor="#60a5fa"
                />
              </View>

              {/* Análise de Tendência */}
              {coachWeeklyTrend && (
                <View className="rounded-xl p-3 border" style={themeStyles.card}>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-[10px] mb-0.5" style={themeStyles.textSecondary}>Primeira semana</Text>
                      <Text className="font-bold text-lg" style={themeStyles.text}>
                        {coachWeeklyTrend?.firstCount} treinos
                      </Text>
                    </View>
                    
                    <View className="flex-1 items-center">
                      <Text className="text-[10px] mb-0.5" style={themeStyles.textSecondary}>Última semana</Text>
                      <Text className="font-bold text-lg" style={themeStyles.text}>
                        {coachWeeklyTrend?.lastCount} treinos
                      </Text>
                    </View>
                    
                    <View className="flex-1 items-end">
                      <Text className="text-[10px] mb-0.5" style={themeStyles.textSecondary}>Tendência</Text>
                      <View className="flex-row items-center gap-1.5">
                        {coachWeeklyTrend?.trend === 'increasing' && (
                          <>
                            <FontAwesome name="arrow-up" size={14} color="#10b981" />
                            <Text className="font-bold text-base" style={{ color: '#10b981' }}>
                              Aumentando
                            </Text>
                          </>
                        )}
                        {coachWeeklyTrend?.trend === 'decreasing' && (
                          <>
                            <FontAwesome name="arrow-down" size={14} color="#ef4444" />
                            <Text className="font-bold text-base" style={{ color: '#ef4444' }}>
                              Diminuindo
                            </Text>
                          </>
                        )}
                        {coachWeeklyTrend?.trend === 'stable' && (
                          <>
                            <FontAwesome name="minus" size={14} color={theme.colors.textTertiary} />
                            <Text className="font-bold text-base" style={themeStyles.textTertiary}>
                              Estável
                            </Text>
                          </>
                        )}
                      </View>
                      <Text className="text-[10px] mt-0.5" style={{
                        color: coachWeeklyTrend?.trend === 'increasing' ? '#10b981' :
                               coachWeeklyTrend?.trend === 'decreasing' ? '#ef4444' :
                               theme.colors.textTertiary
                      }}>
                        {(() => {
                          const trend = coachWeeklyTrend;
                          if (trend?.difference !== undefined && trend.difference !== 0) {
                            return (
                              <>
                                {trend.difference > 0 ? '+' : ''}
                                {trend.difference} treinos
                              </>
                            );
                          }
                          if (trend?.difference === 0) {
                            return 'Sem mudança';
                          }
                          return null;
                        })()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Taxa de Aderência dos Atletas */}
          {allAthletesAdherence.length > 0 && (
            <View className="w-full mb-4">
              <View className="flex-row items-center mb-2">
                <Image
                  source={require('../../assets/images/IconeTaxadeaderencia.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
                <Text className="text-xl font-bold ml-2" style={themeStyles.text}>
                  Taxa de Aderência dos Atletas
                </Text>
              </View>
              
              {/* Gráfico de Barras */}
              <View className="rounded-xl p-3 mb-2 border" style={themeStyles.card}>
                <BarChart
                  data={allAthletesAdherence.map((athlete) => ({
                    value: athlete.rate,
                    label: athlete.athleteName.length > 8 
                      ? athlete.athleteName.substring(0, 8) + '...' 
                      : athlete.athleteName,
                    frontColor: athlete.rate >= 70 ? '#10b981' : athlete.rate >= 50 ? '#f59e0b' : '#ef4444',
                    topLabelText: `${athlete.rate}%`,
                    topLabelTextStyle: { 
                      color: athlete.rate >= 70 ? '#10b981' : athlete.rate >= 50 ? '#f59e0b' : '#ef4444', 
                      fontSize: 9, 
                      fontWeight: 'bold' 
                    },
                  }))}
                  width={300}
                  height={100}
                  barWidth={28}
                  spacing={10}
                  hideRules
                  xAxisThickness={1}
                  xAxisColor={theme.colors.borderSecondary}
                  yAxisThickness={1}
                  yAxisColor={theme.colors.borderSecondary}
                  yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 8 }}
                  xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 7 }}
                  noOfSections={4}
                  maxValue={100}
                  isAnimated
                  animationDuration={800}
                  showGradient
                  gradientColor="#60a5fa"
                />
              </View>

              {/* Lista de Atletas com Aderência - Clicável */}
              <View className="rounded-xl p-2 border" style={themeStyles.card}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {allAthletesAdherence.map((athlete) => (
                      <TouchableOpacity
                        key={athlete.athleteId}
                        onPress={() => {
                          router.push({
                            pathname: '/athlete-profile',
                            params: { athleteId: athlete.athleteId },
                          });
                        }}
                        activeOpacity={0.7}
                        className="min-w-[130px] rounded-lg p-2.5 border"
                        style={{
                          backgroundColor: athlete.rate >= 70
                            ? (theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)')
                            : athlete.rate >= 50
                            ? (theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)')
                            : (theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'),
                          borderColor: athlete.rate >= 70
                            ? 'rgba(16, 185, 129, 0.3)'
                            : athlete.rate >= 50
                            ? 'rgba(245, 158, 11, 0.3)'
                            : 'rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        <Text className="font-semibold text-xs mb-0.5" style={themeStyles.text} numberOfLines={1}>
                          {athlete.athleteName}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mb-0.5">
                          <Text className="font-bold text-base" style={{
                            color: athlete.rate >= 70
                              ? '#10b981'
                              : athlete.rate >= 50
                              ? '#f59e0b'
                              : '#ef4444'
                          }}>
                            {athlete.rate}%
                          </Text>
                          {athlete.rate < 70 && (
                            <FontAwesome 
                              name="exclamation-triangle" 
                              size={10} 
                              color={athlete.rate >= 50 ? '#f59e0b' : '#ef4444'} 
                            />
                          )}
                        </View>
                        <Text className="text-[9px]" style={themeStyles.textSecondary}>
                          {athlete.completed}/{athlete.assigned} treinos
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Treinos Mais Difíceis (Baseado no Feedback) */}
          {mostDifficultWorkoutsList.length > 0 && (
            <View className="w-full mb-4">
              <View className="flex-row items-center mb-2">
                <Image
                  source={require('../../assets/images/iconetreinosmaisdificeis.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
                <Text className="text-xl font-bold ml-2" style={themeStyles.text}>
                  Treinos Mais Difíceis
                </Text>
              </View>
              
              {/* Lista dos 5 Treinos Mais Difíceis */}
              <View className="rounded-xl p-2 mb-2 border" style={themeStyles.card}>
                {mostDifficultWorkoutsList.map((workout, index) => (
                  <View
                    key={`${workout.workoutName}_${index}`}
                    className="flex-row items-center justify-between p-2.5 rounded-lg mb-1.5 border"
                    style={{
                      backgroundColor: index === 0 
                        ? (theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)')
                        : index === 1
                        ? (theme.mode === 'dark' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)')
                        : theme.colors.backgroundTertiary,
                      borderColor: index === 0 
                        ? 'rgba(239, 68, 68, 0.2)'
                        : index === 1
                        ? 'rgba(249, 115, 22, 0.2)'
                        : theme.colors.border,
                    }}
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        {index === 0 && (
                          <FontAwesome name="trophy" size={14} color="#ef4444" />
                        )}
                        {index === 1 && (
                          <FontAwesome name="star" size={14} color="#f97316" />
                        )}
                        <Text className="font-semibold text-sm" style={themeStyles.text} numberOfLines={1}>
                          {workout.workoutName}
                        </Text>
                      </View>
                      <Text className="text-[10px]" style={themeStyles.textSecondary}>
                        {workout.count} avaliação{workout.count !== 1 ? 'ões' : ''}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-bold text-base" style={{
                        color: workout.averageDifficulty >= 4.5 ? '#ef4444' :
                               workout.averageDifficulty >= 4 ? '#f97316' :
                               workout.averageDifficulty >= 3.5 ? '#f59e0b' :
                               theme.colors.textTertiary
                      }}>
                        {workout.averageDifficulty.toFixed(1)}
                      </Text>
                      <Text className="text-[9px]" style={themeStyles.textTertiary}>
                        {workout.averageDifficulty >= 4.5 ? 'Muito Difícil' :
                         workout.averageDifficulty >= 4 ? 'Difícil' :
                         workout.averageDifficulty >= 3.5 ? 'Normal-Difícil' :
                         'Média'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Gráfico de Distribuição de Dificuldade */}
              {difficultyDistributionChart.length > 0 && (
                <View className="rounded-xl p-2 border" style={themeStyles.card}>
                  <Text className="text-xs mb-2 text-center" style={themeStyles.textSecondary}>
                    Distribuição de Dificuldade
                  </Text>
                  <View className="flex-row gap-1.5 items-end justify-center">
                    {difficultyDistributionChart.map((item, index) => (
                      <View key={item.label} className="items-center flex-1">
                        <View
                          className="w-full rounded-t"
                          style={{
                            height: (item.value / Math.max(...difficultyDistributionChart.map(d => d.value))) * 60,
                            backgroundColor: item.color,
                            minHeight: 8,
                          }}
                        />
                        <Text className="text-[8px] mt-1 text-center" style={themeStyles.textSecondary} numberOfLines={1}>
                          {item.label}
                        </Text>
                        <Text className="text-[10px] font-semibold mt-0.5" style={themeStyles.text}>
                          {item.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Atletas Mais Ativos (últimos 30 dias) */}
          {mostActiveAthletesList.length > 0 && (
            <View className="w-full mb-4">
              <View className="flex-row items-center mb-2">
                <Image
                  source={require('../../assets/images/atletasmaisativos.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
                <Text className="text-xl font-bold ml-2" style={themeStyles.text}>
                  Atletas Mais Ativos
                </Text>
              </View>
              <Text className="text-xs mb-3" style={themeStyles.textSecondary}>
                Últimos 30 dias – treinos concluídos
              </Text>
              <View className="rounded-xl p-3 mb-2 border" style={themeStyles.card}>
                <BarChart
                  data={mostActiveAthletesList.map((athlete, index) => ({
                    value: athlete.count,
                    label: athlete.athleteName.length > 6
                      ? athlete.athleteName.substring(0, 6) + '..'
                      : athlete.athleteName,
                    frontColor: index === 0 ? '#eab308' : index === 1 ? '#a3a3a3' : index === 2 ? '#b45309' : '#3b82f6',
                    topLabelText: athlete.count.toString(),
                    topLabelTextStyle: { color: theme.colors.text, fontSize: 9, fontWeight: 'bold' },
                  }))}
                  width={300}
                  height={120}
                  barWidth={28}
                  spacing={10}
                  hideRules
                  xAxisThickness={1}
                  xAxisColor={theme.colors.borderSecondary}
                  yAxisThickness={1}
                  yAxisColor={theme.colors.borderSecondary}
                  yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 8 }}
                  xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 7 }}
                  noOfSections={4}
                  maxValue={Math.max(...mostActiveAthletesList.map(a => a.count)) + 2}
                  isAnimated
                  animationDuration={800}
                  showGradient
                  gradientColor="#60a5fa"
                />
              </View>
              <View className="rounded-xl p-2 border" style={themeStyles.card}>
                {mostActiveAthletesList.map((athlete, index) => (
                  <TouchableOpacity
                    key={athlete.athleteId}
                    onPress={() => router.push({ pathname: '/athlete-profile', params: { athleteId: athlete.athleteId } })}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between p-2.5 rounded-lg mb-1.5 border"
                    style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }}
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: index === 0 ? 'rgba(234,179,8,0.3)' : theme.colors.card }}>
                        <Text className="font-bold text-xs" style={themeStyles.text}>{index + 1}</Text>
                      </View>
                      <Text className="font-semibold text-sm" style={themeStyles.text} numberOfLines={1}>
                        {athlete.athleteName}
                      </Text>
                    </View>
                    <Text className="font-bold text-sm" style={{ color: theme.colors.primary }}>
                      {athlete.count} treino{athlete.count !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Atividade Recente - Atletas que completaram treinos hoje */}
          {athletesWhoTrainedTodayList.length > 0 && (
            <View className="mb-8">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                Atividade Recente
              </Text>
              {athletesWhoTrainedTodayList
                .slice(0, 3)
                .map((activity: any) => {
                const feedbackIconSrc = getFeedbackIconSource(activity.feedback, activity.feedbackEmoji);
                return (
                <TouchableOpacity
                  key={activity.id}
                  className="rounded-xl p-4 mb-3 flex-row items-center border"
                  style={{
                    ...themeStyles.card,
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                  onPress={() => {
                    router.push({
                      pathname: '/athlete-profile',
                      params: { athleteId: activity.athleteId },
                    });
                  }}
                >
                  {/* Avatar placeholder */}
                  <View className="w-12 h-12 rounded-full border items-center justify-center mr-3"
                    style={{
                      backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)',
                      borderColor: theme.colors.primary + '50',
                    }}
                  >
                    <Text className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                      {activity.athleteName.charAt(0)}
                    </Text>
                  </View>
                  
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-1">
                      <Text className="font-semibold flex-1" style={themeStyles.text}>
                        {activity.athleteName} finalizou o '{activity.workoutName}'
                      </Text>
                      {feedbackIconSrc && (
                        <Image
                          source={feedbackIconSrc}
                          style={{ width: 26, height: 26, marginLeft: 8 }}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                    <Text className="text-xs" style={themeStyles.textSecondary}>
                      {getTimeAgo(activity.completedAt)}
                    </Text>
                  </View>
                  
                  <View className="border px-3 py-1 rounded"
                    style={{
                      backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                      borderColor: '#10b981' + '50',
                    }}
                  >
                    <Text className="font-semibold text-xs" style={{ color: '#10b981' }}>
                      CONCLUÍDO
                    </Text>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Atenção Necessária - Atletas que não treinam há tempo */}
          {athletesNeedingAttentionList.length > 0 && (
            <View className="mb-8">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                Atenção Necessária
              </Text>
              {athletesNeedingAttentionList.slice(0, 3).map((athlete: any) => (
                <TouchableOpacity
                  key={athlete.id}
                  className="rounded-xl p-4 mb-3 flex-row items-center border"
                  style={{
                    ...themeStyles.card,
                    shadowColor: '#ef4444',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                  onPress={() => {
                    router.push({
                      pathname: '/athlete-profile',
                      params: { athleteId: athlete.id },
                    });
                  }}
                >
                  {/* Avatar placeholder */}
                  <View className="w-12 h-12 rounded-full border items-center justify-center mr-3"
                    style={{
                      backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                      borderColor: '#ef4444' + '50',
                    }}
                  >
                    <Text className="font-bold text-lg" style={{ color: '#ef4444' }}>
                      {athlete.name.charAt(0)}
                    </Text>
                  </View>
                  
                  <View className="flex-1">
                    <Text className="font-semibold mb-1" style={themeStyles.text}>
                      {athlete.name}
                    </Text>
                    <Text className="text-sm" style={themeStyles.textSecondary}>
                      Não treina há {athlete.daysSinceLastWorkout} {athlete.daysSinceLastWorkout === 1 ? 'dia' : 'dias'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </View>
      ) : userType === UserType.ATHLETE ? (
        //Dashboard do Atleta - Tema Escuro Estilo Zeus (Profissional)
        <View className="w-full mt-3">
          {/* Saudação Personalizada */}
          {currentAthleteId && (
            <View className="mb-6" style={{ marginTop: -35 }}>
              <Text className="text-2xl font-bold mb-2" style={themeStyles.text}>
                Olá, {userType === UserType.ATHLETE ? (user?.displayName || user?.email || 'Atleta') : (getAthletesFromWorkouts().find(a => a.id === currentAthleteId)?.name || 'Atleta')}!
              </Text>
              <Text className="text-base" style={themeStyles.textSecondary}>
                Acompanhe seus treinos e seu progresso
              </Text>
            </View>
          )}

          {/* Cards de Estatísticas */}
          <View className="mb-6">
            <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
              Seu Progresso
            </Text>
            <View className="flex-row gap-3">
              {/* Card: Treinos Esta Semana */}
              <View className="flex-1 rounded-xl py-3 px-3 border items-center justify-center"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#fb923c',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="items-center justify-center mb-0">
                  <Image
                    source={require('../../assets/images/IconeEstaSemanaAtleta.png')}
                    style={{ width: 52, height: 52 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-2xl font-bold mb-0 text-center" style={themeStyles.text}>
                  {athleteStats.thisWeekPending + athleteStats.thisWeekCompleted}
                </Text>
                <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                  Esta Semana
                </Text>
              </View>

              {/* Card: Concluídos */}
              <View className="flex-1 rounded-xl py-3 px-3 border items-center justify-center"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="items-center justify-center mb-0">
                  <Image
                    source={require('../../assets/images/IconeWorkoutComplete.png')}
                    style={{ width: 52, height: 52 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-2xl font-bold mb-0 text-center" style={themeStyles.text}>
                  {athleteStats.totalCompleted}
                </Text>
                <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                  Concluídos
                </Text>
              </View>

              {/* Card: Sequência */}
              <View className="flex-1 rounded-xl py-3 px-3 border items-center justify-center"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="items-center justify-center mb-0">
                  <Image
                    source={require('../../assets/images/Sequencia.png')}
                    style={{ width: 52, height: 52 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-2xl font-bold mb-0 text-center" style={themeStyles.text}>
                  {athleteStats.streak}
                </Text>
                <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                  Sequência
                </Text>
                <Text className="text-[10px] mt-1 text-center" style={themeStyles.textTertiary}>
                  Dias consecutivos
                </Text>
              </View>
            </View>
          </View>

          {/* Treino de Hoje - Destaque (movido para aparecer antes da frequência) */}
          {todayWorkouts.length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                🎯 Treino de Hoje
              </Text>
              
              {todayWorkouts.map((workout) => (
                <TouchableOpacity 
                  key={workout.id}
                  className="border-2 rounded-xl p-5 mb-3"
                  style={{
                    backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.1)' : 'rgba(251, 146, 60, 0.05)',
                    borderColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.3)' : 'rgba(251, 146, 60, 0.2)',
                    shadowColor: '#fb923c',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                  onPress={() => {
                    router.push({
                      pathname: '/workout-details',
                      params: {workoutId: workout.id}
                    });
                  }}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-xl font-bold mb-2" style={themeStyles.text}>
                        {workout.name}
                      </Text>
                      <Text className="text-sm mb-1" style={themeStyles.textSecondary}>
                        Treinador: {workout.coach}
                      </Text>
                      <Text className="text-sm" style={themeStyles.textTertiary}>
                        {workout.dayOfWeek}
                      </Text>
                    </View>
                    <View 
                      className="border px-4 py-2 rounded-full"
                      style={{
                        backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.3)' : 'rgba(251, 146, 60, 0.15)',
                        borderColor: theme.colors.primary,
                      }}
                    >
                      <Text className="text-sm font-bold" style={{ color: theme.colors.primary }}>
                        {workout.status}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="rounded-lg py-3 px-6 mt-2"
                    style={{ backgroundColor: theme.colors.primary }}
                    onPress={() => {
                      router.push({
                        pathname: '/workout-details',
                        params: {workoutId: workout.id}
                      });
                    }}
                  >
                    <Text className="font-bold text-center text-base" style={{ color: '#fff' }}>
                      ▶ Iniciar Treino
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Gráfico de Frequência de Treinos */}
          {completedWorkouts.length > 0 && (
            <View className="w-full mb-6">
              <View className="flex-row items-center mb-4">
                <Image
                  source={require('../../assets/images/IconeTaxadeaderencia.png')}
                  style={{ width: 42, height: 42, marginRight: 10 }}
                  resizeMode="contain"
                />
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  Frequência de Treinos
                </Text>
              </View>
              
              {weeklyFrequency.length > 0 ? (
                <>
                  <View className="rounded-xl p-4 mb-4 border" style={themeStyles.card}>
                    <BarChart
                      data={weeklyFrequency.map((week, index) => ({
                        value: week.count,
                        label: week.label,
                        frontColor: '#fb923c',
                        topLabelText: week.count.toString(),
                        topLabelTextStyle: { color: '#fb923c', fontSize: 11, fontWeight: 'bold' },
                      }))}
                      width={300}
                      height={140}
                      barWidth={35}
                      spacing={15}
                      hideRules
                      xAxisThickness={1}
                      xAxisColor={theme.colors.borderSecondary}
                      yAxisThickness={1}
                      yAxisColor={theme.colors.borderSecondary}
                      yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
                      xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 9 }}
                      noOfSections={4}
                      maxValue={Math.max(...weeklyFrequency.map(w => w.count)) + 2}
                      isAnimated
                      animationDuration={800}
                      showGradient
                      gradientColor="#ff8c42"
                    />
                  </View>

                  {/* Estatísticas */}
                  <View className="rounded-xl p-4 border" style={themeStyles.card}>
                    <View className="flex-row justify-between items-center mb-3">
                      <View className="flex-1">
                        <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Média Semanal</Text>
                        <Text className="font-bold text-xl" style={themeStyles.text}>
                          {averagePerWeekDisplay} treinos
                        </Text>
                      </View>
                      
                      {weekComparison && (
                        <View className="flex-1 items-end">
                          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Esta Semana</Text>
                          <View className="flex-row items-center gap-2">
                            <Text className="font-bold text-xl" style={themeStyles.text}>
                              {weekComparison?.current}
                            </Text>
                            <Text className="text-sm font-semibold" style={{
                              color: (weekComparison?.difference || 0) > 0
                                ? '#10b981'
                                : (weekComparison?.difference || 0) < 0
                                ? '#ef4444'
                                : theme.colors.textTertiary
                            }}>
                              {(weekComparison?.difference || 0) > 0 ? '+' : ''}
                              {weekComparison?.difference} 
                              {weekComparison?.difference !== 0 && (
                                <Text className="text-xs">
                                  {' '}({weekComparison?.percentage}%)
                                </Text>
                              )}
                            </Text>
                          </View>
                          <Text className="text-[10px] mt-1" style={themeStyles.textTertiary}>
                            vs semana anterior
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Sequência destacada */}
                    <View className="mt-3 pt-3" style={{ borderTopColor: theme.colors.border, borderTopWidth: 1 }}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <FontAwesome name="fire" size={16} color="#f59e0b" />
                          <Text className="text-sm" style={themeStyles.textSecondary}>Sequência Atual</Text>
                        </View>
                        <Text className="font-bold text-lg" style={themeStyles.text}>
                          {athleteStats.streak} dias consecutivos
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <EmptyState
                  icon="bar-chart"
                  message="Complete treinos para ver sua frequência semanal aqui."
                />
              )}
            </View>
          )}

          {/* Gráfico de Evolução de Peso/Carga */}
          {availableExercises.length > 0 && (
            <View className="w-full mb-6">
              <View className="flex-row items-center mb-4">
                <Image
                  source={require('../../assets/images/AtletaProfileEProgress.png')}
                  style={{ width: 42, height: 42, marginRight: 10 }}
                  resizeMode="contain"
                />
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  Evolução de Peso/Carga
                </Text>
              </View>
              
              {/* Seletor de Exercício */}
              <View className="mb-4">
                <Text className="text-sm mb-2" style={themeStyles.textSecondary}>Selecione o exercício:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    {availableExercises.map((exercise) => (
                      <TouchableOpacity
                        key={exercise.id}
                        onPress={() => setSelectedExercise(exercise.id)}
                        className="px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: selectedExercise === exercise.id
                            ? (theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)')
                            : theme.colors.backgroundTertiary,
                          borderColor: selectedExercise === exercise.id
                            ? theme.colors.primary
                            : theme.colors.border,
                        }}
                      >
                        <Text className="font-semibold" style={{
                          color: selectedExercise === exercise.id
                            ? theme.colors.primary
                            : theme.colors.textTertiary
                        }}>
                          {exercise.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* Gráfico */}
              {weightHistory.length > 0 ? (
                <View className="rounded-xl p-4 border" style={themeStyles.card}>
                  <Text className="font-semibold mb-2 text-center" style={themeStyles.text}>
                    {availableExercises.find(e => e.id === selectedExercise)?.name || 'Exercício'}
                  </Text>
                  
                    <LineChart
                      data={weightHistory.map((record, index) => ({
                        value: record.weight,
                        label: new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                      }))}
                      width={280}
                      height={140}
                    color="#fb923c"
                    thickness={3}
                    curved
                    areaChart
                    startFillColor="#fb923c"
                    endFillColor="#fb923c"
                    startOpacity={0.3}
                    endOpacity={0.05}
                    spacing={weightHistory.length > 1 ? Math.max(60, 280 / (weightHistory.length - 1)) : 60}
                    initialSpacing={0}
                    noOfSections={4}
                    maxValue={Math.max(...weightHistory.map(r => r.weight)) + 10}
                    yAxisColor={theme.colors.borderSecondary}
                    xAxisColor={theme.colors.borderSecondary}
                    yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 9 }}
                    hideDataPoints={false}
                    dataPointsColor="#fb923c"
                    dataPointsRadius={6}
                    dataPointsWidth={6}
                    dataPointsHeight={6}
                    textShiftY={-2}
                    textShiftX={-5}
                    textFontSize={10}
                    hideRules={false}
                    rulesColor={theme.colors.border}
                    rulesType="solid"
                    yAxisTextNumberOfLines={1}
                    showVerticalLines={false}
                    xAxisLabelsVerticalShift={10}
                    xAxisLabelTexts={weightHistory.map((record) => 
                      new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    )}
                      pointerConfig={{
                        pointer1Color: '#fb923c',
                        pointerStripUptoDataPoint: true,
                        pointerStripColor: '#fb923c',
                        pointerStripWidth: 2,
                        activatePointersOnLongPress: true,
                        hidePointer1: false,
                        autoAdjustPointerLabelPosition: true,
                      pointerLabelComponent: (items: any) => {
                        return (
                          <View
                            style={{
                              height: 40,
                              width: 60,
                              backgroundColor: '#fb923c',
                              borderRadius: 8,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>
                              {items[0].value}kg
                            </Text>
                          </View>
                        );
                      },
                    }}
                  />
                  
                  {/* Estatísticas */}
                  {weightHistory.length > 1 && (
                    <View className="mt-4 pt-4" style={{ borderTopColor: theme.colors.border, borderTopWidth: 1 }}>
                      <View className="flex-row justify-between">
                        <View>
                          <Text className="text-xs" style={themeStyles.textSecondary}>Primeiro registro</Text>
                          <Text className="font-semibold" style={themeStyles.text}>
                            {weightHistory[0]?.weight} kg
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs" style={themeStyles.textSecondary}>Último registro</Text>
                          <Text className="font-semibold" style={themeStyles.text}>
                            {weightHistory[weightHistory.length - 1]?.weight} kg
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs" style={themeStyles.textSecondary}>Evolução</Text>
                          <Text className="font-semibold" style={{
                            color: weightHistory[weightHistory.length - 1]?.weight > weightHistory[0]?.weight
                              ? '#10b981'
                              : weightHistory[weightHistory.length - 1]?.weight < weightHistory[0]?.weight
                              ? '#ef4444'
                              : theme.colors.textTertiary
                          }}>
                            {weightHistory[weightHistory.length - 1]?.weight > weightHistory[0]?.weight ? '+' : ''}
                            {(weightHistory[weightHistory.length - 1]?.weight - weightHistory[0]?.weight).toFixed(1)} kg
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <EmptyState
                  icon="line-chart"
                  message="Nenhum registro de peso encontrado para este exercício. Registre o peso usado durante os treinos para ver a evolução aqui."
                />
              )}
            </View>
          )}

          {/* Gráfico de Média de Dificuldade dos Treinos */}
          {completedWorkouts.some((w: any) => w.feedback) && (
            <View className="w-full mb-6">
              <View className="flex-row items-center mb-4">
                <Image
                  source={require('../../assets/images/iconetreinosmaisdificeis.png')}
                  style={{ width: 42, height: 42, marginRight: 10 }}
                  resizeMode="contain"
                />
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  Média de Dificuldade dos Treinos
                </Text>
              </View>
              
              {difficultyTrend.length > 0 ? (
                <>
                  {difficultyTrend.length === 1 ? (() => {
                    const weekOnly = difficultyTrend[0];
                    const iconOnly = feedbackIconForAverage(weekOnly.average);
                    return (
                    <View className="rounded-xl p-4 mb-4 border" style={themeStyles.card}>
                      <View className="items-center justify-center py-4">
                        <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Média atual</Text>
                        <View className="flex-row items-center justify-center gap-3 mb-1">
                          <Text className="text-4xl font-bold" style={{ color: '#f59e0b' }}>
                            {weekOnly.average.toFixed(1)}
                          </Text>
                          {iconOnly ? (
                            <Image
                              source={iconOnly}
                              style={{ width: 44, height: 44 }}
                              resizeMode="contain"
                            />
                          ) : null}
                        </View>
                        <Text className="text-xs mt-1" style={themeStyles.textTertiary}>
                          {weekOnly.label} • dados insuficientes para tendência
                        </Text>
                      </View>
                    </View>
                    );
                  })() : (
                    <View className="rounded-xl p-4 mb-4 border" style={themeStyles.card}>
                      <LineChart
                        data={difficultyTrend.map((week) => ({
                          value: week.average,
                          label: week.label,
                        }))}
                        width={280}
                        height={140}
                        color="#f59e0b"
                        thickness={3}
                        curved
                        areaChart
                        startFillColor="#f59e0b"
                        endFillColor="#f59e0b"
                        startOpacity={0.3}
                        endOpacity={0.05}
                        spacing={Math.max(60, 280 / (difficultyTrend.length - 1))}
                        initialSpacing={0}
                        noOfSections={4}
                        maxValue={5}
                        yAxisColor={theme.colors.borderSecondary}
                        xAxisColor={theme.colors.borderSecondary}
                        yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 9 }}
                        hideDataPoints={false}
                        dataPointsColor="#f59e0b"
                        dataPointsRadius={6}
                        dataPointsWidth={6}
                        dataPointsHeight={6}
                        textShiftY={-2}
                        textShiftX={-5}
                        textFontSize={10}
                        hideRules={false}
                        rulesColor={theme.colors.border}
                        rulesType="solid"
                        yAxisTextNumberOfLines={1}
                        showVerticalLines={false}
                        xAxisLabelsVerticalShift={10}
                        xAxisLabelTexts={difficultyTrend.map((week) => week.label)}
                        pointerConfig={{
                          pointer1Color: '#f59e0b',
                          pointerStripUptoDataPoint: true,
                          pointerStripColor: '#f59e0b',
                          pointerStripWidth: 2,
                          activatePointersOnLongPress: true,
                          hidePointer1: false,
                          autoAdjustPointerLabelPosition: true,
                          pointerLabelComponent: (items: any) => {
                            return (
                              <View
                                style={{
                                  height: 40,
                                  width: 60,
                                  backgroundColor: '#f59e0b',
                                  borderRadius: 8,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}
                              >
                                <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>
                                  {items[0].value.toFixed(1)}
                                </Text>
                              </View>
                            );
                          },
                        }}
                      />
                      {(() => {
                        const trendWeeks = difficultyTrend;
                        const lastW = trendWeeks[trendWeeks.length - 1];
                        const lastIcon = feedbackIconForAverage(lastW.average);
                        return (
                          <View
                            className="flex-row items-center justify-center mt-3 pt-3"
                            style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }}
                          >
                            <Text className="text-xs mr-2" style={themeStyles.textSecondary}>
                              Última semana (média)
                            </Text>
                            <Text className="text-lg font-bold mr-2" style={{ color: '#f59e0b' }}>
                              {lastW.average.toFixed(1)}
                            </Text>
                            {lastIcon ? (
                              <Image source={lastIcon} style={{ width: 36, height: 36 }} resizeMode="contain" />
                            ) : null}
                          </View>
                        );
                      })()}
                    </View>
                  )}

                  {/* Análise de Tendência */}
                  {difficultyTrendAnalysis && (() => {
                    const analysis = difficultyTrendAnalysis!;
                    const iconFirst = feedbackIconForAverage(analysis.firstAverage);
                    const iconLast = feedbackIconForAverage(analysis.lastAverage);
                    const labelFor = (avg: number) =>
                      getFeedbackLabel(Math.max(1, Math.min(5, Math.round(avg))), null) ?? 'Média';
                    return (
                    <View className="rounded-xl p-4 border" style={themeStyles.card}>
                      <View className="flex-row justify-between items-center mb-3">
                        <View className="flex-1">
                          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Primeira semana</Text>
                          <View className="flex-row items-center gap-2 flex-wrap">
                            <Text className="font-bold text-xl" style={themeStyles.text}>
                              {analysis.firstAverage.toFixed(1)}
                            </Text>
                            {iconFirst ? (
                              <Image source={iconFirst} style={{ width: 28, height: 28 }} resizeMode="contain" />
                            ) : null}
                          </View>
                          <Text className="text-[10px] mt-1" style={themeStyles.textTertiary}>
                            {labelFor(analysis.firstAverage)}
                          </Text>
                        </View>
                        
                        <View className="flex-1 items-center">
                          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Última semana</Text>
                          <View className="flex-row items-center gap-2 flex-wrap justify-center">
                            <Text className="font-bold text-xl" style={themeStyles.text}>
                              {analysis.lastAverage.toFixed(1)}
                            </Text>
                            {iconLast ? (
                              <Image source={iconLast} style={{ width: 28, height: 28 }} resizeMode="contain" />
                            ) : null}
                          </View>
                          <Text className="text-[10px] mt-1" style={themeStyles.textTertiary}>
                            {labelFor(analysis.lastAverage)}
                          </Text>
                        </View>
                        
                        <View className="flex-1 items-end">
                          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Tendência</Text>
                          <View className="flex-row items-center gap-2">
                            {analysis.trend === 'improving' && (
                              <>
                                <FontAwesome name="arrow-down" size={16} color="#10b981" />
                                <Text className="font-bold text-xl" style={{ color: '#10b981' }}>
                                  Melhorando
                                </Text>
                              </>
                            )}
                            {analysis.trend === 'declining' && (
                              <>
                                <FontAwesome name="arrow-up" size={16} color="#ef4444" />
                                <Text className="font-bold text-xl" style={{ color: '#ef4444' }}>
                                  Mais Difícil
                                </Text>
                              </>
                            )}
                            {analysis.trend === 'stable' && (
                              <>
                                <FontAwesome name="minus" size={16} color={theme.colors.textTertiary} />
                                <Text className="font-bold text-xl" style={themeStyles.textTertiary}>
                                  Estável
                                </Text>
                              </>
                            )}
                          </View>
                          <Text className="text-xs mt-1" style={{
                            color: analysis.trend === 'improving' ? '#10b981' :
                                   analysis.trend === 'declining' ? '#ef4444' :
                                   theme.colors.textTertiary
                          }}>
                            {analysis.difference !== undefined && analysis.difference !== 0 ? (
                              <>
                                {analysis.difference > 0 ? '+' : ''}
                                {analysis.difference.toFixed(1)} pontos
                              </>
                            ) : analysis.difference === 0 ? (
                              'Sem mudança'
                            ) : null}
                          </Text>
                        </View>
                      </View>
                    </View>
                    );
                  })()}
                </>
              ) : (
                <EmptyState
                  icon="star-o"
                  message="Complete treinos e dê feedback para ver a evolução da dificuldade aqui."
                />
              )}
            </View>
          )}

          {/* Seção de Conquistas e Recordes */}
          {completedWorkouts.length > 0 && (
            <View className="w-full mb-6">
              <View className="flex-row items-center mb-4">
                <Image
                  source={require('../../assets/images/atletasmaisativos.png')}
                  style={{ width: 42, height: 42, marginRight: 10 }}
                  resizeMode="contain"
                />
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  Conquistas e Recordes
                </Text>
              </View>
              
              <View className="flex-row gap-3 flex-wrap">
                {/* Card: Maior Sequência */}
                {maxStreakData.maxStreak > 0 && (
                  <View className="flex-1 min-w-[150px] rounded-xl p-4 border items-center"
                    style={{
                      ...themeStyles.card,
                      borderColor: theme.mode === 'dark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                      shadowColor: '#f59e0b',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Image
                      source={require('../../assets/images/Sequencia.png')}
                      style={{ width: 44, height: 44 }}
                      resizeMode="contain"
                    />
                    <Text className="text-xs mt-2 mb-2 text-center" style={themeStyles.textSecondary}>
                      Maior Sequência
                    </Text>
                    <Text className="text-3xl font-bold mb-1 text-center" style={{ color: '#f59e0b' }}>
                      {maxStreakData.maxStreak}
                    </Text>
                    <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                      dias consecutivos
                    </Text>
                    {maxStreakData.currentStreak > 0 && maxStreakData.currentStreak < maxStreakData.maxStreak && (
                      <Text className="text-[10px] mt-1 text-center" style={themeStyles.textTertiary}>
                        Atual: {maxStreakData.currentStreak} dias
                      </Text>
                    )}
                    {maxStreakData.currentStreak === maxStreakData.maxStreak && maxStreakData.currentStreak > 0 && (
                      <Text className="text-[10px] mt-1 font-semibold text-center" style={{ color: '#10b981' }}>
                        🎯 Novo recorde!
                      </Text>
                    )}
                  </View>
                )}

                {/* Card: Melhor Semana */}
                {bestWeekData && (
                  <View className="flex-1 min-w-[150px] rounded-xl p-4 border items-center"
                    style={{
                      ...themeStyles.card,
                      borderColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.3)' : 'rgba(251, 146, 60, 0.2)',
                      shadowColor: '#fb923c',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Image
                      source={require('../../assets/images/IconeEstaSemanaAtleta.png')}
                      style={{ width: 44, height: 44 }}
                      resizeMode="contain"
                    />
                    <Text className="text-xs mt-2 mb-2 text-center" style={themeStyles.textSecondary}>
                      Melhor Semana
                    </Text>
                    <Text className="text-3xl font-bold mb-1 text-center" style={{ color: theme.colors.primary }}>
                      {bestWeekData?.count}
                    </Text>
                    <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                      treinos
                    </Text>
                    <Text className="text-[10px] mt-1 text-center" style={themeStyles.textTertiary}>
                      {bestWeekData?.label}
                    </Text>
                  </View>
                )}

                {/* Card: Melhor Mês */}
                {bestMonthData && (
                  <View className="flex-1 min-w-[150px] rounded-xl p-4 border items-center"
                    style={{
                      ...themeStyles.card,
                      borderColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                      shadowColor: '#10b981',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Image
                      source={require('../../assets/images/atletasmaisativos.png')}
                      style={{ width: 44, height: 44 }}
                      resizeMode="contain"
                    />
                    <Text className="text-xs mt-2 mb-2 text-center" style={themeStyles.textSecondary}>
                      Melhor Mês
                    </Text>
                    <Text className="text-3xl font-bold mb-1 text-center" style={{ color: '#10b981' }}>
                      {bestMonthData?.count}
                    </Text>
                    <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                      treinos
                    </Text>
                    <Text className="text-[10px] mt-1 text-center" style={themeStyles.textTertiary}>
                      {bestMonthData?.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Próximos Treinos */}
          {upcomingWorkouts.length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                📅 Próximos Treinos
              </Text>
              
              {upcomingWorkouts.map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  className="rounded-xl p-4 mb-3 border"
                  style={{
                    ...themeStyles.card,
                    shadowColor: '#fb923c',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                  onPress={() => {
                    router.push({
                      pathname: '/workout-details',
                      params: { workoutId: workout.id }
                    });
                  }}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
                        {workout.name}
                      </Text>
                      <Text className="text-sm mb-1" style={themeStyles.textSecondary}>
                        Treinador: {workout.coach}
                      </Text>
                      <Text className="text-sm" style={themeStyles.textSecondary}>
                        {workout.dayOfWeek} • {new Date(workout.date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <View className="border px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)',
                        borderColor: theme.colors.primary + '50',
                      }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
                        {workout.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Treinos Concluídos (últimos 5) */}
          {completedWorkouts.length > 0 && (
            <View className="w-full">
              <View className="flex-row items-center mb-4">
                <Image
                  source={require('../../assets/images/IconeWorkoutComplete.png')}
                  style={{ width: 42, height: 42, marginRight: 10 }}
                  resizeMode="contain"
                />
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  Concluídos Recentes
                </Text>
              </View>
              
              {completedWorkouts
                .sort((a: any, b: any) => {
                  const dateA = a.completedDate ? new Date(a.completedDate).getTime() : new Date(a.date).getTime();
                  const dateB = b.completedDate ? new Date(b.completedDate).getTime() : new Date(b.date).getTime();
                  return dateB - dateA;
                })
                .slice(0, 5)
                .map((workout: any) => {
                const feedbackIconSrc = getFeedbackIconSource(workout.feedback, workout.feedbackEmoji);
                return (
                <TouchableOpacity
                  key={workout.id}
                  className="border rounded-xl p-4 mb-3"
                  style={{
                    backgroundColor: theme.colors.backgroundTertiary,
                    borderColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                  onPress={() => {
                    router.push({
                      pathname: '/workout-details',
                      params: { workoutId: workout.id }
                    });
                  }}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
                        {workout.name}
                      </Text>
                      <Text className="text-sm mb-1" style={themeStyles.textSecondary}>
                        Treinador: {workout.coach}
                      </Text>
                      <Text className="text-xs" style={themeStyles.textTertiary}>
                        {workout.dayOfWeek} • {new Date(workout.date).toLocaleDateString('pt-BR')}
                        {workout.completedDate && (
                          <Text> • Concluído em {new Date(workout.completedDate).toLocaleDateString('pt-BR')}</Text>
                        )}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View className="border px-3 py-1 rounded-full mb-2"
                        style={{
                          backgroundColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                          borderColor: '#10b981' + '50',
                        }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: '#10b981' }}>
                          {workout.status}
                        </Text>
                      </View>
                      {feedbackIconSrc && (
                        <Image
                          source={feedbackIconSrc}
                          style={{ width: 40, height: 40 }}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Mensagem quando não há treinos */}
          {workouts.length === 0 && (
            <EmptyState
              icon="calendar-times-o"
              message="Seu treinador ainda não atribuiu treinos para você."
            />
          )}
        </View>
      
      ) : null}

    </View>
    </ScrollView>
  );
}

/**
 * RESUMO DO QUE VOCÊ VIU:
 * 
 * 1. View = Container (caixa)
 * 2. Text = Texto
 * 3. TouchableOpacity = Botão
 * 4. className = Estilização com NativeWind/Tailwind (classes CSS)
 * 5. onPress = Ação quando clica
 * 
 * PRÓXIMO PASSO: Vamos adicionar ESTADO para mudar algo quando clicar!
 */
