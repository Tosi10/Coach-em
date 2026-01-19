/**
 * TELA DE DETALHES DO TREINO
 * 
 * Esta tela mostra os detalhes completos de um treino específico,
 * incluindo lista de exercícios e permite marcar como concluído.
 */

import { WorkoutBlockData } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, } from 'react-native';


// Função para buscar os treinos templates (mesma estrutura de workouts-library.tsx)
const getMockWorkoutTemplates = () => {
  // Exercícios mockados (simplificados)
  const mockExercises: any[] = [
    { id: 'ex1', name: 'Agachamento', description: 'Agachamento livre' },
    { id: 'ex2', name: 'Leg Press', description: 'Leg press 45°' },
    { id: 'ex3', name: 'Extensão de Pernas', description: 'Extensão no aparelho' },
    { id: 'ex4', name: 'Caminhada Leve', description: '5 minutos de caminhada' },
    { id: 'ex5', name: 'Alongamento de Pernas', description: 'Alongamento estático' },
    { id: 'ex6', name: 'Supino Reto', description: 'Supino com barra' },
    { id: 'ex7', name: 'Supino Inclinado', description: 'Supino inclinado 45°' },
    { id: 'ex8', name: 'Crucifixo', description: 'Crucifixo com halteres' },
    { id: 'ex9', name: 'Corrida Leve', description: '5 minutos de corrida' },
    { id: 'ex10', name: 'Alongamento de Peito', description: 'Alongamento estático' },
  ];

  return [
    {
      id: '1',
      name: 'Treino de Força - Pernas',
      description: 'Treino completo para desenvolvimento de força nas pernas',
      blocks: [
        {
          blockType: 'WARM_UP',
          exercises: [
            {
              exerciseId: 'ex4',
              exercise: mockExercises.find(e => e.id === 'ex4'),
              sets: undefined,
              reps: undefined,
              duration: 300,
              restTime: undefined,
              order: 1,
              notes: 'Caminhada leve para aquecer',
            },
          ],
        },
        {
          blockType: 'WORK',
          exercises: [
            {
              exerciseId: 'ex1',
              exercise: mockExercises.find(e => e.id === 'ex1'),
              sets: 4,
              reps: 12,
              duration: undefined,
              restTime: 60,
              order: 1,
            },
            {
              exerciseId: 'ex2',
              exercise: mockExercises.find(e => e.id === 'ex2'),
              sets: 3,
              reps: 15,
              duration: undefined,
              restTime: 45,
              order: 2,
            },
            {
              exerciseId: 'ex3',
              exercise: mockExercises.find(e => e.id === 'ex3'),
              sets: 3,
              reps: 12,
              duration: undefined,
              restTime: 45,
              order: 3,
            },
          ],
        },
        {
          blockType: 'COOL_DOWN',
          exercises: [
            {
              exerciseId: 'ex5',
              exercise: mockExercises.find(e => e.id === 'ex5'),
              sets: undefined,
              reps: undefined,
              duration: 180,
              restTime: undefined,
              order: 1,
              notes: 'Alongamento estático de 3 minutos',
            },
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'Treino de Força - Peito',
      description: 'Treino completo para desenvolvimento de força no peito',
      blocks: [
        {
          blockType: 'WARM_UP',
          exercises: [
            {
              exerciseId: 'ex9',
              exercise: mockExercises.find(e => e.id === 'ex9'),
              sets: undefined,
              reps: undefined,
              duration: 300,
              restTime: undefined,
              order: 1,
              notes: 'Corrida leve para aquecer',
            },
          ],
        },
        {
          blockType: 'WORK',
          exercises: [
            {
              exerciseId: 'ex6',
              exercise: mockExercises.find(e => e.id === 'ex6'),
              sets: 4,
              reps: 10,
              duration: undefined,
              restTime: 90,
              order: 1,
            },
            {
              exerciseId: 'ex7',
              exercise: mockExercises.find(e => e.id === 'ex7'),
              sets: 3,
              reps: 12,
              duration: undefined,
              restTime: 60,
              order: 2,
            },
            {
              exerciseId: 'ex8',
              exercise: mockExercises.find(e => e.id === 'ex8'),
              sets: 3,
              reps: 15,
              duration: undefined,
              restTime: 45,
              order: 3,
            },
          ],
        },
        {
          blockType: 'COOL_DOWN',
          exercises: [
            {
              exerciseId: 'ex10',
              exercise: mockExercises.find(e => e.id === 'ex10'),
              sets: undefined,
              reps: undefined,
              duration: 180,
              restTime: undefined,
              order: 1,
              notes: 'Alongamento estático de 3 minutos',
            },
          ],
        },
      ],
    },
  ];
};



export default function WorkoutDetailsScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  
  // Buscar o treino correspondente
  const [assignedWorkout, setAssignedWorkout] = useState<any>(null);
  const [workoutTemplate, setWorkoutTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadWorkoutData = async () => {
      try {
        setLoading(true);

        const assignedWorkoutsJson = await AsyncStorage.getItem('assigned_workouts');
        const assignedWorkouts = assignedWorkoutsJson
        ?JSON.parse(assignedWorkoutsJson)
        : [];

        const found = assignedWorkouts.find((w: any) => w.id === workoutId);
        if(!found) {
          Alert.alert('Erro', 'Treino não encontrado');
          router.back();
          return;
        }

        setAssignedWorkout(found);

        const templates = getMockWorkoutTemplates();
        const template = templates.find((t: any) => t.id === found.workoutTemplateId);

        if(template) {
          setWorkoutTemplate(template);
        }

      } catch (error) {
        console.error('Erro ao carregar treino:', error);
        Alert.alert('Erro', 'Não foi possível carregar o treino');
      } finally {
        setLoading(false);
      }
     };
      loadWorkoutData();
  }, [workoutId]);
;



  // Se não encontrou o treino, volta para a tela anterior
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-xl font-bold text-neutral-900 mb-4">
          Carregando treino
        </Text>
      </View>
    );
  }

  if (!assignedWorkout) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className='text-xl font-bold text-neutral-900 mb-4'>
          Treinao não encontrado
        </Text>
        <TouchableOpacity 
         className="bg-primary-600 rounded-lg py-3 px-6"
         onPress={() => router.back()}
         >
          <Text className="text-white font-semibold">
            Voltar
          </Text>
         </TouchableOpacity>
      </View>
    )
  }

  const handleMarkAsCompleted = async () => {
    try {
      // 1. Buscar todos os treinos atribuídos
      const assignedWorkoutsJson = await AsyncStorage.getItem('assigned_workouts');
      const assignedWorkouts = assignedWorkoutsJson 
        ? JSON.parse(assignedWorkoutsJson) 
        : [];
      
      // 2. Encontrar e atualizar o treino específico
      const updatedWorkouts = assignedWorkouts.map((w: any) => {
        if (w.id === workoutId) {
          return {
            ...w,
            status: 'Concluído',
            completedDate: new Date().toISOString(),
          };
        }
        return w;
      });
      
      // 3. Salvar de volta no AsyncStorage
      await AsyncStorage.setItem('assigned_workouts', JSON.stringify(updatedWorkouts));
      
      // 4. Atualizar o estado local
      setAssignedWorkout({
        ...assignedWorkout,
        status: 'Concluído',
        completedDate: new Date().toISOString(),
      });
      
      Alert.alert(
        'Treino Concluído',
        `Parabéns! Você concluiu o treino "${assignedWorkout?.name}"`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error);
      Alert.alert('Erro', 'Não foi possível marcar o treino como concluído');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-12 pb-20">
        {/* Header com botão voltar */}
        <TouchableOpacity
          className="mb-6"
          onPress={() => router.back()}
        >
          <Text className="text-primary-600 font-semibold text-lg">
            ← Voltar
          </Text>
        </TouchableOpacity>

                {/* Informações do treino */}
                <View className="mb-6">
          <Text className="text-3xl font-bold text-neutral-900 mb-2">
            {assignedWorkout.name}
          </Text>
          <Text className="text-neutral-600 mb-1">
            Treinador: {assignedWorkout.coach}
          </Text>
          <Text className="text-neutral-600 mb-4">
            Data: {assignedWorkout.date} ({assignedWorkout.dayOfWeek})
          </Text>
          
          {/* Badge de status */}
          <View className={`self-start px-4 py-2 rounded-full ${
            assignedWorkout.status === 'Concluído'
              ? 'bg-green-100'
              : 'bg-yellow-100'
          }`}>
            <Text className={`text-sm font-semibold ${
              assignedWorkout.status === 'Concluído'
                ? 'text-green-700'
                : 'text-yellow-700'
            }`}>
              {assignedWorkout.status}
            </Text>
          </View>
        </View>

                {/* Lista de blocos e exercícios */}
          {workoutTemplate && (
          <View className="mb-6">
            <Text className="text-2xl font-bold text-neutral-900 mb-4">
              Detalhes do Treino
            </Text>
            
            {workoutTemplate.blocks.map((block: WorkoutBlockData, blockIndex: number) => {
              const blockNames: Record<string, string> = {
                'WARM_UP': '🔥 Aquecimento',
                'WORK': '💪 Trabalho Principal',
                'COOL_DOWN': '🧘 Desaquecimento',
              };
              
              return (
                <View key={blockIndex} className="mb-6">
                  <Text className="text-xl font-semibold text-neutral-900 mb-3">
                    {blockNames[block.blockType] || block.blockType}
                  </Text>
                  
                  {block.exercises.map((exercise: any, exerciseIndex: number) => (
                    <View
                      key={exerciseIndex}
                      className="bg-neutral-50 rounded-lg p-4 mb-3 border border-neutral-200"
                    >
                      <Text className="text-lg font-semibold text-neutral-900 mb-2">
                        {exercise.exercise?.name || `Exercício ${exerciseIndex + 1}`}
                      </Text>
                      
                      {exercise.exercise?.description && (
                        <Text className="text-neutral-600 text-sm mb-2">
                          {exercise.exercise.description}
                        </Text>
                      )}
                      
                      <View className="flex-row gap-4 flex-wrap">
                        {exercise.sets && (
                          <Text className="text-neutral-600">
                            Séries: {exercise.sets}
                          </Text>
                        )}
                        {exercise.reps && (
                          <Text className="text-neutral-600">
                            Repetições: {exercise.reps}
                          </Text>
                        )}
                        {exercise.duration && (
                          <Text className="text-neutral-600">
                            Duração: {Math.floor(exercise.duration / 60)}min
                          </Text>
                        )}
                        {exercise.restTime && (
                          <Text className="text-neutral-600">
                            Descanso: {exercise.restTime}s
                          </Text>
                        )}
                      </View>
                      
                      {exercise.notes && (
                        <Text className="text-neutral-500 text-sm mt-2 italic">
                          💡 {exercise.notes}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

                {/* Botão marcar como concluído (só aparece se estiver pendente) */}
                {assignedWorkout.status === 'Pendente' && (
          <TouchableOpacity
            className="bg-primary-600 rounded-lg py-4 px-6"
            onPress={handleMarkAsCompleted}
          >
            <Text className="text-white font-semibold text-center text-lg">
              Marcar como Concluído
            </Text>
          </TouchableOpacity>
        )}

        {/* Mensagem se já estiver concluído */}
        {assignedWorkout.status === 'Concluído' && (
          <View className="bg-green-50 rounded-lg p-4 border border-green-200">
            <Text className="text-green-700 font-semibold text-center">
              ✅ Este treino já foi concluído!
            </Text>
          </View>
        )}
       
      </View>
    </ScrollView>
  );
}
