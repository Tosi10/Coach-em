/**
 * BIBLIOTECA DE EXERCÍCIOS
 * 
 * Tela para o treinador visualizar e gerenciar sua biblioteca de exercícios.
 * Por enquanto com dados mockados, depois virá do Firebase.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Dados mockados de exercícios (temporário - depois virá do Firebase)
const mockExercises = [
  {
    id: '1',
    name: 'Agachamento',
    description: 'Exercício fundamental para desenvolvimento de força nas pernas e glúteos.',
    difficulty: 'beginner' as const,
    muscleGroups: ['pernas', 'glúteos'],
    equipment: ['Nenhum'],
    duration: 60,
  },
  {
    id: '2',
    name: 'Supino Reto',
    description: 'Exercício clássico para desenvolvimento do peitoral, tríceps e deltoides.',
    difficulty: 'intermediate' as const,
    muscleGroups: ['peito', 'tríceps', 'ombros'],
    equipment: ['Barra', 'Banco'],
    duration: 90,
  },
  {
    id: '3',
    name: 'Puxada Frontal',
    description: 'Exercício para desenvolvimento das costas e bíceps.',
    difficulty: 'intermediate' as const,
    muscleGroups: ['costas', 'bíceps'],
    equipment: ['Barra', 'Pulley'],
    duration: 90,
  },
  {
    id: '4',
    name: 'Leg Press',
    description: 'Exercício para pernas realizado em máquina, ideal para iniciantes.',
    difficulty: 'beginner' as const,
    muscleGroups: ['pernas', 'glúteos'],
    equipment: ['Máquina Leg Press'],
    duration: 75,
  },
  {
    id: '5',
    name: 'Rosca Direta',
    description: 'Exercício isolado para desenvolvimento dos bíceps.',
    difficulty: 'beginner' as const,
    muscleGroups: ['bíceps'],
    equipment: ['Halteres'],
    duration: 45,
  },
  {
    id: '6',
    name: 'Tríceps Pulley',
    description: 'Exercício isolado para desenvolvimento dos tríceps.',
    difficulty: 'beginner' as const,
    muscleGroups: ['tríceps'],
    equipment: ['Pulley'],
    duration: 45,
  },
  {
    id: '7',
    name: 'Desenvolvimento com Halteres',
    description: 'Exercício para desenvolvimento dos ombros.',
    difficulty: 'intermediate' as const,
    muscleGroups: ['ombros'],
    equipment: ['Halteres'],
    duration: 60,
  },
  {
    id: '8',
    name: 'Remada Curvada',
    description: 'Exercício para desenvolvimento das costas e bíceps.',
    difficulty: 'advanced' as const,
    muscleGroups: ['costas', 'bíceps'],
    equipment: ['Barra', 'Halteres'],
    duration: 90,
  },
  {
    id: '9',
    name: 'Abdominal Crunch',
    description: 'Exercício básico para fortalecimento do core.',
    difficulty: 'beginner' as const,
    muscleGroups: ['core', 'abdômen'],
    equipment: ['Nenhum'],
    duration: 30,
  },
  {
    id: '10',
    name: 'Prancha',
    description: 'Exercício isométrico para fortalecimento do core.',
    difficulty: 'intermediate' as const,
    muscleGroups: ['core', 'abdômen'],
    equipment: ['Nenhum'],
    duration: 60,
  },
];

export default function ExercisesLibraryScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  // Filtrar exercícios baseado na busca
  const filteredExercises = mockExercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchText.toLowerCase()) ||
    exercise.muscleGroups.some(group => group.toLowerCase().includes(searchText.toLowerCase()))
  );

  // Função para obter cor da dificuldade
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  // Função para traduzir dificuldade
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Iniciante';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return difficulty;
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

        {/* Título */}
        <Text className="text-3xl font-bold text-neutral-900 mb-2">
          Biblioteca de Exercícios
        </Text>
        <Text className="text-neutral-600 mb-6">
          Gerencie seu repertório de exercícios
        </Text>

        {/* Botão Criar Exercício */}
        <TouchableOpacity
          className="bg-primary-600 rounded-lg py-3 px-6 mb-6"
          onPress={() => router.push('/create-exercise')}
        >
          <Text className="text-white font-semibold text-center text-lg">
            ➕ Criar Exercício
          </Text>
        </TouchableOpacity>

        {/* Campo de busca */}
        <View className="mb-6">
          <TextInput
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
            placeholder="Buscar exercício ou grupo muscular..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Contador de resultados */}
        <Text className="text-neutral-600 mb-4">
          {filteredExercises.length} exercício{filteredExercises.length !== 1 ? 's' : ''} encontrado{filteredExercises.length !== 1 ? 's' : ''}
        </Text>

        {/* Lista de exercícios */}
        {filteredExercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            className="bg-neutral-50 rounded-lg p-4 mb-3 border border-neutral-200"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-lg font-semibold text-neutral-900 flex-1">
                {exercise.name}
              </Text>
              <View className={`px-3 py-1 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                <Text className={`text-xs font-semibold`}>
                  {getDifficultyLabel(exercise.difficulty)}
                </Text>
              </View>
            </View>

            <Text className="text-neutral-600 text-sm mb-3">
              {exercise.description}
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-2">
              {exercise.muscleGroups.map((group, index) => (
                <View
                  key={index}
                  className="bg-primary-50 px-2 py-1 rounded"
                >
                  <Text className="text-xs text-primary-700">
                    {group}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row gap-4 mt-2">
              <Text className="text-neutral-500 text-xs">
                Equipamento: {exercise.equipment.join(', ')}
              </Text>
              {exercise.duration && (
                <Text className="text-neutral-500 text-xs">
                  Duração: {exercise.duration}s
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Mensagem se não encontrar */}
        {filteredExercises.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-neutral-400 text-center">
              Nenhum exercício encontrado
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
