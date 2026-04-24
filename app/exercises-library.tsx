/**
 * BIBLIOTECA DE EXERCÍCIOS
 * 
 * Tela para o treinador visualizar e gerenciar sua biblioteca de exercícios.
 * Por enquanto com dados mockados, depois virá do Firebase.
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { DEFAULT_EXERCISES, mergeDefaultExercisesWithCoachSaved } from '@/src/data/defaultExercises';
import { deleteExercises, listExercisesByCoachId } from '@/src/services/exercises.service';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Base padrão de exercícios para iniciar a biblioteca do treinador.
const mockExercises = DEFAULT_EXERCISES;

export default function ExercisesLibraryScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [searchText, setSearchText] = useState('');
  const [allExercises, setAllExercises] = useState(mockExercises);

  // ESTADO: Filtro por grupo muscular
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState<'warmup' | 'work' | 'cooldown' | null>(null);

  // Estados para CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | null>(null);

  // Função helper para mostrar alert customizado
  const showAlert = (
      title: string,
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      onConfirm?: () => void
  ) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertType(type);
      setAlertOnConfirm(() => onConfirm);
      setAlertVisible(true);
  };

  const loadSavedExercises = useCallback(async () => {
    try {
      const coachId = user?.id;
      const savedExercises = coachId
        ? await listExercisesByCoachId(coachId)
        : [];
      const combinedExercises = mergeDefaultExercisesWithCoachSaved(
        mockExercises,
        savedExercises,
        coachId ?? undefined
      );
      setAllExercises(combinedExercises);
    } catch (error) {
      console.error('Erro ao carregar exercícios', error);
      setAllExercises(mockExercises);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSavedExercises();
  }, []);
  
  // E mantenha o useFocusEffect também:
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 Tela recebeu foco - recarregando exercícios...');
      loadSavedExercises();
    }, [loadSavedExercises])
  );

  const confirmDeleteExercise = async (exerciseId: string) => {
    try {
      await deleteExercises([exerciseId]);
      await loadSavedExercises();
      showAlert('Sucesso', 'Exercício deletado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao deletar exercício:', error);
      showAlert('Erro', 'Não foi possível deletar o exercício.', 'error');
    }
  };

  const handleDeleteExercise = (exerciseId: string, exerciseName: string) => {
    showAlert(
        'Deletar Exercício',
        `Tem certeza que deseja deletar o exercício "${exerciseName}"? Esta ação não pode ser desfeita.`,
        'warning',
        () => confirmDeleteExercise(exerciseId)
    );
  };

  const handleResetSingleExercise = (exerciseId: string, exerciseName: string) => {
    showAlert(
      'Restaurar exercício',
      `Deseja restaurar "${exerciseName}" para o padrão?`,
      'warning',
      async () => {
        try {
          // Remove apenas o override deste exercício.
          // O default base volta a aparecer automaticamente na posição original.
          await deleteExercises([exerciseId]);
          await loadSavedExercises();
          showAlert('Sucesso', 'Exercício restaurado para o padrão.', 'success');
        } catch (error) {
          console.error('Erro ao restaurar exercício:', error);
          showAlert('Erro', 'Não foi possível restaurar este exercício.', 'error');
        }
      }
    );
  };

  // FUNÇÃO: Obter todos os grupos musculares únicos
  const getAllMuscleGroups = (): string[] => {
    const groupsSet = new Set<string>();

    allExercises.forEach(ex => {
      ex.muscleGroups?.forEach((group: string) => {
        groupsSet.add(group.toLowerCase());
      });
    });

    return Array.from(groupsSet).sort();
  };

  const getExerciseType = (exercise: any): 'warmup' | 'work' | 'cooldown' => {
    const groups = (exercise.muscleGroups || []).map((g: string) => g.toLowerCase());
    if (groups.some((g: string) => g.includes('flexibilidade'))) return 'cooldown';
    if (groups.some((g: string) => g.includes('cardio') || g.includes('mobilidade'))) return 'warmup';
    return 'work';
  };

  // FUNÇÃO: Filtrar exercícios
  const filteredExercises = allExercises.filter((exercise) => {
    // FILTRO 1: Busca por texto
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const nameMatch = exercise.name?.toLowerCase().includes(searchLower) || false;
      const descMatch = exercise.description?.toLowerCase().includes(searchLower) || false;
      if (!nameMatch && !descMatch) return false;
    }

    // FILTRO 2: Grupo muscular
    if (selectedMuscleGroup) {
      const hasGroup = exercise.muscleGroups?.some((group: string) =>
        group.toLowerCase() === selectedMuscleGroup.toLowerCase()
      );
      if (!hasGroup) return false;
    }
    
    // FILTRO 3: Tipo do exercício
    if (selectedExerciseType) {
      if (getExerciseType(exercise) !== selectedExerciseType) return false;
    }

    return true;
  });

  // Função para obter cor da dificuldade (tema escuro)
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 border border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 border border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 border border-red-500/30';
      default:
        return 'bg-neutral-500/20 border border-neutral-500/30';
    }
  };

  const getDifficultyTextColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400';
      case 'intermediate':
        return 'text-yellow-400';
      case 'advanced':
        return 'text-red-400';
      default:
        return 'text-neutral-400';
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
    <ScrollView className="flex-1" style={themeStyles.bg}>
      <View className="px-6 pt-20 pb-20">
        {/* Header com botão voltar melhorado */}
        <TouchableOpacity
          className="mb-6 flex-row items-center"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View className="rounded-full w-10 h-10 items-center justify-center mr-3 border" style={themeStyles.cardSecondary}>
            <FontAwesome name="arrow-left" size={18} color={theme.colors.primary} />
          </View>
          <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>
            Voltar
          </Text>
        </TouchableOpacity>

        {/* Título */}
        <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
          Biblioteca de Exercícios
        </Text>
        <Text className="mb-6" style={themeStyles.textSecondary}>
          Gerencie seu repertório de exercícios
        </Text>

        {/* Ações da biblioteca */}
        <View className="mb-6">
          <TouchableOpacity
            className="rounded-lg py-3 px-6 border"
            style={{
              backgroundColor: theme.mode === 'dark' 
                ? 'rgba(249, 115, 22, 0.4)' 
                : 'rgba(251, 146, 60, 0.2)',
              borderColor: theme.colors.primary + '50',
            }}
            onPress={() => router.push('/create-exercise')}
          >
            <Text className="font-semibold text-center text-lg" style={{ color: theme.colors.primary }}>
              ➕ Criar Exercício
            </Text>
          </TouchableOpacity>
        </View>

        {/* Campo de busca */}
        <View className="mb-4">
          <TextInput
            className="border rounded-lg px-4 py-3"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
            placeholder="Buscar exercício..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* FILTRO POR GRUPO MUSCULAR */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
            Grupo Muscular
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
          >
            <View className="flex-row gap-2">
              {/* Botão "Todos" */}
              <TouchableOpacity
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: selectedMuscleGroup === null
                    ? theme.colors.primary
                    : theme.colors.backgroundTertiary,
                }}
                onPress={() => setSelectedMuscleGroup(null)}
              >
                <Text className="text-sm font-semibold" style={{
                  color: selectedMuscleGroup === null
                    ? '#ffffff'
                    : theme.colors.text
                }}>
                  Todos
                </Text>
              </TouchableOpacity>

              {/* Lista de grupos musculares */}
              {getAllMuscleGroups().map((group) => (
                <TouchableOpacity
                  key={group}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: selectedMuscleGroup === group
                      ? theme.colors.primary
                      : theme.colors.backgroundTertiary,
                  }}
                  onPress={() => {
                    setSelectedMuscleGroup(
                      selectedMuscleGroup === group ? null : group
                    );
                  }}
                >
                  <Text className="text-sm font-semibold" style={{
                    color: selectedMuscleGroup === group
                      ? '#ffffff'
                      : theme.colors.text
                  }}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* FILTRO POR TIPO */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
            Tipo
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8 }}
          >
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: selectedExerciseType === null
                  ? theme.colors.primary
                  : theme.colors.backgroundTertiary,
              }}
              onPress={() => setSelectedExerciseType(null)}
            >
              <Text className="text-sm font-semibold" style={{ color: selectedExerciseType === null ? '#ffffff' : theme.colors.text }}>
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: selectedExerciseType === 'warmup'
                  ? theme.colors.primary
                  : theme.colors.backgroundTertiary,
              }}
              onPress={() => setSelectedExerciseType(selectedExerciseType === 'warmup' ? null : 'warmup')}
            >
              <Text className="text-sm font-semibold" style={{ color: selectedExerciseType === 'warmup' ? '#ffffff' : theme.colors.text }}>
                Aquecimento
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: selectedExerciseType === 'work'
                  ? theme.colors.primary
                  : theme.colors.backgroundTertiary,
              }}
              onPress={() => setSelectedExerciseType(selectedExerciseType === 'work' ? null : 'work')}
            >
              <Text className="text-sm font-semibold" style={{ color: selectedExerciseType === 'work' ? '#ffffff' : theme.colors.text }}>
                Principal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: selectedExerciseType === 'cooldown'
                  ? theme.colors.primary
                  : theme.colors.backgroundTertiary,
              }}
              onPress={() => setSelectedExerciseType(selectedExerciseType === 'cooldown' ? null : 'cooldown')}
            >
              <Text className="text-sm font-semibold" style={{ color: selectedExerciseType === 'cooldown' ? '#ffffff' : theme.colors.text }}>
                Finalização
              </Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>

        {/* Contador de resultados */}
        <Text className="mb-4" style={themeStyles.textSecondary}>
          {filteredExercises.length} exercício{filteredExercises.length !== 1 ? 's' : ''} encontrado{filteredExercises.length !== 1 ? 's' : ''}
        </Text>

        {/* Lista de exercícios */}
        {filteredExercises.map((exercise) => (
          <View
            key={exercise.id}
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
            {/* Cabeçalho do card com nome, botões de ação e dificuldade */}
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-lg font-semibold flex-1" style={themeStyles.text}>
                {exercise.name || 'Exercício sem nome'}
              </Text>
              
              {/* Botões de ação */}
              <View className="flex-row gap-2 mr-2">
                {/* Editar disponível para defaults e personalizados */}
                <TouchableOpacity
                  className="bg-blue-500/80 rounded-lg px-3 py-1"
                  onPress={() => {
                    router.push({
                      pathname: '/edit-exercise',
                      params: { exerciseId: exercise.id },
                    });
                  }}
                >
                  <Text className="text-white font-semibold text-xs">
                    ✏️
                  </Text>
                </TouchableOpacity>
                
                {/* Restaurar padrão por exercício (somente overrides de default) */}
                {exercise.id.startsWith('exercise_default_') && (
                  <TouchableOpacity
                    className="bg-amber-500/80 rounded-lg px-3 py-1"
                    onPress={() => handleResetSingleExercise(exercise.id, exercise.name || 'Exercício')}
                  >
                    <Text className="text-white font-semibold text-xs">
                      ↺
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Deletar só para personalizados do treinador (não default override) */}
                {exercise.id.startsWith('exercise_') && !exercise.id.startsWith('exercise_default_') && (
                  <TouchableOpacity
                    className="bg-red-500/80 rounded-lg px-3 py-1"
                    onPress={() => handleDeleteExercise(exercise.id, exercise.name || 'Exercício')}
                  >
                    <Text className="text-white font-semibold text-xs">
                      🗑️
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View className={`px-3 py-1 rounded-full ${getDifficultyColor(exercise.difficulty || 'beginner')}`}>
                <Text className={`text-xs font-semibold ${getDifficultyTextColor(exercise.difficulty || 'beginner')}`}>
                  {getDifficultyLabel(exercise.difficulty || 'beginner')}
                </Text>
              </View>
            </View>

            <Text className="text-sm mb-3" style={themeStyles.textSecondary}>
              {exercise.description || 'Sem descrição'}
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-2">
              {exercise.muscleGroups && exercise.muscleGroups.length > 0 ? (
                exercise.muscleGroups.map((group, index) => (
                  <View
                    key={index}
                    className="border px-2 py-1 rounded"
                    style={{
                      backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)',
                      borderColor: theme.colors.primary + '50',
                    }}
                  >
                    <Text className="text-xs" style={{ color: theme.colors.primary }}>
                      {group}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-xs" style={themeStyles.textTertiary}>
                  Nenhum grupo muscular
                </Text>
              )}
            </View>

            <View className="flex-row gap-4 mt-2">
              <Text className="text-xs" style={themeStyles.textTertiary}>
                Equipamento: {exercise.equipment && exercise.equipment.length > 0 ? exercise.equipment.join(', ') : 'Nenhum'}
              </Text>
              {exercise.duration !== undefined && exercise.duration !== null && exercise.duration > 0 && (
                <Text className="text-xs" style={themeStyles.textTertiary}>
                  Duração: {exercise.duration}s
                </Text>
              )}
            </View>
          </View>
        ))}

        {/* Mensagem se não encontrar */}
        {filteredExercises.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-center" style={themeStyles.textSecondary}>
              Nenhum exercício encontrado
            </Text>
          </View>
        )}
      </View>

      {/* Custom Alert */}
      <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          confirmText="OK"
          cancelText="Cancelar"
          showCancel={alertType === 'warning'}
          onConfirm={() => {
              setAlertVisible(false);
              alertOnConfirm?.();
          }}
          onCancel={() => {
              setAlertVisible(false);
          }}
      />
    </ScrollView>
  );
}
