/**
 * TELA DE DETALHES DO TREINO
 * 
 * Esta tela mostra os detalhes completos de um treino específico,
 * incluindo lista de exercícios e permite marcar como concluído.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, } from 'react-native';


// Dados mockados de exercícios (temporário - depois virá do Firebase)
const mockExercises = {
  '1': [ // Exercícios do treino ID 1
    { id: '1', name: 'Agachamento', sets: 4, reps: 12, rest: '60s' },
    { id: '2', name: 'Leg Press', sets: 3, reps: 15, rest: '45s' },
    { id: '3', name: 'Extensão de Pernas', sets: 3, reps: 12, rest: '45s' },
    { id: '4', name: 'Flexão de Pernas', sets: 3, reps: 12, rest: '45s' },
  ],
  '2': [ // Exercícios do treino ID 2
    { id: '5', name: 'Supino Reto', sets: 4, reps: 10, rest: '90s' },
    { id: '6', name: 'Supino Inclinado', sets: 3, reps: 12, rest: '60s' },
    { id: '7', name: 'Crucifixo', sets: 3, reps: 15, rest: '45s' },
  ],
  '3': [ // Exercícios do treino ID 3
    { id: '8', name: 'Puxada Frontal', sets: 4, reps: 10, rest: '90s' },
    { id: '9', name: 'Remada Curvada', sets: 3, reps: 12, rest: '60s' },
    { id: '10', name: 'Puxada Unilateral', sets: 3, reps: 12, rest: '45s' },
  ],
  '4': [ // Exercícios do treino ID 4
    { id: '11', name: 'Rosca Direta', sets: 4, reps: 12, rest: '60s' },
    { id: '12', name: 'Rosca Martelo', sets: 3, reps: 15, rest: '45s' },
  ],
  '5': [ // Exercícios do treino ID 5
    { id: '13', name: 'Tríceps Pulley', sets: 4, reps: 12, rest: '60s' },
    { id: '14', name: 'Tríceps Testa', sets: 3, reps: 12, rest: '45s' },
  ],
};

// Dados mockados de treinos (mesmo do index.tsx)
const mockWorkouts = [
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
];

export default function WorkoutDetailsScreen() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  
  // Buscar o treino correspondente
  const [workout, setWorkout] = useState( mockWorkouts.find(w => w.id === workoutId));

  useEffect(() => {
    const loadWorkoutStatus = async () => {
      if(workout) {
        const savedStatus = await AsyncStorage.getItem(`workout_${workoutId}_status`);
        if(savedStatus) {
          setWorkout({ ...workout, status: savedStatus});
        }
      }
     };
      loadWorkoutStatus();
  }, [workoutId]);
  
  // Buscar exercícios do treino
  const exercises = mockExercises[workoutId as keyof typeof mockExercises] || [];



  // Se não encontrou o treino, volta para a tela anterior
  if (!workout) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-xl font-bold text-neutral-900 mb-4">
          Treino não encontrado
        </Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-lg py-3 px-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleMarkAsCompleted = async() => {

    await AsyncStorage.setItem(`workout_${workoutId}_status`, 'Concluído');
    
    Alert.alert(
      'Treino Concluído',
      `Parabéns! Você concluiu o treino "${workout.name}"`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
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
            {workout.name}
          </Text>
          <Text className="text-neutral-600 mb-1">
            Treinador: {workout.coach}
          </Text>
          <Text className="text-neutral-600 mb-4">
            Data: {workout.date}
          </Text>
          
          {/* Badge de status */}
          <View className={`self-start px-4 py-2 rounded-full ${
            workout.status === 'Concluído'
              ? 'bg-green-100'
              : 'bg-yellow-100'
          }`}>
            <Text className={`text-sm font-semibold ${
              workout.status === 'Concluído'
                ? 'text-green-700'
                : 'text-yellow-700'
            }`}>
              {workout.status}
            </Text>
          </View>
        </View>

        {/* Lista de exercícios */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-neutral-900 mb-4">
            Exercícios ({exercises.length})
          </Text>

          {exercises.map((exercise) => (
            <View
              key={exercise.id}
              className="bg-neutral-50 rounded-lg p-4 mb-3 border border-neutral-200"
            >
              <Text className="text-lg font-semibold text-neutral-900 mb-2">
                {exercise.name}
              </Text>
              <View className="flex-row gap-4">
                <Text className="text-neutral-600">
                  Séries: {exercise.sets}
                </Text>
                <Text className="text-neutral-600">
                  Repetições: {exercise.reps}
                </Text>
                <Text className="text-neutral-600">
                  Descanso: {exercise.rest}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Botão marcar como concluído (só aparece se estiver pendente) */}
        {workout.status === 'Pendente' && (
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
        {workout.status === 'Concluído' && (
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
