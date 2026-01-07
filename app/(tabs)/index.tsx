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
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';




/**
 * O QUE É ISSO?
 * 
 * Esta é uma FUNÇÃO que retorna uma TELA (componente).
 * No React Native, cada tela é uma função que retorna elementos visuais.
 */
export default function HomeScreen() {

  const router = useRouter();
  const [userType, setUserType] = useState<UserType | null>(null);

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
      status: 'Concluído',
      coach: 'João Silva',
    },
    {
      id: '2',
      name: 'Treino de Força - Peito',
      date: '2026-01-07',
      status: 'Pendente',
      coach: 'Maria Oliveira',
    },
    {
      id: '3',
      name: 'Treino de Força - Costas',
      date: '2026-01-08',
      status: 'Pendente',
      coach: 'João Silva',
    },
    {
      id: '4',
      name: 'Treino de Força - Bíceps',
      date: '2026-01-09',
      status: 'Pendente',
      coach: 'Ana Souza',
    },
    {
      id: '5',
      name: 'Treino de Força - Tríceps',
      date: '2026-01-10',
      status: 'Pendente',
      coach: 'Carlos Ferreira',
    },
  ])

  useEffect(() => {
    const loadUserType = async () => {
      const savedType = await AsyncStorage.getItem('userType');
      if (savedType) {
        setUserType(savedType as UserType);
      }

      const updatedWorkouts = await Promise.all(
        workouts.map(async (workout) => {
          const savedStatus = await AsyncStorage.getItem(`workout_${workout.id}_status`);
          if(savedStatus) {
            return {...workout,status: savedStatus };
          }
          return workout;
        })
      )
    };
    loadUserType();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadWorkoutStatuses = async () => {
        const updatedWorkouts = await Promise.all(
          workouts.map(async (workout) => {
            const savedStatus = await AsyncStorage.getItem(`workout_${workout.id}_status`);
            if (savedStatus) {
              return { ...workout, status: savedStatus };
            }
            return workout;
          })
        );
        setWorkouts(updatedWorkouts);
      };
      loadWorkoutStatuses();
    }, [workouts.length]
  ));

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
             onPress={() => Alert.alert('Biblioteca de Exercícios', 'Em breve você poredá gerenciar seus exercícios aqui!')}
             >
              <Text className="text-white font-semibold text-center text-lg">
               Biblioteca de Exercícios
              </Text>
            </TouchableOpacity>



            <TouchableOpacity className="bg-primary-600 rounded-lg py-4 px-6"
             onPress={() => Alert.alert('Criar Treino', 'Em breve você poderá criar seus treinos aqui!')}
             >
              <Text className="text-white font-semibold text-center text-lg">
               Criar Treino

              </Text>
             </TouchableOpacity>
          </View>

          <View className="w-full mt-6">
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              Meus Atletas ({mockAthletes.length})
            </Text>

            {mockAthletes.map((athlete) => (
              <View key={athlete.id} className="bg-neutral-50 rounded-lg p-4 mb-3 border border-neutral-200">
                <Text className="text-lg font-semibold text-neutral-900">
                  {athlete.name}
                </Text>
                <Text className="text-neutral-600 mt-1">
                  {athlete.sport}* {athlete.status}
                </Text>
              </View>
            ))}

          </View>

        </View>
      ) : userType === UserType.ATHLETE ? (
        //Dashboard do Atleta
        <View className="w-full mt-8">
          <Text className="text-2xl font-bold text-neutral-900 mb-6">
            Dashboard do Atleta
          </Text>
          <Text className="text-neutral-600 mb-6">
            Veja seus treinos atribuidos e acompanhe seu progresso.
          </Text>

          <View className="w-full mt-6">
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              Meus treinos ({workouts.length})
            </Text>

            {workouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                className={`rounded-lg p-4 mb-3 border ${ workout.status === 'Concluído' 
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'}`}
                  onPress={() => {
                    router.push({
                      pathname: '/workout-details',
                      params: { workoutId: workout.id }
                    });
                  }}
                  
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-lg font-semibold text-neutral-900 flex-1">
                    {workout.name}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${
                    workout.status === 'Concluído' 
                    ? 'bg-green-100'
                    : 'bg-yellow-100'
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      workout.status === 'Concluído' 
                      ? 'text-green-700'
                      :'text-yellow-700'
                    }`}>
                      {workout.status}
                    </Text>
                  </View>
                </View>

                <Text className="text-neutral-600 text-sm">
                  Treinador: {workout.coach}
                </Text>
                <Text className="text-neutral-600 text-sm">
                  Data: {workout.date}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
