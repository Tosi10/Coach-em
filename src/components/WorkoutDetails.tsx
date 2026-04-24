/**
 * WorkoutDetails Component
 * 
 * Componente reutilizável para exibir um treino completo
 * com os 3 blocos organizados: Aquecimento, Principal e Finalização.
 * 
 * Usado tanto para treinador (ver template) quanto para atleta (ver treino atribuído).
 */

import { useTheme } from '@/src/contexts/ThemeContext';
import { WorkoutBlock, WorkoutBlockData } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { Image, Text, View } from 'react-native';

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
      return 'Aquecimento';
    case WorkoutBlock.WORK:
      return 'Parte Principal';
    case WorkoutBlock.COOL_DOWN:
      return 'Finalização';
    default:
      return 'Bloco';
  }
}

function getBlockIcon(blockType: WorkoutBlock) {
  switch (blockType) {
    case WorkoutBlock.WARM_UP:
      return require('../../assets/images/IconeAquecimento2.png');
    case WorkoutBlock.WORK:
      return require('../../assets/images/IconeTrabalhoPrincipal2.png');
    case WorkoutBlock.COOL_DOWN:
      return require('../../assets/images/IconeFinalizacao2.png');
    default:
      return null;
  }
}

/**
 * Componente WorkoutDetails
 */
export function WorkoutDetails({ blocks, workoutName }: WorkoutDetailsProps) {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);

  return (
    <View className="w-full">
      {/* Título do treino (opcional) */}
      {workoutName && (
        <Text className="text-2xl font-bold mb-6" style={themeStyles.text}>
          {workoutName}
        </Text>
      )}

      {/* Renderizar cada bloco */}
      {blocks.map((block, blockIndex) => (
        <View key={blockIndex} className="mb-6">
          {/* Cabeçalho do bloco */}
          <View 
            className="rounded-t-xl px-4 py-3 border"
            style={{
              backgroundColor: theme.mode === 'dark' 
                ? 'rgba(251, 146, 60, 0.2)' 
                : 'rgba(251, 146, 60, 0.1)',
              borderColor: theme.colors.primary + '50',
            }}
          >
            <View className="flex-row items-center">
              {getBlockIcon(block.blockType) ? (
                <Image
                  source={getBlockIcon(block.blockType)!}
                  style={{ width: 32, height: 32, marginRight: 10 }}
                  resizeMode="contain"
                />
              ) : null}
              <Text className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                {getBlockName(block.blockType)}
              </Text>
            </View>
            {block.notes && (
              <Text className="text-sm mt-1" style={themeStyles.textSecondary}>
                {block.notes}
              </Text>
            )}
          </View>

          {/* Lista de exercícios do bloco */}
          <View 
            className="rounded-b-xl p-4 border border-t-0"
            style={themeStyles.card}
          >
            {block.exercises.length === 0 ? (
              <Text className="text-sm italic" style={themeStyles.textSecondary}>
                Nenhum exercício neste bloco
              </Text>
            ) : (
              block.exercises
                .sort((a, b) => a.order - b.order) // Ordenar por ordem
                .map((exercise, exerciseIndex) => (
                  <View
                    key={exerciseIndex}
                    className="rounded-xl p-4 mb-3 border"
                    style={{
                      ...themeStyles.card,
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    {/* Nome do exercício */}
                    <Text className="text-base font-semibold mb-2" style={themeStyles.text}>
                      {exercise.exercise?.name || `Exercício ${exercise.order}`}
                    </Text>

                    {/* Detalhes do exercício */}
                    <View className="flex-row flex-wrap gap-3">
                      {exercise.sets && (
                        <Text className="text-sm" style={themeStyles.textSecondary}>
                          Séries: {exercise.sets}
                        </Text>
                      )}
                      {exercise.reps && (
                        <Text className="text-sm" style={themeStyles.textSecondary}>
                          Reps: {exercise.reps}
                        </Text>
                      )}
                      {exercise.duration && (
                        <Text className="text-sm" style={themeStyles.textSecondary}>
                          Duração: {exercise.duration}s
                        </Text>
                      )}
                      {exercise.restTime && (
                        <Text className="text-sm" style={themeStyles.textSecondary}>
                          Descanso: {exercise.restTime}s
                        </Text>
                      )}
                    </View>

                    {/* Observações do exercício */}
                    {exercise.notes && (
                      <Text className="text-xs mt-2 italic" style={themeStyles.textTertiary}>
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