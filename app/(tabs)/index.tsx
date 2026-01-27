/**
 * TELA INICIAL - Versão Simplificada para Aprendizado
 * 
 * Esta é a tela mais simples possível para você entender os conceitos básicos.
 * Vamos explicar TUDO linha por linha!
 */

import { UserType } from '@/src/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';




/**
 * O QUE É ISSO?
 * 
 * Esta é uma FUNÇÃO que retorna uma TELA (componente).
 * No React Native, cada tela é uma função que retorna elementos visuais.
 */
export default function HomeScreen() {

  const router = useRouter();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [currentAthleteId, setCurrentAthleteId] = useState<string | null>(null);
  
  // Estados para gráfico de evolução de peso (atleta)
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Array<{id: string, name: string}>>([]);

  const mockAthletes = [
    { id: '1', name: 'João Silva', sport: 'Futebol', status: 'Ativo'},
    { id: '2', name: 'Maria Oliveira', sport: 'Vôlei', status: 'Ativo'},
    { id: '3', name: 'Pedro Santos', sport: 'Basquete', status: 'Ativo'},
    { id: '4', name: 'Ana Souza', sport: 'Atletismo', status: 'Ativo'},
    { id: '5', name: 'Carlos Ferreira', sport: 'Futebol', status: 'Ativo'},
    { id: '6', name: 'Laura Rodrigues', sport: 'Vôlei', status: 'Ativo'},
    { id: '7', name: 'Rafael Oliveira', sport: 'Basquete', status: 'Ativo'},
    { id: '8', name: 'Camila Silva', sport: 'Atletismo', status: 'Ativo'},
  ]
  
  const [workouts, setWorkouts] = useState([
    {
      id: '1',
      name: 'Treino de Força - Pernas',
      date: '2026-01-06',
      scheduledDate: '2026-01-06',
      status: 'Concluído',
      coach: 'João Silva',
      dayOfWeek: 'Segunda-feira',
      isToday: false,
      isThisWeek: false,
    },
    {
      id: '2',
      name: 'Treino de Força - Peito',
      date: new Date().toISOString().split('T')[0], // Data de hoje
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Pendente',
      coach: 'Maria Oliveira',
      dayOfWeek: new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
      isToday: true,
      isThisWeek: true,
    },
    {
      id: '3',
      name: 'Treino de Força - Costas',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Amanhã
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'Pendente',
      coach: 'João Silva',
      dayOfWeek: new Date(Date.now() + 86400000).toLocaleDateString('pt-BR', { weekday: 'long' }),
      isToday: false,
      isThisWeek: true,
    },
    {
      id: '4',
      name: 'Treino de Força - Bíceps',
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Depois de amanhã
      scheduledDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      status: 'Pendente',
      coach: 'Ana Souza',
      dayOfWeek: new Date(Date.now() + 172800000).toLocaleDateString('pt-BR', { weekday: 'long' }),
      isToday: false,
      isThisWeek: true,
    },
    {
      id: '5',
      name: 'Treino de Força - Tríceps',
      date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 dias
      scheduledDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
      status: 'Pendente',
      coach: 'Carlos Ferreira',
      dayOfWeek: new Date(Date.now() + 259200000).toLocaleDateString('pt-BR', { weekday: 'long' }),
      isToday: false,
      isThisWeek: true,
    },
    {
      id: '6',
      name: 'Treino Cardio - Corrida',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ontem
      scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      status: 'Concluído',
      coach: 'João Silva',
      dayOfWeek: new Date(Date.now() - 86400000).toLocaleDateString('pt-BR', { weekday: 'long' }),
      isToday: false,
      isThisWeek: false,
    },
  ])

  useEffect(() => {
    const loadUserType = async () => {
      // PARTE 1: Carregar tipo de usuário
      const savedType = await AsyncStorage.getItem('userType');
      if (savedType) {
        setUserType(savedType as UserType);
      }
  
      // PARTE 2: Se for atleta, carregar o ID do atleta logado
      let athleteId = null;
      if (savedType === UserType.ATHLETE) {
        athleteId = await AsyncStorage.getItem('currentAthleteId');
        if (athleteId) {
          setCurrentAthleteId(athleteId);
        }
      }
  
      // PARTE 3: Carregar treinos atribuídos
      const assignedWorkoutsJson = await AsyncStorage.getItem('assigned_workouts');
      let assignedWorkouts = [];
  
      if (assignedWorkoutsJson) {
        assignedWorkouts = JSON.parse(assignedWorkoutsJson);
        
        // PARTE 4: Se for atleta, filtrar apenas os treinos dele
        if (savedType === UserType.ATHLETE && athleteId) {
          console.log('🔍 Filtrando treinos para atleta ID:', athleteId);
          console.log('📋 Treinos antes do filtro:', assignedWorkouts.length);
          console.log('📝 Todos os treinos (antes do filtro):', assignedWorkouts);
          assignedWorkouts = assignedWorkouts.filter(
            (workout: any) => {
              console.log(`Comparando: workout.athleteId (${workout.athleteId}) === athleteId (${athleteId})`);
              return workout.athleteId === athleteId;
            }
          );
          console.log('✅ Treinos após filtro:', assignedWorkouts.length);
          console.log('📝 Treinos filtrados:', assignedWorkouts);
        }
      }
  
      // PARTE 5: Combinar treinos mockados com atribuídos
      let allWorkouts = [];
      if (savedType === UserType.ATHLETE) {
        allWorkouts = assignedWorkouts;
        console.log('👤 ATLETA - Mostrando apenas treinos atribuídos:', allWorkouts.length);
      } else {
        allWorkouts = [...workouts, ...assignedWorkouts];
        console.log('👨‍🏫 TREINADOR - Mostrando treinos mockados + atribuídos:', allWorkouts.length);
      }
  
      // PARTE 6: Carregar status de todos os treinos
      const updatedWorkouts = await Promise.all(
        allWorkouts.map(async (workout: any) => {
          const savedStatus = await AsyncStorage.getItem(`workout_${workout.id}_status`);
          if (savedStatus) {
            return { ...workout, status: savedStatus };
          }
          return workout;
        })
      );
      setWorkouts(updatedWorkouts);
    };
    loadUserType();
  }, []);

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
      
      // Filtrar apenas registros deste atleta
      // Por enquanto, vamos mostrar todos os registros (quando tiver autenticação, filtrar por athleteId)
      const athleteHistory = allHistory; // TODO: Filtrar por athleteId quando tiver autenticação
      
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
    const activities = recentCompleted.map((w: any) => {
      const athleteId = w.athleteId || w.coach;
      const athlete = mockAthletes.find(a => a.id === athleteId);
      
      // Criar ID único: usar workout.id + completedAt timestamp para garantir unicidade
      let uniqueId = w.id;
      const completedTimestamp = w.completedDate 
        ? new Date(w.completedDate).getTime() 
        : new Date(w.date).getTime();
      
      // Se o ID já foi visto, adicionar timestamp para torná-lo único
      if (seenIds.has(uniqueId)) {
        uniqueId = `${w.id}_${completedTimestamp}`;
      }
      seenIds.add(uniqueId);
      
      return {
        id: uniqueId,
        athleteId: athleteId,
        athleteName: athlete?.name || 'Atleta',
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
    // Atletas que não completaram treinos nos últimos 5 dias
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoTime = fiveDaysAgo.getTime();
    
    // Pegar TODOS os atletas (não apenas os que têm treinos)
    // Para mostrar atletas que nunca treinaram também
    const allAthleteIds = new Set([
      ...workouts.map((w: any) => w.athleteId || w.coach),
      ...mockAthletes.map(a => a.id)
    ]);
    
    return Array.from(allAthleteIds)
      .map(id => {
        const athlete = mockAthletes.find(a => a.id === id);
        if (!athlete) return null;
        
        // Verificar último treino concluído
        const athleteWorkouts = workouts.filter((w: any) => 
          (w.athleteId || w.coach) === id && 
          w.status === 'Concluído'
        );
        
        // Usar completedDate se disponível, senão usar date
        const lastCompleted = athleteWorkouts.sort((a: any, b: any) => {
          const dateA = a.completedDate ? new Date(a.completedDate).getTime() : new Date(a.date).getTime();
          const dateB = b.completedDate ? new Date(b.completedDate).getTime() : new Date(b.date).getTime();
          return dateB - dateA;
        })[0];
        
        if (!lastCompleted) {
          // Atleta nunca completou um treino
          return {
            ...athlete,
            daysSinceLastWorkout: 999,
          };
        }
        
        // Calcular dias desde o último treino usando completedDate ou date
        const lastCompletedDate = (lastCompleted as any).completedDate 
          ? new Date((lastCompleted as any).completedDate).getTime()
          : new Date(lastCompleted.date).getTime();
        
        const daysSince = Math.floor((new Date().getTime() - lastCompletedDate) / (1000 * 60 * 60 * 24));
        
        // Retornar apenas se não treinou há mais de 5 dias
        if (daysSince > 5) {
          return {
            ...athlete,
            daysSinceLastWorkout: daysSince,
          };
        }
        
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.daysSinceLastWorkout - a.daysSinceLastWorkout);
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
    
    // Debug logs
    console.log('📊 getWeeklyStats - Atletas hoje:', athletesToday);
    console.log('📊 getWeeklyStats - Treinos concluídos hoje:', completedToday);
    console.log('📊 getWeeklyStats - Pendentes:', pendingWorkouts);
    console.log('📊 getWeeklyStats - Atletas precisando atenção:', getAthletesNeedingAttention().length);
    
    return {
      athletesToday,
      completedToday,
      pendingWorkouts,
    };
  };

  // ⚠️ CÓDIGO TEMPORÁRIO - REMOVER DEPOIS DE USAR
useEffect(() => {
  const clearAllStatuses = async () => {
    try {
      const workoutIds = ['1', '2', '3', '4', '5', '6'];
      for (const id of workoutIds) {
        await AsyncStorage.removeItem(`workout_${id}_status`);
      }
      // Resetar estado para valores iniciais
      setWorkouts([
        {
          id: '1',
          name: 'Treino de Força - Pernas',
          date: '2026-01-06',
          scheduledDate: '2026-01-06',
          status: 'Concluído',
          coach: 'João Silva',
          dayOfWeek: 'Segunda-feira',
          isToday: false,
          isThisWeek: false,
        },
        {
          id: '2',
          name: 'Treino de Força - Peito',
          date: new Date().toISOString().split('T')[0],
          scheduledDate: new Date().toISOString().split('T')[0],
          status: 'Pendente',
          coach: 'Maria Oliveira',
          dayOfWeek: new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
          isToday: true,
          isThisWeek: true,
        },
        {
          id: '3',
          name: 'Treino de Força - Costas',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          status: 'Pendente',
          coach: 'João Silva',
          dayOfWeek: new Date(Date.now() + 86400000).toLocaleDateString('pt-BR', { weekday: 'long' }),
          isToday: false,
          isThisWeek: true,
        },
        {
          id: '4',
          name: 'Treino de Força - Bíceps',
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          scheduledDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          status: 'Pendente',
          coach: 'Ana Souza',
          dayOfWeek: new Date(Date.now() + 172800000).toLocaleDateString('pt-BR', { weekday: 'long' }),
          isToday: false,
          isThisWeek: true,
        },
        {
          id: '5',
          name: 'Treino de Força - Tríceps',
          date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
          scheduledDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
          status: 'Pendente',
          coach: 'Carlos Ferreira',
          dayOfWeek: new Date(Date.now() + 259200000).toLocaleDateString('pt-BR', { weekday: 'long' }),
          isToday: false,
          isThisWeek: true,
        },
        {
          id: '6',
          name: 'Treino Cardio - Corrida',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          status: 'Concluído',
          coach: 'João Silva',
          dayOfWeek: new Date(Date.now() - 86400000).toLocaleDateString('pt-BR', { weekday: 'long' }),
          isToday: false,
          isThisWeek: false,
        },
      ]);
      console.log('✅ Dados resetados!');
    } catch (error) {
      console.error('Erro ao limpar:', error);
    }
  };
  
  // Descomente a linha abaixo para limpar os dados
  //clearAllStatuses();
}, []);

  useFocusEffect(
    useCallback(() => {
      const loadWorkoutStatuses = async () => {
        // PARTE 1: Carregar tipo de usuário e atleta atual
        const savedType = await AsyncStorage.getItem('userType');
        console.log('🔄 useFocusEffect - Tipo carregado:', savedType);
        
        // ✅ ADICIONAR: Atualizar o estado userType se mudou
        if (savedType) {
          setUserType(savedType as UserType);
        }
        
        let athleteId = null;
        
        if (savedType === UserType.ATHLETE) {
          athleteId = await AsyncStorage.getItem('currentAthleteId');
          console.log('👤 useFocusEffect - AthleteId carregado:', athleteId);
          if (athleteId) {
            setCurrentAthleteId(athleteId);
          }
        }

        // PARTE 2: Carregar treinos atribuídos
        const assignedWorkoutsJson = await AsyncStorage.getItem('assigned_workouts');
        let assignedWorkouts = [];
        
        console.log('📦 useFocusEffect - Treinos no AsyncStorage:', assignedWorkoutsJson ? 'Existem' : 'Não existem');

        if (assignedWorkoutsJson) {
          assignedWorkouts = JSON.parse(assignedWorkoutsJson);
          console.log('📋 useFocusEffect - Total de treinos carregados:', assignedWorkouts.length);
          console.log('📝 useFocusEffect - Todos os treinos:', assignedWorkouts);
          
          // PARTE 3: Se for atleta, filtrar apenas os treinos dele
          if (savedType === UserType.ATHLETE && athleteId) {
            console.log('🔍 useFocusEffect - Filtrando para atleta ID:', athleteId);
            assignedWorkouts = assignedWorkouts.filter(
              (workout: any) => {
                const match = workout.athleteId === athleteId;
                console.log(`Comparando: workout.athleteId (${workout.athleteId}) === athleteId (${athleteId}) = ${match}`);
                return match;
              }
            );
            console.log('✅ useFocusEffect - Treinos após filtro:', assignedWorkouts.length);
            console.log('📝 useFocusEffect - Treinos filtrados:', assignedWorkouts);
          }
        }

        // PARTE 4: Se for ATLETA, mostrar APENAS os treinos atribuídos
        // Se for TREINADOR, mostrar treinos mockados + atribuídos
        let allWorkouts = [];
        
        if (savedType === UserType.ATHLETE) {
          // Atleta vê apenas seus treinos atribuídos
          allWorkouts = assignedWorkouts;
          console.log('👤 useFocusEffect - ATLETA - Total de treinos:', allWorkouts.length);
        } else {
          // Treinador: carregar status dos treinos mockados primeiro
          const updatedWorkouts = await Promise.all(
            workouts.map(async (workout: any) => {
              const savedStatus = await AsyncStorage.getItem(`workout_${workout.id}_status`);
              if (savedStatus) {
                return { ...workout, status: savedStatus };
              }
              return workout;
            })
          );
          // Combinar treinos mockados com atribuídos
          // IMPORTANTE: assignedWorkouts já vêm com status e completedDate do AsyncStorage
          allWorkouts = [...updatedWorkouts, ...assignedWorkouts];
          console.log('👨‍🏫 useFocusEffect - TREINADOR - Total de treinos:', allWorkouts.length);
          console.log('👨‍🏫 useFocusEffect - TREINADOR - Treinos atribuídos:', assignedWorkouts.length);
          console.log('👨‍🏫 useFocusEffect - TREINADOR - Treinos concluídos:', allWorkouts.filter((w: any) => w.status === 'Concluído').length);
        }

        // PARTE 5: Carregar status dos treinos atribuídos (se houver)
        const finalWorkouts = await Promise.all(
          allWorkouts.map(async (workout: any) => {
            const savedStatus = await AsyncStorage.getItem(`workout_${workout.id}_status`);
            if (savedStatus) {
              // Se tem status salvo, usar ele
              return { ...workout, status: savedStatus };
            }
            // Se o treino já tem status e completedDate (treinos atribuídos), manter
            if (workout.status && workout.completedDate) {
              return workout;
            }
            return workout;
          })
        );
        
        console.log('💾 useFocusEffect - Salvando no estado:', finalWorkouts.length, 'treinos');
        console.log('📊 useFocusEffect - Treinos com status:', finalWorkouts.filter((w: any) => w.status === 'Concluído').length);
        setWorkouts(finalWorkouts);
      };
      loadWorkoutStatuses();
    }, [userType]) // ✅ Executa quando userType muda OU quando a tela recebe foco
  );

  const markWorkoutAsCompleted =(workoutId: string) => {
    setWorkouts(workouts.map((workout) => {
      if (workout.id === workoutId) {
        return {...workout, status: 'Concluído'};
      }
      return workout;
    }));
  };
  
  return (
    <ScrollView className="flex-1 bg-dark-950 px-6 pt-12">
    <View className="flex-1 bg-dark-950 px-2 pt-12 pb-20">
      {/* 
        TEMA ESCURO ESTILO ZEUS:
        - bg-dark-950 = Fundo preto quase absoluto (#0a0a0a)
        - text-white = Texto branco para contraste
        - primary-400/500 = Laranja vibrante como accent
      */}
      
      <Text className="text-4xl font-bold text-white mb-3 text-center">
        Coach<Text className="text-primary-400">'em</Text>
      </Text>
      {userType === UserType.COACH && (
        <Text className="text-neutral-400 text-center mb-6 px-4 text-base leading-6">
          Bem vindo Rodrigo ao seu app de gestão esportiva.
        </Text>
      )}

      {userType === UserType.COACH ? (
        //Dashboard do Treinador - Tema Escuro Estilo Zeus
        <View className="w-full mt-8">

          {/* Panorama Semanal - Cards de Estatísticas */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-white mb-4">
              Panorama Semanal
            </Text>
            <View className="flex-row gap-3">
              {/* Card: Ativos Hoje */}
              <View className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-4"
                style={{
                  shadowColor: '#fb923c',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center mb-2">
                  <FontAwesome name="users" size={20} color="#fb923c" />
                </View>
                <Text className="text-2xl font-bold text-white mb-1">
                  {getWeeklyStats().athletesToday}
                </Text>
                <Text className="text-neutral-400 text-xs">
                  Ativos Hoje
                </Text>
              </View>

              {/* Card: Treinos Concluídos */}
              <View className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-4"
                style={{
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center mb-2">
                  <FontAwesome name="check-circle" size={20} color="#10b981" />
                </View>
                <Text className="text-2xl font-bold text-white mb-1">
                  {getWeeklyStats().completedToday}
                </Text>
                <Text className="text-neutral-400 text-xs">
                  Treinos Concluídos
                </Text>
              </View>

              {/* Card: Pendentes */}
              <View className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-4"
                style={{
                  shadowColor: '#f59e0b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center mb-2">
                  <FontAwesome name="clock-o" size={20} color="#f59e0b" />
                </View>
                <Text className="text-2xl font-bold text-white mb-1">
                  {getWeeklyStats().pendingWorkouts}
                </Text>
                <Text className="text-neutral-400 text-xs">
                  Pendentes
                </Text>
              </View>
            </View>
          </View>

          {/* Botões principais - Design Escuro Estilo Zeus */}
          <View className="flex-row gap-5 mb-8">
            {/* Botão Biblioteca de Exercícios */}
            <TouchableOpacity 
              className="bg-primary-500 border-2 border-primary-400 rounded-3xl flex-1 items-center justify-center overflow-hidden py-6"
              style={{ 
                shadowColor: '#fb923c',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 16,
              }}
              onPress={() => router.push('/exercises-library')}
              activeOpacity={0.8}
            >
              <View className="mb-4">
                <FontAwesome name="book" size={40} color="#0a0a0a" />
              </View>
              <Text className="text-black font-bold text-center text-base tracking-tight">
                Biblioteca de Exercícios
              </Text>
            </TouchableOpacity>

            {/* Botão Meus Treinos */}
            <TouchableOpacity 
              className="bg-primary-500 border-2 border-primary-400 rounded-3xl flex-1 items-center justify-center overflow-hidden py-6"
              style={{ 
                shadowColor: '#fb923c',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 16,
              }}
              onPress={() => router.push('/workouts-library')}
              activeOpacity={0.8}
            >
              <View className="mb-4">
                <FontAwesome name="trophy" size={40} color="#0a0a0a" />
              </View>
              <Text className="text-black font-bold text-center text-base tracking-tight">
                Meus Treinos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Atividade Recente - Atletas que completaram treinos hoje */}
          {getAthletesWhoTrainedToday().length > 0 && (
            <View className="mb-8">
              <Text className="text-xl font-bold text-white mb-4">
                Atividade Recente
              </Text>
              {getAthletesWhoTrainedToday()
                .slice(0, 3)
                .map((activity: any) => (
                <TouchableOpacity
                  key={activity.id}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-3 flex-row items-center"
                  style={{
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
                  <View className="w-12 h-12 rounded-full bg-primary-500/20 border border-primary-500/30 items-center justify-center mr-3">
                    <Text className="text-primary-400 font-bold text-lg">
                      {activity.athleteName.charAt(0)}
                    </Text>
                  </View>
                  
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-white font-semibold flex-1">
                        {activity.athleteName} finalizou o '{activity.workoutName}'
                      </Text>
                      {activity.feedbackEmoji && (
                        <Text className="text-2xl ml-2">
                          {activity.feedbackEmoji}
                        </Text>
                      )}
                    </View>
                    <Text className="text-neutral-400 text-xs">
                      {getTimeAgo(activity.completedAt)}
                    </Text>
                  </View>
                  
                  <View className="bg-green-500/20 border border-green-500/30 px-3 py-1 rounded">
                    <Text className="text-green-400 font-semibold text-xs">
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
              <Text className="text-xl font-bold text-white mb-4">
                Atenção Necessária
              </Text>
              {getAthletesNeedingAttention().slice(0, 3).map((athlete: any) => (
                <TouchableOpacity
                  key={athlete.id}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-3 flex-row items-center"
                  style={{
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
                  <View className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 items-center justify-center mr-3">
                    <Text className="text-red-400 font-bold text-lg">
                      {athlete.name.charAt(0)}
                    </Text>
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-white font-semibold mb-1">
                      {athlete.name}
                    </Text>
                    <Text className="text-neutral-400 text-sm">
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
        <View className="w-full mt-8">
          {/* Saudação Personalizada */}
          {currentAthleteId && (
            <View className="mb-6">
              <Text className="text-2xl font-bold text-white mb-2">
                Olá, {mockAthletes.find(a => a.id === currentAthleteId)?.name || 'Atleta'}!
              </Text>
              <Text className="text-neutral-400 text-base">
                Acompanhe seus treinos e seu progresso
              </Text>
            </View>
          )}

          {/* Cards de Estatísticas */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-white mb-4">
              Seu Progresso
            </Text>
            <View className="flex-row gap-3">
              {/* Card: Treinos Esta Semana */}
              <View className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-4"
                style={{
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
                <Text className="text-2xl font-bold text-white mb-1">
                  {getAthleteStats().thisWeekPending + getAthleteStats().thisWeekCompleted}
                </Text>
                <Text className="text-neutral-400 text-xs">
                  Esta Semana
                </Text>
              </View>

              {/* Card: Concluídos */}
              <View className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-4"
                style={{
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
                <Text className="text-2xl font-bold text-white mb-1">
                  {getAthleteStats().totalCompleted}
                </Text>
                <Text className="text-neutral-400 text-xs">
                  Concluídos
                </Text>
              </View>

              {/* Card: Sequência */}
              <View className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-4"
                style={{
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
                <Text className="text-2xl font-bold text-white mb-1">
                  {getAthleteStats().streak}
                </Text>
                <Text className="text-neutral-400 text-xs">
                  Sequência
                </Text>
                <Text className="text-neutral-500 text-[10px] mt-1">
                  Dias consecutivos
                </Text>
              </View>
            </View>
          </View>

          {/* Gráfico de Frequência de Treinos */}
          {getCompletedWorkouts().length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold text-white mb-4">
                📊 Frequência de Treinos
              </Text>
              
              {getWeeklyFrequency().length > 0 ? (
                <>
                  <View className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-4">
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
                      xAxisColor="#404040"
                      yAxisThickness={1}
                      yAxisColor="#404040"
                      yAxisTextStyle={{ color: '#a3a3a3', fontSize: 10 }}
                      xAxisLabelTextStyle={{ color: '#a3a3a3', fontSize: 9 }}
                      noOfSections={4}
                      maxValue={Math.max(...getWeeklyFrequency().map(w => w.count)) + 2}
                      isAnimated
                      animationDuration={800}
                      showGradient
                      gradientColor="#ff8c42"
                    />
                  </View>

                  {/* Estatísticas */}
                  <View className="bg-dark-900 border border-dark-700 rounded-xl p-4">
                    <View className="flex-row justify-between items-center mb-3">
                      <View className="flex-1">
                        <Text className="text-neutral-400 text-xs mb-1">Média Semanal</Text>
                        <Text className="text-white font-bold text-xl">
                          {getAveragePerWeek()} treinos
                        </Text>
                      </View>
                      
                      {getWeekComparison() && (
                        <View className="flex-1 items-end">
                          <Text className="text-neutral-400 text-xs mb-1">Esta Semana</Text>
                          <View className="flex-row items-center gap-2">
                            <Text className="text-white font-bold text-xl">
                              {getWeekComparison()?.current}
                            </Text>
                            <Text className={`text-sm font-semibold ${
                              (getWeekComparison()?.difference || 0) > 0
                                ? 'text-green-400'
                                : (getWeekComparison()?.difference || 0) < 0
                                ? 'text-red-400'
                                : 'text-neutral-400'
                            }`}>
                              {(getWeekComparison()?.difference || 0) > 0 ? '+' : ''}
                              {getWeekComparison()?.difference} 
                              {getWeekComparison()?.difference !== 0 && (
                                <Text className="text-xs">
                                  {' '}({getWeekComparison()?.percentage}%)
                                </Text>
                              )}
                            </Text>
                          </View>
                          <Text className="text-neutral-500 text-[10px] mt-1">
                            vs semana anterior
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Sequência destacada */}
                    <View className="mt-3 pt-3 border-t border-dark-700">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <FontAwesome name="fire" size={16} color="#f59e0b" />
                          <Text className="text-neutral-400 text-sm">Sequência Atual</Text>
                        </View>
                        <Text className="text-white font-bold text-lg">
                          {getAthleteStats().streak} dias consecutivos
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <View className="bg-dark-900 border border-dark-700 rounded-xl p-8 items-center">
                  <Text className="text-neutral-400 text-center">
                    Complete treinos para ver sua frequência semanal aqui.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Gráfico de Evolução de Peso/Carga */}
          {availableExercises.length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold text-white mb-4">
                📈 Evolução de Peso/Carga
              </Text>
              
              {/* Seletor de Exercício */}
              <View className="mb-4">
                <Text className="text-neutral-400 text-sm mb-2">Selecione o exercício:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    {availableExercises.map((exercise) => (
                      <TouchableOpacity
                        key={exercise.id}
                        onPress={() => setSelectedExercise(exercise.id)}
                        className={`px-4 py-2 rounded-lg border ${
                          selectedExercise === exercise.id
                            ? 'bg-primary-500/20 border-primary-500'
                            : 'bg-dark-800 border-dark-700'
                        }`}
                      >
                        <Text className={`font-semibold ${
                          selectedExercise === exercise.id
                            ? 'text-primary-400'
                            : 'text-neutral-400'
                        }`}>
                          {exercise.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* Gráfico */}
              {weightHistory.length > 0 ? (
                <View className="bg-dark-900 border border-dark-700 rounded-xl p-4">
                  <Text className="text-white font-semibold mb-2 text-center">
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
                    yAxisColor="#404040"
                    xAxisColor="#404040"
                    yAxisTextStyle={{ color: '#a3a3a3', fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: '#a3a3a3', fontSize: 9 }}
                    hideDataPoints={false}
                    dataPointsColor="#fb923c"
                    dataPointsRadius={6}
                    dataPointsWidth={6}
                    dataPointsHeight={6}
                    textShiftY={-2}
                    textShiftX={-5}
                    textFontSize={10}
                    hideRules={false}
                    rulesColor="#262626"
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
                    <View className="mt-4 pt-4 border-t border-dark-700">
                      <View className="flex-row justify-between">
                        <View>
                          <Text className="text-neutral-400 text-xs">Primeiro registro</Text>
                          <Text className="text-white font-semibold">
                            {weightHistory[0]?.weight} kg
                          </Text>
                        </View>
                        <View>
                          <Text className="text-neutral-400 text-xs">Último registro</Text>
                          <Text className="text-white font-semibold">
                            {weightHistory[weightHistory.length - 1]?.weight} kg
                          </Text>
                        </View>
                        <View>
                          <Text className="text-neutral-400 text-xs">Evolução</Text>
                          <Text className={`font-semibold ${
                            weightHistory[weightHistory.length - 1]?.weight > weightHistory[0]?.weight
                              ? 'text-green-400'
                              : weightHistory[weightHistory.length - 1]?.weight < weightHistory[0]?.weight
                              ? 'text-red-400'
                              : 'text-neutral-400'
                          }`}>
                            {weightHistory[weightHistory.length - 1]?.weight > weightHistory[0]?.weight ? '+' : ''}
                            {(weightHistory[weightHistory.length - 1]?.weight - weightHistory[0]?.weight).toFixed(1)} kg
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View className="bg-dark-900 border border-dark-700 rounded-xl p-8 items-center">
                  <Text className="text-neutral-400 text-center">
                    Nenhum registro de peso encontrado para este exercício.
                  </Text>
                  <Text className="text-neutral-500 text-sm text-center mt-2">
                    Registre o peso usado durante os treinos para ver a evolução aqui.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Treino de Hoje - Destaque */}
          {getTodayWorkouts().length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold text-white mb-4">
                🎯 Treino de Hoje
              </Text>
              
              {getTodayWorkouts().map((workout) => (
                <TouchableOpacity 
                  key={workout.id}
                  className="bg-primary-500/10 border-2 border-primary-500/30 rounded-xl p-5 mb-3"
                  style={{
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
                      <Text className="text-xl font-bold text-white mb-2">
                        {workout.name}
                      </Text>
                      <Text className="text-neutral-300 text-sm mb-1">
                        Treinador: {workout.coach}
                      </Text>
                      <Text className="text-neutral-400 text-sm">
                        {workout.dayOfWeek}
                      </Text>
                    </View>
                    <View className="bg-primary-500/30 border border-primary-400 px-4 py-2 rounded-full">
                      <Text className="text-sm font-bold text-primary-200">
                        {workout.status}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-primary-500 rounded-lg py-3 px-6 mt-2"
                    onPress={() => {
                      router.push({
                        pathname: '/workout-details',
                        params: {workoutId: workout.id}
                      });
                    }}
                  >
                    <Text className="text-black font-bold text-center text-base">
                      ▶ Iniciar Treino
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Próximos Treinos */}
          {getUpcomingWorkouts().length > 0 && (
            <View className="w-full mb-6">
              <Text className="text-xl font-bold text-white mb-4">
                📅 Próximos Treinos
              </Text>
              
              {getUpcomingWorkouts().map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-3"
                  style={{
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
                      <Text className="text-lg font-semibold text-white mb-1">
                        {workout.name}
                      </Text>
                      <Text className="text-neutral-400 text-sm mb-1">
                        Treinador: {workout.coach}
                      </Text>
                      <Text className="text-neutral-400 text-sm">
                        {workout.dayOfWeek} • {new Date(workout.date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <View className="bg-primary-500/20 border border-primary-500/30 px-3 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-primary-400">
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
              <Text className="text-xl font-bold text-white mb-4">
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
                  className="bg-dark-800 border border-green-500/20 rounded-xl p-4 mb-3"
                  style={{
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
                      <Text className="text-lg font-semibold text-white mb-1">
                        {workout.name}
                      </Text>
                      <Text className="text-neutral-400 text-sm mb-1">
                        Treinador: {workout.coach}
                      </Text>
                      <Text className="text-neutral-500 text-xs">
                        {workout.dayOfWeek} • {new Date(workout.date).toLocaleDateString('pt-BR')}
                        {workout.completedDate && (
                          <Text> • Concluído em {new Date(workout.completedDate).toLocaleDateString('pt-BR')}</Text>
                        )}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View className="bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full mb-2">
                        <Text className="text-xs font-semibold text-green-400">
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
            <View className="bg-dark-900 border border-dark-700 rounded-xl p-8 items-center">
              <FontAwesome name="calendar-times-o" size={48} color="#737373" />
              <Text className="text-white text-lg font-semibold mt-4 mb-2">
                Nenhum treino atribuído
              </Text>
              <Text className="text-neutral-400 text-center">
                Seu treinador ainda não atribuiu treinos para você.
              </Text>
            </View>
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
