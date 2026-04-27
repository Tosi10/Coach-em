/**
 * Editar treino já atribuído a um atleta.
 * Permite ao treinador alterar exercícios (adicionar/remover) quando o atleta
 * não pode fazer algo (ex.: dor) ou para ajustar o treino.
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { DEFAULT_EXERCISES, mergeDefaultExercisesWithCoachSaved } from '@/src/data/defaultExercises';
import { getAssignedWorkoutById, updateAssignedWorkout } from '@/src/services/assignedWorkouts.service';
import { listExercisesByCoachId } from '@/src/services/exercises.service';
import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const mockExercises: Exercise[] = DEFAULT_EXERCISES;

export default function EditAssignedWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { assignedWorkoutId } = useLocalSearchParams();

  const assignedWorkoutIdString = Array.isArray(assignedWorkoutId) ? assignedWorkoutId[0] : assignedWorkoutId;

  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [warmUpExercises, setWarmUpExercises] = useState<WorkoutExercise[]>([]);
  const [workExercises, setWorkExercises] = useState<WorkoutExercise[]>([]);
  const [coolDownExercises, setCoolDownExercises] = useState<WorkoutExercise[]>([]);
  const [warmUpNotes, setWarmUpNotes] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [coolDownNotes, setCoolDownNotes] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<WorkoutBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [allExercises, setAllExercises] = useState<Exercise[]>(mockExercises);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState<'warmup' | 'work' | 'cooldown' | null>(null);
  const [searchExerciseText, setSearchExerciseText] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | null>(null);

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

  useEffect(() => {
    const loadWorkout = async () => {
      try {
        if (!assignedWorkoutIdString) return;
        const assigned = await getAssignedWorkoutById(assignedWorkoutIdString);
        if (!assigned) {
          showAlert('Erro', 'Treino atribuído não encontrado.', 'error', () => router.back());
          return;
        }
        setWorkoutName(assigned.name || '');
        setWorkoutDescription(assigned.description || '');
        const blockTypes = ['WARM_UP', 'WORK', 'COOL_DOWN'] as const;
        const blocks = assigned.blocks || [];
        // Por ordem: 0 = Aquecimento, 1 = Principal, 2 = Desaquecimento
        const warmBlock = blocks.find((b: any) => (b?.blockType ?? blockTypes[0]) === 'WARM_UP') ?? blocks[0];
        const workBlock = blocks.find((b: any) => (b?.blockType ?? blockTypes[1]) === 'WORK') ?? blocks[1];
        const coolBlock = blocks.find((b: any) => (b?.blockType ?? blockTypes[2]) === 'COOL_DOWN') ?? blocks[2];
        setWarmUpExercises(warmBlock?.exercises ?? []);
        setWarmUpNotes(warmBlock?.notes ?? '');
        setWorkExercises(workBlock?.exercises ?? []);
        setWorkNotes(workBlock?.notes ?? '');
        setCoolDownExercises(coolBlock?.exercises ?? []);
        setCoolDownNotes(coolBlock?.notes ?? '');
      } catch (error) {
        console.error('Erro ao carregar treino atribuído:', error);
        showAlert('Erro', 'Não foi possível carregar o treino.', 'error', () => router.back());
      } finally {
        setLoading(false);
      }
    };
    if (assignedWorkoutIdString) loadWorkout();
  }, [assignedWorkoutIdString]);

  const loadAllExercises = useCallback(async () => {
    try {
      const coachId = user?.id;
      const saved: Exercise[] = coachId ? await listExercisesByCoachId(coachId) : [];
      setAllExercises(
        mergeDefaultExercisesWithCoachSaved(mockExercises, saved, coachId ?? undefined)
      );
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAllExercises();
  }, [loadAllExercises]);

  const getExerciseType = (exercise: Exercise): 'warmup' | 'work' | 'cooldown' => {
    const groups = exercise.muscleGroups || [];
    const hasCardio = groups.some(g => g.toLowerCase().includes('cardio') || g.toLowerCase().includes('flexibilidade'));
    if (hasCardio) return groups.some(g => g.toLowerCase().includes('flexibilidade')) ? 'cooldown' : 'warmup';
    return 'work';
  };

  const getFilteredExercises = (): Exercise[] => {
    let filtered = allExercises;
    if (searchExerciseText.trim()) {
      const q = searchExerciseText.toLowerCase();
      filtered = filtered.filter(ex => ex.name.toLowerCase().includes(q) || ex.description?.toLowerCase().includes(q));
    }
    if (selectedMuscleGroup) {
      filtered = filtered.filter(ex => ex.muscleGroups?.some(g => g.toLowerCase() === selectedMuscleGroup.toLowerCase()));
    }
    if (selectedExerciseType) {
      filtered = filtered.filter(ex => getExerciseType(ex) === selectedExerciseType);
    }
    return filtered;
  };

  const getAllMuscleGroups = (): string[] => {
    const set = new Set<string>();
    allExercises.forEach(ex => ex.muscleGroups?.forEach(g => set.add(g.toLowerCase())));
    return Array.from(set).sort();
  };

  const resetFilters = () => {
    setSelectedMuscleGroup(null);
    setSelectedExerciseType(null);
    setSearchExerciseText('');
  };

  const handleAddExercise = (exercise: Exercise, blockType: WorkoutBlock) => {
    const newEx: WorkoutExercise = {
      exerciseId: exercise.id,
      exercise,
      order: 0,
      notes: '',
    };
    if (blockType === WorkoutBlock.WARM_UP) {
      newEx.order = warmUpExercises.length + 1;
      setWarmUpExercises([...warmUpExercises, newEx]);
    } else if (blockType === WorkoutBlock.WORK) {
      newEx.order = workExercises.length + 1;
      setWorkExercises([...workExercises, newEx]);
    } else {
      newEx.order = coolDownExercises.length + 1;
      setCoolDownExercises([...coolDownExercises, newEx]);
    }
    setShowExerciseModal(false);
    setCurrentBlock(null);
  };

  const handleRemoveExercise = (index: number, blockType: WorkoutBlock) => {
    if (blockType === WorkoutBlock.WARM_UP) {
      const u = warmUpExercises.filter((_, i) => i !== index);
      u.forEach((ex, i) => { ex.order = i + 1; });
      setWarmUpExercises(u);
    } else if (blockType === WorkoutBlock.WORK) {
      const u = workExercises.filter((_, i) => i !== index);
      u.forEach((ex, i) => { ex.order = i + 1; });
      setWorkExercises(u);
    } else {
      const u = coolDownExercises.filter((_, i) => i !== index);
      u.forEach((ex, i) => { ex.order = i + 1; });
      setCoolDownExercises(u);
    }
  };

  const handleUpdateExercise = (index: number, blockType: WorkoutBlock, field: string, value: unknown) => {
    if (blockType === WorkoutBlock.WARM_UP) {
      const u = [...warmUpExercises];
      (u[index] as any)[field] = value;
      setWarmUpExercises(u);
    } else if (blockType === WorkoutBlock.WORK) {
      const u = [...workExercises];
      (u[index] as any)[field] = value;
      setWorkExercises(u);
    } else {
      const u = [...coolDownExercises];
      (u[index] as any)[field] = value;
      setCoolDownExercises(u);
    }
  };

  const handleSave = async () => {
    if (!workoutName.trim()) {
      showAlert('Erro', 'Preencha o nome do treino.', 'error');
      return;
    }
    if (!assignedWorkoutIdString) return;
    try {
      const blocks: WorkoutBlockData[] = [
        { blockType: WorkoutBlock.WARM_UP, exercises: warmUpExercises, notes: warmUpNotes },
        { blockType: WorkoutBlock.WORK, exercises: workExercises, notes: workNotes },
        { blockType: WorkoutBlock.COOL_DOWN, exercises: coolDownExercises, notes: coolDownNotes },
      ];
      await updateAssignedWorkout(assignedWorkoutIdString, {
        name: workoutName.trim(),
        description: workoutDescription.trim(),
        blocks,
      });
      showAlert('Sucesso', 'Treino atualizado com sucesso!', 'success', () => router.back());
    } catch (error) {
      console.error('Erro ao atualizar treino atribuído:', error);
      showAlert('Erro', 'Não foi possível atualizar o treino.', 'error');
    }
  };

  const renderBlock = (
    title: string,
    exercises: WorkoutExercise[],
    blockType: WorkoutBlock,
    notes: string,
    setNotes: (n: string) => void
  ) => (
    <View className="mb-6">
      <Text className="text-xl font-bold mb-3" style={themeStyles.text}>{title}</Text>
      <View className="mb-3">
        <Text className="font-semibold mb-2" style={themeStyles.text}>Notas do Bloco</Text>
        <TextInput
          className="border rounded-lg px-4 py-3"
          style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }}
          placeholder="Ex: Aquecimento de 5 minutos"
          placeholderTextColor={theme.colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />
      </View>
      <TouchableOpacity
        className="rounded-lg py-3 px-4 mb-3"
        style={{ backgroundColor: theme.colors.primary }}
        onPress={() => { setCurrentBlock(blockType); setShowExerciseModal(true); }}
      >
        <Text className="font-semibold text-center" style={{ color: '#ffffff' }}>➕ Adicionar Exercício</Text>
      </TouchableOpacity>
      {exercises.map((exercise, index) => (
        <View key={index} className="rounded-xl p-4 mb-3 border" style={themeStyles.card}>
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-lg font-semibold flex-1" style={themeStyles.text}>
              {exercise.exercise?.name || 'Exercício'}
            </Text>
            <TouchableOpacity
              className="rounded-lg px-3 py-1"
              style={{ backgroundColor: '#ef444480' }}
              onPress={() => handleRemoveExercise(index, blockType)}
            >
              <Text className="font-semibold text-xs" style={{ color: '#ffffff' }}>🗑️</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Séries</Text>
              <TextInput
                className="border rounded px-3 py-2"
                style={{
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.primary + '80',
                  color: theme.colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
                placeholder="Ex: 3"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={exercise.sets?.toString() ?? ''}
                onChangeText={t => handleUpdateExercise(index, blockType, 'sets', t ? parseInt(t) : undefined)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Repetições</Text>
              <TextInput
                className="border rounded px-3 py-2"
                style={{
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.primary + '80',
                  color: theme.colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
                placeholder="Ex: 12"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={exercise.reps?.toString() ?? ''}
                onChangeText={t => handleUpdateExercise(index, blockType, 'reps', t ? parseInt(t) : undefined)}
              />
            </View>
          </View>
          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Duração (seg)</Text>
              <TextInput
                className="border rounded px-3 py-2"
                style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }}
                placeholder="Ex: 60"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={exercise.duration?.toString() ?? ''}
                onChangeText={t => handleUpdateExercise(index, blockType, 'duration', t ? parseInt(t) : undefined)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Descanso (seg)</Text>
              <TextInput
                className="border rounded px-3 py-2"
                style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }}
                placeholder="Ex: 45"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={exercise.restTime?.toString() ?? ''}
                onChangeText={t => handleUpdateExercise(index, blockType, 'restTime', t ? parseInt(t) : undefined)}
              />
            </View>
          </View>
          <View className="mb-2">
            <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Notas</Text>
            <TextInput
              className="border rounded px-3 py-2"
              style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }}
              placeholder="Ex: Foco em técnica"
              placeholderTextColor={theme.colors.textTertiary}
              value={exercise.notes ?? ''}
              onChangeText={t => handleUpdateExercise(index, blockType, 'notes', t)}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      ))}
      {exercises.length === 0 && (
        <Text className="text-center py-4" style={themeStyles.textSecondary}>Nenhum exercício adicionado ainda</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={themeStyles.bg}>
        <Text className="text-xl font-bold" style={themeStyles.text}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={themeStyles.bg}>
      <View className="px-6 pt-20 pb-20">
        <TouchableOpacity className="mb-6 flex-row items-center" onPress={() => router.back()} activeOpacity={0.7}>
          <View className="rounded-full w-10 h-10 items-center justify-center mr-3 border" style={themeStyles.cardSecondary}>
            <FontAwesome name="arrow-left" size={18} color={theme.colors.primary} />
          </View>
          <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>Voltar</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>Editar treino atribuído</Text>
        <Text className="mb-6" style={themeStyles.textSecondary}>
          Ajuste exercícios (adicione ou remova) conforme a necessidade do atleta
        </Text>

        <View className="mb-6">
          <Text className="font-semibold mb-2" style={themeStyles.text}>Nome do Treino *</Text>
          <TextInput
            className="border rounded-lg px-4 py-3"
            style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }}
            placeholder="Ex: Treino de Força - Pernas"
            placeholderTextColor={theme.colors.textTertiary}
            value={workoutName}
            onChangeText={setWorkoutName}
          />
        </View>
        <View className="mb-6">
          <Text className="font-semibold mb-2" style={themeStyles.text}>Descrição (opcional)</Text>
          <TextInput
            className="border rounded-lg px-4 py-3"
            style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }}
            placeholder="Descreva o treino..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            numberOfLines={3}
            value={workoutDescription}
            onChangeText={setWorkoutDescription}
          />
        </View>

        {renderBlock('🔥 Aquecimento', warmUpExercises, WorkoutBlock.WARM_UP, warmUpNotes, setWarmUpNotes)}
        {renderBlock('💪 Treino Principal', workExercises, WorkoutBlock.WORK, workNotes, setWorkNotes)}
        {renderBlock('🧘 Finalização', coolDownExercises, WorkoutBlock.COOL_DOWN, coolDownNotes, setCoolDownNotes)}

        <TouchableOpacity
          className="rounded-lg py-4 px-6 mt-6"
          style={{ backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
          onPress={handleSave}
        >
          <Text className="font-semibold text-center text-lg" style={{ color: '#ffffff' }}>💾 Salvar alterações</Text>
        </TouchableOpacity>

        <Modal
          visible={showExerciseModal}
          animationType="slide"
          transparent
          statusBarTranslucent
          navigationBarTranslucent
          presentationStyle="overFullScreen"
          onRequestClose={() => { setShowExerciseModal(false); setCurrentBlock(null); resetFilters(); }}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-6">
            <View className="rounded-3xl p-6 w-full max-h-[80%] min-h-[70%] border" style={themeStyles.card}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold" style={themeStyles.text}>Selecionar Exercício</Text>
                <TouchableOpacity onPress={() => { setShowExerciseModal(false); setCurrentBlock(null); resetFilters(); }}>
                  <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>Fechar</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                className="border rounded-lg px-4 py-2 mb-3"
                style={{ backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.border, color: theme.colors.text }}
                placeholder="Buscar exercício..."
                placeholderTextColor={theme.colors.textTertiary}
                value={searchExerciseText}
                onChangeText={setSearchExerciseText}
              />
              <View className="mb-3">
                <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>Tipo</Text>
                <View className="flex-row gap-2">
                  {(['warmup', 'work', 'cooldown'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: selectedExerciseType === type ? theme.colors.primary : theme.colors.backgroundTertiary }}
                      onPress={() => setSelectedExerciseType(selectedExerciseType === type ? null : type)}
                    >
                      <Text className="text-sm font-semibold" style={{ color: selectedExerciseType === type ? '#ffffff' : theme.colors.text }}>
                        {type === 'warmup' ? '🔥 Aquecimento' : type === 'work' ? '💪 Treino' : '🧘 Finalização'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View className="mb-3">
                <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>Grupo Muscular</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: selectedMuscleGroup === null ? theme.colors.primary : theme.colors.backgroundTertiary }}
                      onPress={() => setSelectedMuscleGroup(null)}
                    >
                      <Text className="text-sm font-semibold" style={{ color: selectedMuscleGroup === null ? '#ffffff' : theme.colors.text }}>Todos</Text>
                    </TouchableOpacity>
                    {getAllMuscleGroups().map(group => (
                      <TouchableOpacity
                        key={group}
                        className="px-4 py-2 rounded-lg"
                        style={{ backgroundColor: selectedMuscleGroup === group ? theme.colors.primary : theme.colors.backgroundTertiary }}
                        onPress={() => setSelectedMuscleGroup(selectedMuscleGroup === group ? null : group)}
                      >
                        <Text className="text-sm font-semibold" style={{ color: selectedMuscleGroup === group ? '#ffffff' : theme.colors.text }}>{group.charAt(0).toUpperCase() + group.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <ScrollView>
                {getFilteredExercises().length === 0 ? (
                  <Text className="text-center py-8" style={themeStyles.textSecondary}>Nenhum exercício encontrado</Text>
                ) : (
                  getFilteredExercises().map(exercise => (
                    <TouchableOpacity
                      key={exercise.id}
                      className="rounded-xl p-4 mb-3 border"
                      style={themeStyles.card}
                      onPress={() => { if (currentBlock) { handleAddExercise(exercise, currentBlock); resetFilters(); } }}
                    >
                      <Text className="text-lg font-semibold" style={themeStyles.text}>{exercise.name}</Text>
                      <Text className="text-sm mt-1" style={themeStyles.textSecondary}>{exercise.description}</Text>
                      <View className="flex-row flex-wrap gap-1 mt-2">
                        {exercise.muscleGroups?.map((g, idx) => (
                          <View key={idx} className="px-2 py-1 rounded border" style={{ backgroundColor: theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20', borderColor: theme.colors.primary + '60' }}>
                            <Text className="text-xs" style={{ color: theme.colors.primary }}>{g}</Text>
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          confirmText="OK"
          onConfirm={() => { setAlertVisible(false); alertOnConfirm?.(); }}
        />
      </View>
    </ScrollView>
  );
}
