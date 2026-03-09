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
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';




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
      const weightHistoryJson = await AsyncStorage.getItem('exercise_weight_history');
      if (!weightHistoryJson) {
        setWeightHistory([]);
        setAvailableExercises([]);
        return;
      }

      const allHistory = JSON.parse(weightHistoryJson);
      const athleteHistory = (Array.isArray(allHistory) ? allHistory : []).filter(
        (r: any) => r.athleteId === currentAthleteId
      );
      
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

  const getTodayWorkouts = () => {
    return workouts.filter(w => w.isToday && w.status === 'Pendente');
  };

  const getThisWeekWorkouts =() => {
    return workouts.filter(w => 
      w.isThisWeek &&
      w.status === 'Pendente' &&
      !w.isToday
    );
  };

  const getCompletedWorkouts =() => {
    return workouts.filter(w =>w.status === 'Concluído');
  };

  // Funções auxiliares para o Dashboard do Atleta
  const getAthleteStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Domingo da semana
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

    // Calcular sequência (dias consecutivos com treino concluído)
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
      const workoutDate = workout.completedDate 
        ? new Date(workout.completedDate)
        : new Date(workout.date);
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
  };

  const getUpcomingWorkouts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calcular fim da semana (domingo)
    const endOfWeek = new Date(today);
    const daysUntilSunday = 7 - today.getDay(); // 0 = domingo
    endOfWeek.setDate(today.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return workouts
      .filter((w: any) => {
        if (w.status !== 'Pendente') return false;
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        // Apenas treinos da semana atual (até domingo)
        return workoutDate >= today && workoutDate <= endOfWeek;
      })
      .sort((a: any, b: any) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  };

  // Função para agrupar treinos concluídos por semana
  const getWeeklyFrequency = () => {
    const completedWorkouts = getCompletedWorkouts();
    
    if (completedWorkouts.length === 0) {
      return [];
    }

    // Criar um mapa para agrupar por semana
    const weeklyMap = new Map<string, number>();
    
    completedWorkouts.forEach((workout: any) => {
      // Usar completedDate se existir, senão usar date
      const workoutDate = workout.completedDate 
        ? new Date(workout.completedDate)
        : new Date(workout.date);
      
      // Calcular início da semana (domingo)
      const weekStart = new Date(workoutDate);
      const dayOfWeek = weekStart.getDay(); // 0 = domingo
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      
      // Criar chave única para a semana (formato: YYYY-MM-DD)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      // Incrementar contador da semana
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + 1);
    });

    // Converter mapa para array e ordenar por data
    const weeklyData = Array.from(weeklyMap.entries())
      .map(([weekStart, count]) => ({
        weekStart: new Date(weekStart),
        count,
        label: formatWeekLabel(new Date(weekStart)),
      }))
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

    // Pegar apenas as últimas 8 semanas para não sobrecarregar o gráfico
    return weeklyData.slice(-8);
  };

  // Função auxiliar para formatar label da semana
  const formatWeekLabel = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startDay = weekStart.getDate();
    const startMonth = weekStart.getMonth() + 1;
    const endDay = weekEnd.getDate();
    const endMonth = weekEnd.getMonth() + 1;
    
    // Se for a mesma semana, mostrar apenas uma data
    if (startMonth === endMonth) {
      return `${startDay}/${startMonth}`;
    }
    
    return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
  };

  // Função para calcular média de treinos por semana
  const getAveragePerWeek = () => {
    const weeklyData = getWeeklyFrequency();
    if (weeklyData.length === 0) return '0';
    
    const total = weeklyData.reduce((sum, week) => sum + week.count, 0);
    return (total / weeklyData.length).toFixed(1);
  };

  // Função para comparar semana atual com anterior
  const getWeekComparison = () => {
    const weeklyData = getWeeklyFrequency();
    if (weeklyData.length < 2) return null;

    const currentWeek = weeklyData[weeklyData.length - 1];
    const previousWeek = weeklyData[weeklyData.length - 2];

    return {
      current: currentWeek.count,
      previous: previousWeek.count,
      difference: currentWeek.count - previousWeek.count,
      percentage: previousWeek.count > 0 
        ? (((currentWeek.count - previousWeek.count) / previousWeek.count) * 100).toFixed(0)
        : '0',
    };
  };

  // Função para calcular média de dificuldade por semana
  const getDifficultyTrend = () => {
    const completedWorkouts = getCompletedWorkouts();
    
    if (completedWorkouts.length === 0) {
      return [];
    }

    // Criar um mapa para agrupar feedbacks por semana
    const weeklyMap = new Map<string, number[]>();
    
    completedWorkouts.forEach((workout: any) => {
      // Só processar treinos com feedback
      if (!workout.feedback || workout.feedback < 1 || workout.feedback > 5) {
        return;
      }

      // Usar completedDate se existir, senão usar date
      const workoutDate = workout.completedDate 
        ? new Date(workout.completedDate)
        : new Date(workout.date);
      
      // Calcular início da semana (domingo)
      const weekStart = new Date(workoutDate);
      const dayOfWeek = weekStart.getDay(); // 0 = domingo
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      
      // Criar chave única para a semana (formato: YYYY-MM-DD)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      // Adicionar feedback ao array da semana
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, []);
      }
      weeklyMap.get(weekKey)!.push(workout.feedback);
    });

    // Calcular média de cada semana e converter para array
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

    // Pegar apenas as últimas 8 semanas
    return weeklyData.slice(-8);
  };

  // Função para identificar tendência de dificuldade
  const getDifficultyTrendAnalysis = () => {
    const trendData = getDifficultyTrend();
    if (trendData.length < 2) return null;

    const firstWeek = trendData[0];
    const lastWeek = trendData[trendData.length - 1];
    const difference = lastWeek.average - firstWeek.average;

    // Determinar se está melhorando (diminuindo dificuldade) ou piorando (aumentando)
    // Menor número = mais fácil = melhorando
    // Maior número = mais difícil = piorando
    const isImproving = difference < 0;
    const trend = Math.abs(difference) < 0.1 ? 'stable' : (isImproving ? 'improving' : 'declining');

    return {
      firstAverage: firstWeek.average,
      lastAverage: lastWeek.average,
      difference: parseFloat(difference.toFixed(2)),
      trend, // 'improving', 'declining', 'stable'
      isImproving,
    };
  };

  // Função para calcular maior sequência de dias consecutivos (record)
  const getMaxStreak = () => {
    const completedWorkouts = getCompletedWorkouts();
    
    if (completedWorkouts.length === 0) {
      return { maxStreak: 0, currentStreak: 0 };
    }

    // Ordenar treinos por data de conclusão
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
  };

  // Função para encontrar semana com mais treinos
  const getBestWeek = () => {
    const weeklyData = getWeeklyFrequency();
    
    if (weeklyData.length === 0) {
      return null;
    }

    // Encontrar semana com mais treinos
    const bestWeek = weeklyData.reduce((best, week) => 
      week.count > best.count ? week : best
    );

    return {
      count: bestWeek.count,
      label: bestWeek.label,
      weekStart: bestWeek.weekStart,
    };
  };

  // Função para encontrar mês com mais treinos
  const getBestMonth = (): { count: number; label: string; monthKey: string } | null => {
    const completedWorkouts = getCompletedWorkouts();
    
    if (completedWorkouts.length === 0) {
      return null;
    }

    // Criar mapa para agrupar por mês
    const monthlyMap = new Map<string, number>();
    
    completedWorkouts.forEach((workout: any) => {
      const workoutDate = workout.completedDate 
        ? new Date(workout.completedDate)
        : new Date(workout.date);
      
      // Criar chave única para o mês (formato: YYYY-MM)
      const monthKey = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
    });

    // Encontrar mês com mais treinos
    let bestMonth: { count: number; label: string; monthKey: string } | null = null;
    let maxCount = 0;

    monthlyMap.forEach((count, monthKey) => {
      if (count > maxCount) {
        maxCount = count;
        const [year, month] = monthKey.split('-');
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        bestMonth = {
          count,
          label: `${monthNames[parseInt(month) - 1]} ${year}`,
          monthKey,
        };
      }
    });

    return bestMonth;
  };

  // Função para agrupar treinos concluídos por semana (para o Treinador - todos os atletas)
  const getCoachWeeklyStats = () => {
    // Buscar todos os treinos concluídos (de todos os atletas)
    const allCompletedWorkouts = workouts.filter((w: any) => w.status === 'Concluído');
    
    if (allCompletedWorkouts.length === 0) {
      return [];
    }

    // Criar um mapa para agrupar por semana
    const weeklyMap = new Map<string, number>();
    
    allCompletedWorkouts.forEach((workout: any) => {
      // Usar completedDate se existir, senão usar date
      const workoutDate = workout.completedDate 
        ? new Date(workout.completedDate)
        : new Date(workout.date);
      
      // Calcular início da semana (domingo)
      const weekStart = new Date(workoutDate);
      const dayOfWeek = weekStart.getDay(); // 0 = domingo
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      
      // Criar chave única para a semana (formato: YYYY-MM-DD)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      // Incrementar contador da semana
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + 1);
    });

    // Converter mapa para array e ordenar por data
    const weeklyData = Array.from(weeklyMap.entries())
      .map(([weekStart, count]) => ({
        weekStart: new Date(weekStart),
        count,
        label: formatWeekLabel(new Date(weekStart)),
      }))
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

    // Pegar apenas as últimas 8 semanas
    return weeklyData.slice(-8);
  };

  // Função para calcular tendência de treinos concluídos (para o Treinador)
  const getCoachWeeklyTrend = () => {
    const weeklyData = getCoachWeeklyStats();
    if (weeklyData.length < 2) return null;

    const firstWeek = weeklyData[0];
    const lastWeek = weeklyData[weeklyData.length - 1];
    const difference = lastWeek.count - firstWeek.count;

    const isIncreasing = difference > 0;
    const trend = Math.abs(difference) < 1 ? 'stable' : (isIncreasing ? 'increasing' : 'decreasing');

    return {
      firstCount: firstWeek.count,
      lastCount: lastWeek.count,
      difference,
      trend, // 'increasing', 'decreasing', 'stable'
      isIncreasing,
    };
  };

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

  // Função para obter taxa de aderência de todos os atletas (derivados dos treinos)
  const getAllAthletesAdherence = () => {
    const athletes = getAthletesFromWorkouts();
    const adherenceData = athletes
      .map((athlete) => {
        const adherence = calculateAdherenceRate(athlete.id);
        if (!adherence) return null;
        return { ...adherence, athleteName: athlete.name };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.rate - a.rate);
    return adherenceData;
  };

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

  // Função para obter lista dos treinos mais difíceis
  const getMostDifficultWorkouts = () => {
    // Pegar todos os nomes únicos de treinos concluídos com feedback
    const workoutNames = new Set<string>();
    workouts.forEach((w: any) => {
      const hasFeedback = (w as any).feedback !== undefined && (w as any).feedback !== null;
      if (w.status === 'Concluído' && hasFeedback && (w as any).feedback >= 1 && (w as any).feedback <= 5) {
        workoutNames.add(w.name);
      }
    });

    // Calcular dificuldade média para cada treino
    const difficultyData = Array.from(workoutNames)
      .map((workoutName) => getWorkoutDifficulty(workoutName))
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.averageDifficulty - a.averageDifficulty) // Ordenar por mais difícil primeiro
      .slice(0, 5); // Pegar apenas os 5 mais difíceis

    return difficultyData;
  };

  // Função para obter distribuição de dificuldade (para gráfico)
  const getDifficultyDistribution = () => {
    const completedWorkouts = workouts.filter((w: any) => {
      const hasFeedback = (w as any).feedback !== undefined && (w as any).feedback !== null;
      return w.status === 'Concluído' && 
        hasFeedback && 
        (w as any).feedback >= 1 && 
        (w as any).feedback <= 5;
    });

    if (completedWorkouts.length === 0) {
      return [];
    }

    // Contar quantos treinos em cada nível de dificuldade
    const distribution = {
      1: 0, // Muito Fácil
      2: 0, // Fácil
      3: 0, // Normal
      4: 0, // Difícil
      5: 0, // Muito Difícil
    };

    completedWorkouts.forEach((w: any) => {
      const feedback = (w as any).feedback as number;
      if (feedback >= 1 && feedback <= 5) {
        distribution[feedback as keyof typeof distribution]++;
      }
    });

    // Converter para array para o gráfico
    return [
      { label: 'Muito Fácil', value: distribution[1], color: '#10b981' },
      { label: 'Fácil', value: distribution[2], color: '#22c55e' },
      { label: 'Normal', value: distribution[3], color: '#f59e0b' },
      { label: 'Difícil', value: distribution[4], color: '#f97316' },
      { label: 'Muito Difícil', value: distribution[5], color: '#ef4444' },
    ].filter(item => item.value > 0); // Remover níveis sem treinos
  };

  // Funções auxiliares para o Dashboard do Treinador
  const getTodayCompletedWorkouts = () => {
    const today = new Date().toISOString().split('T')[0];
    return workouts.filter((w: any) => {
      if (w.status !== 'Concluído') return false;
      // Verificar se foi concluído hoje pela data ou completedDate
      const completedDate = w.completedDate ? new Date(w.completedDate).toISOString().split('T')[0] : w.date;
      return completedDate === today;
    });
  };

  const getAthletesWhoTrainedToday = () => {
    // Buscar treinos concluídos nas últimas 24 horas
    const recentCompleted = workouts.filter((w: any) => {
      if (w.status !== 'Concluído') return false;
      const completedDate = w.completedDate ? new Date(w.completedDate) : new Date(w.date);
      // Últimas 24 horas
      const hoursAgo = (new Date().getTime() - completedDate.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 24;
    });
    
    // Criar lista de atividades individuais (não agrupadas por atleta)
    // Garantir keys únicas mesmo se houver treinos com IDs duplicados
    const seenIds = new Set<string>();
    const athletes = getAthletesFromWorkouts();
    const activities = recentCompleted.map((w: any, index: number) => {
      const athleteId = w.athleteId || w.coach;
      const athlete = athletes.find(a => a.id === athleteId);
      
      // Criar ID único: usar workout.id + completedAt timestamp + índice para garantir unicidade absoluta
      const completedTimestamp = w.completedDate 
        ? new Date(w.completedDate).getTime() 
        : new Date(w.date).getTime();
      
      // ID base
      let baseId = `${w.id}_${completedTimestamp}`;
      
      // Se já existe, adicionar índice e timestamp adicional
      let uniqueId = baseId;
      let counter = 0;
      while (seenIds.has(uniqueId)) {
        counter++;
        uniqueId = `${baseId}_${counter}_${Date.now()}_${index}`;
      }
      
      seenIds.add(uniqueId);
      
      return {
        id: uniqueId,
        athleteId: athleteId,
        athleteName: athlete?.name || `Atleta ${athleteId}`,
        workoutName: w.name,
        completedAt: w.completedDate || new Date().toISOString(),
        feedbackEmoji: w.feedbackEmoji || null,
      };
    });
    
    // Ordenar por timestamp mais recente primeiro
    return activities.sort((a: any, b: any) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  };

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

  const getAthletesNeedingAttention = () => {
    const athletes = getAthletesFromWorkouts();
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    return athletes
      .map((athlete) => {
        const athleteWorkouts = workouts.filter((w: any) =>
          (w.athleteId || w.coach) === athlete.id && w.status === 'Concluído'
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
  };

  // Atletas mais ativos: ranking por treinos concluídos no último mês
  const getMostActiveAthletes = () => {
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
        athleteName: athletes.find(a => a.id === athleteId)?.name || `Atleta ${athleteId}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  // Estatísticas para o Panorama Semanal
  const getWeeklyStats = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Atletas únicos que treinaram hoje
    const athletesToday = getAthletesWhoTrainedToday().length;
    
    // Treinos concluídos hoje
    const completedToday = getTodayCompletedWorkouts().length;
    
    // Treinos pendentes (todos os status Pendente)
    const pendingWorkouts = workouts.filter((w: any) => w.status === 'Pendente').length;
    
    return {
      athletesToday,
      completedToday,
      pendingWorkouts,
    };
  };

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
          source={require('../../assets/images/coachem.png')}
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
            <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
              Panorama Semanal
            </Text>
            <View className="flex-row gap-3">
              {/* Card: Ativos Hoje */}
              <View className="flex-1 rounded-xl py-2.5 px-3 border"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#fb923c',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center mb-1">
                  <FontAwesome name="users" size={16} color="#fb923c" />
                </View>
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  {getWeeklyStats().athletesToday}
                </Text>
                <Text className="text-xs" style={themeStyles.textSecondary}>
                  Ativos Hoje
                </Text>
              </View>

              {/* Card: Treinos Concluídos */}
              <View className="flex-1 rounded-xl py-2.5 px-3 border"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center mb-1">
                  <FontAwesome name="check-circle" size={16} color="#10b981" />
                </View>
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  {getWeeklyStats().completedToday}
                </Text>
                <Text className="text-xs" style={themeStyles.textSecondary}>
                  Treinos Concluídos
                </Text>
              </View>

              {/* Card: Pendentes */}
              <View className="flex-1 rounded-xl py-2.5 px-3 border"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center mb-1">
                  <FontAwesome name="clock-o" size={16} color="#f59e0b" />
                </View>
                <Text className="text-xl font-bold" style={themeStyles.text}>
                  {getWeeklyStats().pendingWorkouts}
                </Text>
                <Text className="text-xs" style={themeStyles.textSecondary}>
                  Pendentes
                </Text>
              </View>
            </View>
          </View>

          {/* Botão Ver Agenda (Calendário do treinador) - espaçamento equilibrado com os quadrados e os botões */}
          <TouchableOpacity
            className="border-2 rounded-xl flex-row items-center justify-center py-3 px-4 mt-5 mb-5"
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)',
              borderColor: theme.colors.primary + '60',
            }}
            onPress={() => router.push('/coach-calendar')}
            activeOpacity={0.7}
          >
            <FontAwesome name="calendar" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text className="font-semibold text-base" style={{ color: theme.colors.primary }}>
              Ver minha agenda
            </Text>
          </TouchableOpacity>

          {/* Botões principais - mesmo estilo dos cards Atividade Recente: borda fina + sombra verde */}
          <View className="flex-row gap-5 mb-8">
            {/* Botão Biblioteca de Exercícios */}
            <TouchableOpacity 
              className="rounded-xl flex-1 items-center justify-center py-6 border"
              style={{ 
                ...themeStyles.card,
                borderColor: '#10b981',
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
                overflow: 'hidden',
              }}
              onPress={() => router.push('/exercises-library')}
              activeOpacity={0.7}
            >
              <FontAwesome 
                name="book" 
                size={40} 
                color={theme.colors.text} 
                style={{ marginBottom: 16 }}
              />
              <Text 
                className="font-bold text-center text-base tracking-tight"
                style={themeStyles.text}
              >
                Biblioteca de Exercícios
              </Text>
            </TouchableOpacity>

            {/* Botão Meus Treinos */}
            <TouchableOpacity 
              className="rounded-xl flex-1 items-center justify-center py-6 border"
              style={{ 
                ...themeStyles.card,
                borderColor: '#10b981',
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
                overflow: 'hidden',
              }}
              onPress={() => router.push('/workouts-library')}
              activeOpacity={0.7}
            >
              <FontAwesome 
                name="trophy" 
                size={40} 
                color={theme.colors.text} 
                style={{ marginBottom: 16 }}
              />
              <Text 
                className="font-bold text-center text-base tracking-tight"
                style={themeStyles.text}
              >
                Meus Treinos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gráfico de Treinos Concluídos por Semana */}
          {getCoachWeeklyStats().length > 0 && (
            <View className="w-full mb-4">
              <Text className="text-xl font-bold mb-3" style={themeStyles.text}>
                📊 Treinos Concluídos por Semana
              </Text>
              
              <View className="rounded-xl p-3 mb-3 border" style={themeStyles.card}>
                <BarChart
                  data={getCoachWeeklyStats().map((week) => ({
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
                  maxValue={Math.max(...getCoachWeeklyStats().map(w => w.count)) + 2}
                  isAnimated
                  animationDuration={800}
                  showGradient
                  gradientColor="#60a5fa"
                />
              </View>

              {/* Análise de Tendência */}
              {getCoachWeeklyTrend() && (
                <View className="rounded-xl p-3 border" style={themeStyles.card}>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-[10px] mb-0.5" style={themeStyles.textSecondary}>Primeira semana</Text>
                      <Text className="font-bold text-lg" style={themeStyles.text}>
                        {getCoachWeeklyTrend()?.firstCount} treinos
                      </Text>
                    </View>
                    
                    <View className="flex-1 items-center">
                      <Text className="text-[10px] mb-0.5" style={themeStyles.textSecondary}>Última semana</Text>
                      <Text className="font-bold text-lg" style={themeStyles.text}>
                        {getCoachWeeklyTrend()?.lastCount} treinos
                      </Text>
                    </View>
                    
                    <View className="flex-1 items-end">
                      <Text className="text-[10px] mb-0.5" style={themeStyles.textSecondary}>Tendência</Text>
                      <View className="flex-row items-center gap-1.5">
                        {getCoachWeeklyTrend()?.trend === 'increasing' && (
                          <>
                            <FontAwesome name="arrow-up" size={14} color="#10b981" />
                            <Text className="font-bold text-base" style={{ color: '#10b981' }}>
                              Aumentando
                            </Text>
                          </>
                        )}
                        {getCoachWeeklyTrend()?.trend === 'decreasing' && (
                          <>
                            <FontAwesome name="arrow-down" size={14} color="#ef4444" />
                            <Text className="font-bold text-base" style={{ color: '#ef4444' }}>
                              Diminuindo
                            </Text>
                          </>
                        )}
                        {getCoachWeeklyTrend()?.trend === 'stable' && (
                          <>
                            <FontAwesome name="minus" size={14} color={theme.colors.textTertiary} />
                            <Text className="font-bold text-base" style={themeStyles.textTertiary}>
                              Estável
                            </Text>
                          </>
                        )}
                      </View>
                      <Text className="text-[10px] mt-0.5" style={{
                        color: getCoachWeeklyTrend()?.trend === 'increasing' ? '#10b981' :
                               getCoachWeeklyTrend()?.trend === 'decreasing' ? '#ef4444' :
                               theme.colors.textTertiary
                      }}>
                        {(() => {
                          const trend = getCoachWeeklyTrend();
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
          {getAllAthletesAdherence().length > 0 && (
            <View className="w-full mb-4">
              <Text className="text-xl font-bold mb-2" style={themeStyles.text}>
                📈 Taxa de Aderência dos Atletas
              </Text>
              
              {/* Gráfico de Barras */}
              <View className="rounded-xl p-3 mb-2 border" style={themeStyles.card}>
                <BarChart
                  data={getAllAthletesAdherence().map((athlete) => ({
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
                    {getAllAthletesAdherence().map((athlete) => (
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
          {getMostDifficultWorkouts().length > 0 && (
            <View className="w-full mb-4">
              <Text className="text-xl font-bold mb-2" style={themeStyles.text}>
                💪 Treinos Mais Difíceis
              </Text>
              
              {/* Lista dos 5 Treinos Mais Difíceis */}
              <View className="rounded-xl p-2 mb-2 border" style={themeStyles.card}>
                {getMostDifficultWorkouts().map((workout, index) => (
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
              {getDifficultyDistribution().length > 0 && (
                <View className="rounded-xl p-2 border" style={themeStyles.card}>
                  <Text className="text-xs mb-2 text-center" style={themeStyles.textSecondary}>
                    Distribuição de Dificuldade
                  </Text>
                  <View className="flex-row gap-1.5 items-end justify-center">
                    {getDifficultyDistribution().map((item, index) => (
                      <View key={item.label} className="items-center flex-1">
                        <View
                          className="w-full rounded-t"
                          style={{
                            height: (item.value / Math.max(...getDifficultyDistribution().map(d => d.value))) * 60,
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
          {getMostActiveAthletes().length > 0 && (
            <View className="w-full mb-4">
              <Text className="text-xl font-bold mb-2" style={themeStyles.text}>
                🏅 Atletas Mais Ativos
              </Text>
              <Text className="text-xs mb-3" style={themeStyles.textSecondary}>
                Últimos 30 dias – treinos concluídos
              </Text>
              <View className="rounded-xl p-3 mb-2 border" style={themeStyles.card}>
                <BarChart
                  data={getMostActiveAthletes().map((athlete, index) => ({
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
                  maxValue={Math.max(...getMostActiveAthletes().map(a => a.count)) + 2}
                  isAnimated
                  animationDuration={800}
                  showGradient
                  gradientColor="#60a5fa"
                />
              </View>
              <View className="rounded-xl p-2 border" style={themeStyles.card}>
                {getMostActiveAthletes().map((athlete, index) => (
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
          {getAthletesWhoTrainedToday().length > 0 && (
            <View className="mb-8">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                Atividade Recente
              </Text>
              {getAthletesWhoTrainedToday()
                .slice(0, 3)
                .map((activity: any) => (
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
                      {activity.feedbackEmoji && (
                        <Text className="text-2xl ml-2">
                          {activity.feedbackEmoji}
                        </Text>
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
              ))}
            </View>
          )}

          {/* Atenção Necessária - Atletas que não treinam há tempo */}
          {getAthletesNeedingAttention().length > 0 && (
            <View className="mb-8">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                Atenção Necessária
              </Text>
              {getAthletesNeedingAttention().slice(0, 3).map((athlete: any) => (
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
              <View className="flex-1 rounded-xl p-4 border"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#fb923c',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center mb-2">
                  <FontAwesome name="calendar" size={18} color="#fb923c" />
                </View>
                <Text className="text-2xl font-bold mb-1" style={themeStyles.text}>
                  {getAthleteStats().thisWeekPending + getAthleteStats().thisWeekCompleted}
                </Text>
                <Text className="text-xs" style={themeStyles.textSecondary}>
                  Esta Semana
                </Text>
              </View>

              {/* Card: Concluídos */}
              <View className="flex-1 rounded-xl p-4 border"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center mb-2">
                  <FontAwesome name="check-circle" size={18} color="#10b981" />
                </View>
                <Text className="text-2xl font-bold mb-1" style={themeStyles.text}>
                  {getAthleteStats().totalCompleted}
                </Text>
                <Text className="text-xs" style={themeStyles.textSecondary}>
                  Concluídos
                </Text>
              </View>

              {/* Card: Sequência */}
              <View className="flex-1 rounded-xl p-4 border"
                style={{
                  ...themeStyles.card,
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center mb-2">
                  <FontAwesome name="fire" size={18} color="#f59e0b" />
                </View>
                <Text className="text-2xl font-bold mb-1" style={themeStyles.text}>
                  {getAthleteStats().streak}
                </Text>
                <Text className="text-xs" style={themeStyles.textSecondary}>
                  Sequência
                </Text>
                <Text className="text-[10px] mt-1" style={themeStyles.textTertiary}>
                  Dias consecutivos
                </Text>
              </View>
            </View>
          </View>

          {/* Treino de Hoje - Destaque (movido para aparecer antes da frequência) */}
          {getTodayWorkouts().length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                🎯 Treino de Hoje
              </Text>
              
              {getTodayWorkouts().map((workout) => (
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
          {getCompletedWorkouts().length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                📊 Frequência de Treinos
              </Text>
              
              {getWeeklyFrequency().length > 0 ? (
                <>
                  <View className="rounded-xl p-4 mb-4 border" style={themeStyles.card}>
                    <BarChart
                      data={getWeeklyFrequency().map((week, index) => ({
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
                      maxValue={Math.max(...getWeeklyFrequency().map(w => w.count)) + 2}
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
                          {getAveragePerWeek()} treinos
                        </Text>
                      </View>
                      
                      {getWeekComparison() && (
                        <View className="flex-1 items-end">
                          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Esta Semana</Text>
                          <View className="flex-row items-center gap-2">
                            <Text className="font-bold text-xl" style={themeStyles.text}>
                              {getWeekComparison()?.current}
                            </Text>
                            <Text className="text-sm font-semibold" style={{
                              color: (getWeekComparison()?.difference || 0) > 0
                                ? '#10b981'
                                : (getWeekComparison()?.difference || 0) < 0
                                ? '#ef4444'
                                : theme.colors.textTertiary
                            }}>
                              {(getWeekComparison()?.difference || 0) > 0 ? '+' : ''}
                              {getWeekComparison()?.difference} 
                              {getWeekComparison()?.difference !== 0 && (
                                <Text className="text-xs">
                                  {' '}({getWeekComparison()?.percentage}%)
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
                          {getAthleteStats().streak} dias consecutivos
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
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                📈 Evolução de Peso/Carga
              </Text>
              
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
          {getCompletedWorkouts().some((w: any) => w.feedback) && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                📊 Média de Dificuldade dos Treinos
              </Text>
              
              {getDifficultyTrend().length > 0 ? (
                <>
                  <View className="rounded-xl p-4 mb-4 border" style={themeStyles.card}>
                    <LineChart
                      data={getDifficultyTrend().map((week) => ({
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
                      spacing={getDifficultyTrend().length > 1 ? Math.max(60, 280 / (getDifficultyTrend().length - 1)) : 60}
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
                      xAxisLabelTexts={getDifficultyTrend().map((week) => week.label)}
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
                  </View>

                  {/* Análise de Tendência */}
                  {getDifficultyTrendAnalysis() && (
                    <View className="rounded-xl p-4 border" style={themeStyles.card}>
                      <View className="flex-row justify-between items-center mb-3">
                        <View className="flex-1">
                          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Primeira semana</Text>
                          <Text className="font-bold text-xl" style={themeStyles.text}>
                            {getDifficultyTrendAnalysis()?.firstAverage.toFixed(1)}
                          </Text>
                          <Text className="text-[10px] mt-1" style={themeStyles.textTertiary}>
                            {getDifficultyTrendAnalysis()?.firstAverage.toFixed(1) === '1.0' ? 'Muito Fácil' :
                             getDifficultyTrendAnalysis()?.firstAverage.toFixed(1) === '2.0' ? 'Fácil' :
                             getDifficultyTrendAnalysis()?.firstAverage.toFixed(1) === '3.0' ? 'Normal' :
                             getDifficultyTrendAnalysis()?.firstAverage.toFixed(1) === '4.0' ? 'Difícil' :
                             getDifficultyTrendAnalysis()?.firstAverage.toFixed(1) === '5.0' ? 'Muito Difícil' :
                             'Média'}
                          </Text>
                        </View>
                        
                        <View className="flex-1 items-center">
                          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Última semana</Text>
                          <Text className="font-bold text-xl" style={themeStyles.text}>
                            {getDifficultyTrendAnalysis()?.lastAverage.toFixed(1)}
                          </Text>
                          <Text className="text-[10px] mt-1" style={themeStyles.textTertiary}>
                            {getDifficultyTrendAnalysis()?.lastAverage.toFixed(1) === '1.0' ? 'Muito Fácil' :
                             getDifficultyTrendAnalysis()?.lastAverage.toFixed(1) === '2.0' ? 'Fácil' :
                             getDifficultyTrendAnalysis()?.lastAverage.toFixed(1) === '3.0' ? 'Normal' :
                             getDifficultyTrendAnalysis()?.lastAverage.toFixed(1) === '4.0' ? 'Difícil' :
                             getDifficultyTrendAnalysis()?.lastAverage.toFixed(1) === '5.0' ? 'Muito Difícil' :
                             'Média'}
                          </Text>
                        </View>
                        
                        <View className="flex-1 items-end">
                          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Tendência</Text>
                          <View className="flex-row items-center gap-2">
                            {getDifficultyTrendAnalysis()?.trend === 'improving' && (
                              <>
                                <FontAwesome name="arrow-down" size={16} color="#10b981" />
                                <Text className="font-bold text-xl" style={{ color: '#10b981' }}>
                                  Melhorando
                                </Text>
                              </>
                            )}
                            {getDifficultyTrendAnalysis()?.trend === 'declining' && (
                              <>
                                <FontAwesome name="arrow-up" size={16} color="#ef4444" />
                                <Text className="font-bold text-xl" style={{ color: '#ef4444' }}>
                                  Mais Difícil
                                </Text>
                              </>
                            )}
                            {getDifficultyTrendAnalysis()?.trend === 'stable' && (
                              <>
                                <FontAwesome name="minus" size={16} color={theme.colors.textTertiary} />
                                <Text className="font-bold text-xl" style={themeStyles.textTertiary}>
                                  Estável
                                </Text>
                              </>
                            )}
                          </View>
                          <Text className="text-xs mt-1" style={{
                            color: getDifficultyTrendAnalysis()?.trend === 'improving' ? '#10b981' :
                                   getDifficultyTrendAnalysis()?.trend === 'declining' ? '#ef4444' :
                                   theme.colors.textTertiary
                          }}>
                            {(() => {
                              const analysis = getDifficultyTrendAnalysis();
                              if (analysis?.difference !== undefined && analysis.difference !== 0) {
                                return (
                                  <>
                                    {analysis.difference > 0 ? '+' : ''}
                                    {analysis.difference.toFixed(1)} pontos
                                  </>
                                );
                              }
                              if (analysis?.difference === 0) {
                                return 'Sem mudança';
                              }
                              return null;
                            })()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
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
          {getCompletedWorkouts().length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                🏆 Conquistas e Recordes
              </Text>
              
              <View className="flex-row gap-3 flex-wrap">
                {/* Card: Maior Sequência */}
                {getMaxStreak().maxStreak > 0 && (
                  <View className="flex-1 min-w-[150px] rounded-xl p-4 border"
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
                    <View className="flex-row items-center mb-2">
                      <FontAwesome name="fire" size={20} color="#f59e0b" />
                      <Text className="text-xs ml-2" style={themeStyles.textSecondary}>Maior Sequência</Text>
                    </View>
                    <Text className="text-3xl font-bold mb-1" style={{ color: '#f59e0b' }}>
                      {getMaxStreak().maxStreak}
                    </Text>
                    <Text className="text-xs" style={themeStyles.textSecondary}>
                      dias consecutivos
                    </Text>
                    {getMaxStreak().currentStreak > 0 && getMaxStreak().currentStreak < getMaxStreak().maxStreak && (
                      <Text className="text-[10px] mt-1" style={themeStyles.textTertiary}>
                        Atual: {getMaxStreak().currentStreak} dias
                      </Text>
                    )}
                    {getMaxStreak().currentStreak === getMaxStreak().maxStreak && getMaxStreak().currentStreak > 0 && (
                      <Text className="text-[10px] mt-1 font-semibold" style={{ color: '#10b981' }}>
                        🎯 Novo recorde!
                      </Text>
                    )}
                  </View>
                )}

                {/* Card: Melhor Semana */}
                {getBestWeek() && (
                  <View className="flex-1 min-w-[150px] rounded-xl p-4 border"
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
                    <View className="flex-row items-center mb-2">
                      <FontAwesome name="calendar-check-o" size={20} color="#fb923c" />
                      <Text className="text-xs ml-2" style={themeStyles.textSecondary}>Melhor Semana</Text>
                    </View>
                    <Text className="text-3xl font-bold mb-1" style={{ color: theme.colors.primary }}>
                      {getBestWeek()?.count}
                    </Text>
                    <Text className="text-xs" style={themeStyles.textSecondary}>
                      treinos
                    </Text>
                    <Text className="text-[10px] mt-1" style={themeStyles.textTertiary}>
                      {getBestWeek()?.label}
                    </Text>
                  </View>
                )}

                {/* Card: Melhor Mês */}
                {getBestMonth() && (
                  <View className="flex-1 min-w-[150px] rounded-xl p-4 border"
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
                    <View className="flex-row items-center mb-2">
                      <FontAwesome name="trophy" size={20} color="#10b981" />
                      <Text className="text-xs ml-2" style={themeStyles.textSecondary}>Melhor Mês</Text>
                    </View>
                    <Text className="text-3xl font-bold mb-1" style={{ color: '#10b981' }}>
                      {getBestMonth()?.count}
                    </Text>
                    <Text className="text-xs" style={themeStyles.textSecondary}>
                      treinos
                    </Text>
                    <Text className="text-[10px] mt-1" style={themeStyles.textTertiary}>
                      {getBestMonth()?.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Próximos Treinos */}
          {getUpcomingWorkouts().length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                📅 Próximos Treinos
              </Text>
              
              {getUpcomingWorkouts().map((workout) => (
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
          {getCompletedWorkouts().length > 0 && (
            <View className="w-full">
              <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                ✅ Concluídos Recentes
              </Text>
              
              {getCompletedWorkouts()
                .sort((a: any, b: any) => {
                  const dateA = a.completedDate ? new Date(a.completedDate).getTime() : new Date(a.date).getTime();
                  const dateB = b.completedDate ? new Date(b.completedDate).getTime() : new Date(b.date).getTime();
                  return dateB - dateA;
                })
                .slice(0, 5)
                .map((workout: any) => (
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
                      {workout.feedbackEmoji && (
                        <Text className="text-2xl">
                          {workout.feedbackEmoji}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
