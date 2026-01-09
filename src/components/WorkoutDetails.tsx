/**
 * WorkoutDetails Component
 * 
 * Componente reutilizável para exibir um treino completo
 * com os 3 blocos organizados: Aquecimento, Principal e Finalização.
 * 
 * Usado tanto para treinador (ver template) quanto para atleta (ver treino atribuído).
 */

import { WorkoutBlock, WorkoutBlockData } from '@/src/types';
import { Text, View } from 'react-native';

/**
 * Props do componente WorkoutDetails
 */
interface WorkoutDetailsProps {
  blocks: WorkoutBlockData[];
  workoutName?: string;
}

/**
 * Função auxiliar para obter o nome do bloco em português
 */
function getBlockName(blockType: WorkoutBlock): string {
  switch (blockType) {
    case WorkoutBlock.WARM_UP:
      return '🔥 Aquecimento';
    case WorkoutBlock.WORK:
      return '💪 Parte Principal';
    case WorkoutBlock.COOL_DOWN:
      return '🧘 Finalização';
    default:
      return 'Bloco';
  }
}

/**
 * Componente WorkoutDetails
 */
export function WorkoutDetails({ blocks, workoutName }: WorkoutDetailsProps) {
  return (
    <View className="w-full">
      {/* Título do treino (opcional) */}
      {workoutName && (
        <Text className="text-2xl font-bold text-neutral-900 mb-6">
          {workoutName}
        </Text>
      )}

      {/* Renderizar cada bloco */}
      {blocks.map((block, blockIndex) => (
        <View key={blockIndex} className="mb-6">
          {/* Cabeçalho do bloco */}
          <View className="bg-primary-50 rounded-t-lg px-4 py-3 border-b border-primary-200">
            <Text className="text-lg font-bold text-primary-900">
              {getBlockName(block.blockType)}
            </Text>
            {block.notes && (
              <Text className="text-sm text-primary-700 mt-1">
                {block.notes}
              </Text>
            )}
          </View>

          {/* Lista de exercícios do bloco */}
          <View className="bg-neutral-50 rounded-b-lg p-4 border border-neutral-200 border-t-0">
            {block.exercises.length === 0 ? (
              <Text className="text-neutral-500 text-sm italic">
                Nenhum exercício neste bloco
              </Text>
            ) : (
              block.exercises
                .sort((a, b) => a.order - b.order) // Ordenar por ordem
                .map((exercise, exerciseIndex) => (
                  <View
                    key={exerciseIndex}
                    className="bg-white rounded-lg p-4 mb-3 border border-neutral-200"
                  >
                    {/* Nome do exercício */}
                    <Text className="text-base font-semibold text-neutral-900 mb-2">
                      {exercise.exercise?.name || `Exercício ${exercise.order}`}
                    </Text>

                    {/* Detalhes do exercício */}
                    <View className="flex-row flex-wrap gap-3">
                      {exercise.sets && (
                        <Text className="text-sm text-neutral-600">
                          Séries: {exercise.sets}
                        </Text>
                      )}
                      {exercise.reps && (
                        <Text className="text-sm text-neutral-600">
                          Reps: {exercise.reps}
                        </Text>
                      )}
                      {exercise.duration && (
                        <Text className="text-sm text-neutral-600">
                          Duração: {exercise.duration}s
                        </Text>
                      )}
                      {exercise.restTime && (
                        <Text className="text-sm text-neutral-600">
                          Descanso: {exercise.restTime}s
                        </Text>
                      )}
                    </View>

                    {/* Observações do exercício */}
                    {exercise.notes && (
                      <Text className="text-xs text-neutral-500 mt-2 italic">
                        {exercise.notes}
                      </Text>
                    )}
                  </View>
                ))
            )}
          </View>
        </View>
      ))}
    </View>
  );
}