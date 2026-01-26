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
  }, []); // Mantém vazio, mas vamos usar useFocusEffect também

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
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = workouts.filter((w: any) => {
      if (w.status !== 'Concluído') return false;
      const completedDate = w.completedDate ? new Date(w.completedDate).toISOString().split('T')[0] : w.date;
      return completedDate === today;
    });
    
    // Extrair atletas únicos que completaram treinos hoje
    const athleteMap = new Map();
    
    todayCompleted.forEach((w: any) => {
      const athleteId = w.athleteId || w.coach; // Fallback para mockados
      if (!athleteMap.has(athleteId)) {
        const athlete = mockAthletes.find(a => a.id === athleteId);
        if (athlete) {
          athleteMap.set(athleteId, {
            ...athlete,
            completedWorkouts: [],
            lastWorkoutName: '',
            completedAt: w.completedDate || new Date().toISOString(),
          });
        }
      }
      const athleteData = athleteMap.get(athleteId);
      if (athleteData) {
        athleteData.completedWorkouts.push(w);
        athleteData.lastWorkoutName = w.name;
        // Manter o timestamp mais recente
        const workoutTime = w.completedDate || new Date().toISOString();
        if (new Date(workoutTime) > new Date(athleteData.completedAt)) {
          athleteData.completedAt = workoutTime;
        }
      }
    });
    
    // Ordenar por timestamp mais recente primeiro
    return Array.from(athleteMap.values()).sort((a: any, b: any) => 
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
      <Text className="text-neutral-400 text-center mb-6 px-4 text-base leading-6">
        Bem vindo Rodrigo ao seu app de gestão esportiva.
      </Text>

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
              {getAthletesWhoTrainedToday().slice(0, 5).map((athlete: any) => (
                <TouchableOpacity
                  key={athlete.id}
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
                      params: { athleteId: athlete.id },
                    });
                  }}
                >
                  {/* Avatar placeholder */}
                  <View className="w-12 h-12 rounded-full bg-primary-500/20 border border-primary-500/30 items-center justify-center mr-3">
                    <Text className="text-primary-400 font-bold text-lg">
                      {athlete.name.charAt(0)}
                    </Text>
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-white font-semibold mb-1">
                      {athlete.name} finalizou o '{athlete.lastWorkoutName}'
                    </Text>
                    <Text className="text-neutral-400 text-xs">
                      {getTimeAgo(athlete.completedAt)}
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
        //Dashboard do Atleta - Tema Escuro Estilo Zeus
        <View className="w-full mt-8">
          <Text className="text-2xl font-bold text-white mb-6">
            Dashboard do Atleta
          </Text>
          {currentAthleteId && (
            <Text className="text-lg font-semibold text-primary-400 mb-2">
              Olá, {mockAthletes.find(a => a.id === currentAthleteId)?.name || 'Atleta'}!
            </Text>
          )}
          <Text className="text-neutral-400 mb-6">
            Veja seus treinos atribuidos e acompanhe seu progresso.
          </Text>

          {getTodayWorkouts().length > 0 && (
            <View className="w-full mt-6 mb-8">
              <View className="flex-row items-center mb-4">
                <Text className="text-xl font-bold text-white">
                🎯 Treino de Hoje ({getTodayWorkouts().length})
                </Text>
              </View>

              {getTodayWorkouts().map((workout) => (
                <TouchableOpacity 
                  key={workout.id}
                  className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-3"
                  style={{
                    shadowColor: '#fb923c',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                  onPress={() => {
                    router.push({
                      pathname: '/workout-details',
                      params: {workoutId: workout.id}
                    });
                  }}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-white mb-1">
                        {workout.name}
                      </Text>
                      <Text className="text-neutral-400 text-sm mb-1">
                        Treinador: {workout.coach}
                      </Text>
                      <Text className="text-neutral-400 text-sm">
                        {workout.dayOfWeek}
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

          {/* Seção: Esta Semana */}
        {getThisWeekWorkouts().length > 0 && (
          <View className="w-full mt-6 mb-8">
            <Text className="text-xl font-bold text-white mb-4">
              📅 Esta Semana ({getThisWeekWorkouts().length})
            </Text>
            
            {getThisWeekWorkouts().map((workout) => (
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
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white mb-1">
                      {workout.name}
                    </Text>
                    <Text className="text-neutral-400 text-sm mb-1">
                      Treinador: {workout.coach}
                    </Text>
                    <Text className="text-neutral-400 text-sm">
                      {workout.dayOfWeek} - {workout.date}
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

        {/* Seção: Concluídos */}
        {getCompletedWorkouts().length > 0 && (
          <View className="w-full mt-6">
            <Text className="text-xl font-bold text-white mb-4">
              ✅ Concluídos ({getCompletedWorkouts().length})
            </Text>
            
            {getCompletedWorkouts().map((workout) => (
              <TouchableOpacity
                key={workout.id}
                className="bg-dark-800 border border-dark-600 rounded-xl p-4 mb-3"
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
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white mb-1">
                      {workout.name}
                    </Text>
                    <Text className="text-neutral-400 text-sm mb-1">
                      Treinador: {workout.coach}
                    </Text>
                    <Text className="text-neutral-400 text-sm">
                      {workout.dayOfWeek} - {workout.date}
                    </Text>
                  </View>
                  <View className="bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-green-400">
                      {workout.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
