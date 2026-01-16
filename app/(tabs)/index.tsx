/**
 * TELA INICIAL - Versão Simplificada para Aprendizado
 * 
 * Esta é a tela mais simples possível para você entender os conceitos básicos.
 * Vamos explicar TUDO linha por linha!
 */

import { UserType } from '@/src/types';
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
          allWorkouts = [...updatedWorkouts, ...assignedWorkouts];
          console.log('👨‍🏫 useFocusEffect - TREINADOR - Total de treinos:', allWorkouts.length);
        }

        // PARTE 5: Carregar status dos treinos atribuídos (se houver)
        const finalWorkouts = await Promise.all(
          allWorkouts.map(async (workout: any) => {
            const savedStatus = await AsyncStorage.getItem(`workout_${workout.id}_status`);
            if (savedStatus) {
              return { ...workout, status: savedStatus };
            }
            return workout;
          })
        );
        
        console.log('💾 useFocusEffect - Salvando no estado:', finalWorkouts.length, 'treinos');
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
    <ScrollView className="flex-1 bg-white px-6 pt-12">
    <View className="flex-1 bg-white px-2 pt-12 pb-20">
      {/* 
        EXPLICAÇÃO DAS CLASSES (NativeWind/Tailwind):
        - flex-1 = Ocupa todo o espaço disponível
        - items-center = Centraliza os itens horizontalmente
        - justify-center = Centraliza os itens verticalmente
        - bg-white = Fundo branco
      */}
      
      <Text className="text-4xl font-bold text-neutral-900 mb-4">
        Coach'em
      </Text>
      {/* 
        EXPLICAÇÃO DAS CLASSES:
        - text-4xl = Tamanho de texto grande
        - font-bold = Texto em negrito
        - text-neutral-900 = Cor do texto (cinza escuro)
        - mb-4 = Margem inferior (espaço abaixo)
      */}

      <Text className="text-neutral-600 text-center mb-8 px-4">
        Bem-vindo ao seu app de gestão esportiva!
      </Text>

      {userType && (
        <Text className="text-xl font-semibold text-primary-600 mb-4">
          Você está logado como: {userType === UserType.COACH ? 'Treinador' : 'Atleta'}

        </Text>
      )}

      {userType === UserType.COACH ? (
        //Dashboard do Treinador
        <View className="w-full mt-8">
          <Text className="text-2xl font-bold text-neutral-900 mb-6">
            Dashboard do Treinador
          </Text>
          <Text className="text-neutral-600 mb-6">
            Gerencie seus atletas e crie treinos personalizados.
          </Text>

          <View className="flex-col gap-4 mb-6">
            <TouchableOpacity className="bg-primary-600 rounded-lg py-4 px-6"
             onPress={() => router.push('/exercises-library')}
             >
              <Text className="text-white font-semibold text-center text-lg">
               Biblioteca de Exercícios
              </Text>
            </TouchableOpacity>



            <TouchableOpacity className="bg-primary-600 rounded-lg py-4 px-6"
             onPress={() => router.push('/workouts-library')}
             >
              <Text className="text-white font-semibold text-center text-lg">
               Meus Treinos
              </Text>
             </TouchableOpacity>
          </View>

          <View className="w-full mt-6">
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              Meus Atletas ({mockAthletes.length})
            </Text>

            {mockAthletes.map((athlete) => (
              <TouchableOpacity
                key={athlete.id}
                className="bg-neutral-50 rounded-lg p-4 mb-3 border border-neutral-200"
                onPress={() => {
                  router.push({
                    pathname: '/assign-workout',
                    params: { athleteId: athlete.id },
                  });
                }}
              >
                <Text className="text-lg font-semibold text-neutral-900">
                  {athlete.name}
                </Text>
                <Text className="text-neutral-600 mt-1">
                  {athlete.sport} • {athlete.status}
                </Text>
              </TouchableOpacity>
            ))}

          </View>

        </View>
      ) : userType === UserType.ATHLETE ? (
        //Dashboard do Atleta
        <View className="w-full mt-8">
          <Text className="text-2xl font-bold text-neutral-900 mb-6">
            Dashboard do Atleta
          </Text>
          {currentAthleteId && (
            <Text className="text-lg font-semibold text-primary-600 mb-2">
              Olá, {mockAthletes.find(a => a.id === currentAthleteId)?.name || 'Atleta'}!
            </Text>
          )}
          <Text className="text-neutral-600 mb-6">
            Veja seus treinos atribuidos e acompanhe seu progresso.
          </Text>

          {getTodayWorkouts().length > 0 && (
            <View className="w-full mt-6 mb-8">
              <View className="flex-row items-center mb-4">
                <Text className="text-xl font-bold text-neutral-900">
                🎯Treino de Hoje ({getTodayWorkouts().length})
                </Text>
              </View>

              {getTodayWorkouts().map((workout) => (
                <TouchableOpacity 
                  key={workout.id}
                  className="bg-primary-50 border-2 border-primary-600 rounded-lg p-4 mb-3"
                  onPress={() => {
                    router.push({
                      pathname: '/workout-details',
                      params: {workoutId: workout.id}
                    });
                  }}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-neutral-900 mb-1">
                        {workout.name}
                      </Text>
                      <Text className="text-neutral-600 text-sm mb-1">
                        Treinador: {workout.coach}
                      </Text>
                      <Text className="text-neutral-600 text-sm">
                        {workout.dayOfWeek}
                      </Text>
                    </View>
                    <View className="bg-yellow-100 px-3 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-yellow-700">
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
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              📅 Esta Semana ({getThisWeekWorkouts().length})
            </Text>
            
            {getThisWeekWorkouts().map((workout) => (
              <TouchableOpacity
                key={workout.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3"
                onPress={() => {
                  router.push({
                    pathname: '/workout-details',
                    params: { workoutId: workout.id }
                  });
                }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-neutral-900 mb-1">
                      {workout.name}
                    </Text>
                    <Text className="text-neutral-600 text-sm mb-1">
                      Treinador: {workout.coach}
                    </Text>
                    <Text className="text-neutral-600 text-sm">
                      {workout.dayOfWeek} - {workout.date}
                    </Text>
                  </View>
                  <View className="bg-yellow-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-yellow-700">
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
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              ✅ Concluídos ({getCompletedWorkouts().length})
            </Text>
            
            {getCompletedWorkouts().map((workout) => (
              <TouchableOpacity
                key={workout.id}
                className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3"
                onPress={() => {
                  router.push({
                    pathname: '/workout-details',
                    params: { workoutId: workout.id }
                  });
                }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-neutral-900 mb-1">
                      {workout.name}
                    </Text>
                    <Text className="text-neutral-600 text-sm mb-1">
                      Treinador: {workout.coach}
                    </Text>
                    <Text className="text-neutral-600 text-sm">
                      {workout.dayOfWeek} - {workout.date}
                    </Text>
                  </View>
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-green-700">
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
