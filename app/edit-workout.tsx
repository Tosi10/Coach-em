import { CustomAlert } from '@/components/CustomAlert';
import { WorkoutPrescriptionEditor } from '@/components/WorkoutPrescriptionEditor';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { DEFAULT_EXERCISES, mergeDefaultExercisesWithCoachSaved } from '@/src/data/defaultExercises';
import { listExercisesByCoachId } from '@/src/services/exercises.service';
import { getWorkoutTemplateById, updateWorkoutTemplate } from '@/src/services/workoutTemplates.service';
import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const mockExercises: Exercise[] = DEFAULT_EXERCISES;

export default function EditWorkoutScreen() {
    const router = useRouter();
    const { user } = useAuthContext();
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);
    const { workoutId } = useLocalSearchParams();

    // Garantir que workoutId seja sempre string
    const workoutIdString = Array.isArray(workoutId) ? workoutId[0] : workoutId;
    
    // Estados do formulário básico
    const [workoutName, setWorkoutName] = useState('');
    const [workoutDescription, setWorkoutDescription] = useState('');

    // Estados para os 3 blocos do treino
    const [warmUpExercises, setWarmUpExercises] = useState<WorkoutExercise[]>([]);
    const [workExercises, setWorkExercises] = useState<WorkoutExercise[]>([]);
    const [coolDownExercises, setCoolDownExercises] = useState<WorkoutExercise[]>([]);

    // Estados para notas dos blocos
    const [warmUpNotes, setWarmUpNotes] = useState('');
    const [workNotes, setWorkNotes] = useState('');
    const [coolDownNotes, setCoolDownNotes] = useState('');

    // Estados para o modal de seleção de exercícios
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [currentBlock, setCurrentBlock] = useState<WorkoutBlock | null>(null);

    // Estado para carregamento
    const [loading, setLoading] = useState(true);

    // Estado para armazenar o treino original (para manter createdAt, createdBy, etc)
    const [originalWorkout, setOriginalWorkout] = useState<any>(null);

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

    // NOVOS ESTADOS: Para carregar e filtrar exercícios
    const [allExercises, setAllExercises] = useState<Exercise[]>(mockExercises);
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
    const [selectedExerciseType, setSelectedExerciseType] = useState<'warmup' | 'work' | 'cooldown' | null>(null);
    const [searchExerciseText, setSearchExerciseText] = useState('');

    // PARTE 1: Carregar dados do treino do Firestore
    useEffect(() => {
        const loadWorkout = async () => {
            try {
                if (!workoutIdString) return;
                const workout = await getWorkoutTemplateById(workoutIdString);

                if (workout) {
                    setOriginalWorkout(workout);
                    setWorkoutName(workout.name || '');
                    setWorkoutDescription(workout.description || '');

                    const warmUpBlock = workout.blocks.find((b: WorkoutBlockData) => b.blockType === WorkoutBlock.WARM_UP);
                    const workBlock = workout.blocks.find((b: WorkoutBlockData) => b.blockType === WorkoutBlock.WORK);
                    const coolDownBlock = workout.blocks.find((b: WorkoutBlockData) => b.blockType === WorkoutBlock.COOL_DOWN);

                    setWarmUpExercises(warmUpBlock?.exercises || []);
                    setWorkExercises(workBlock?.exercises || []);
                    setCoolDownExercises(coolDownBlock?.exercises || []);

                    setWarmUpNotes(warmUpBlock?.notes || '');
                    setWorkNotes(workBlock?.notes || '');
                    setCoolDownNotes(coolDownBlock?.notes || '');
                } else {
                    showAlert('Erro', 'Treino não encontrado.', 'error', () => router.back());
                }
            } catch (error) {
                console.error('Erro ao carregar treino:', error);
                showAlert('Erro', 'Não foi possível carregar o treino.', 'error', () => router.back());
            } finally {
                setLoading(false);
            }
        };

        if (workoutIdString) {
            loadWorkout();
        }
    }, [workoutIdString]);

    const loadAllExercises = useCallback(async () => {
        try {
            const coachId = user?.id;
            const savedExercises: Exercise[] = coachId
                ? await listExercisesByCoachId(coachId)
                : [];
            const combined = mergeDefaultExercisesWithCoachSaved(
                mockExercises,
                savedExercises,
                coachId ?? undefined
            );
            setAllExercises(combined);
        } catch (error) {
            console.error('Erro ao carregar exercícios:', error);
            setAllExercises(mockExercises);
        }
    }, [user?.id]);

    // Carregar exercícios quando a tela abrir
    useEffect(() => {
        loadAllExercises();
    }, [loadAllExercises]);

    // FUNÇÃO: Determinar tipo de exercício
    const getExerciseType = (exercise: Exercise): 'warmup' | 'work' | 'cooldown' => {
        const groups = exercise.muscleGroups || [];

        const hasCardio = groups.some(g =>
            g.toLowerCase().includes('cardio') ||
            g.toLowerCase().includes('flexibilidade')
        );

        if (hasCardio) {
            if (groups.some(g => g.toLowerCase().includes('flexibilidade'))) {
                return 'cooldown';
            }
            return 'warmup';
        }

        return 'work';
    };

    // FUNÇÃO: Filtrar exercícios
    const getFilteredExercises = (): Exercise[] => {
        let filtered = allExercises;

        if (searchExerciseText.trim()) {
            const searchLower = searchExerciseText.toLowerCase();
            filtered = filtered.filter(ex =>
                ex.name.toLowerCase().includes(searchLower) ||
                ex.description?.toLowerCase().includes(searchLower)
            );
        }

        if (selectedMuscleGroup) {
            filtered = filtered.filter(ex =>
                ex.muscleGroups?.some(group =>
                    group.toLowerCase() === selectedMuscleGroup.toLowerCase()
                )
            );
        }

        if (selectedExerciseType) {
            filtered = filtered.filter(ex => {
                const exerciseType = getExerciseType(ex);
                return exerciseType === selectedExerciseType;
            });
        }

        return filtered;
    };

    // FUNÇÃO: Obter todos os grupos musculares únicos
    const getAllMuscleGroups = (): string[] => {
        const groupsSet = new Set<string>();

        allExercises.forEach(ex => {
            ex.muscleGroups?.forEach(group => {
                groupsSet.add(group.toLowerCase());
            });
        });

        return Array.from(groupsSet).sort();
    };

    // FUNÇÃO: Limpar filtros
    const resetFilters = () => {
        setSelectedMuscleGroup(null);
        setSelectedExerciseType(null);
        setSearchExerciseText('');
    };

    // PARTE 2: Função para adicionar exercício a um bloco
    const handleAddExercise = (exercise: Exercise, blockType: WorkoutBlock) => {
        const newExercise: WorkoutExercise = {
            exerciseId: exercise.id,
            exercise: exercise,
            sets: undefined,
            reps: undefined,
            duration: undefined,
            restTime: undefined,
            order: 0,
            notes: '',
        };

        if (blockType === WorkoutBlock.WARM_UP) {
            newExercise.order = warmUpExercises.length + 1;
            setWarmUpExercises([...warmUpExercises, newExercise]);
        } else if (blockType === WorkoutBlock.WORK) {
            newExercise.order = workExercises.length + 1;
            setWorkExercises([...workExercises, newExercise]);
        } else if (blockType === WorkoutBlock.COOL_DOWN) {
            newExercise.order = coolDownExercises.length + 1;
            setCoolDownExercises([...coolDownExercises, newExercise]);
        }

        setShowExerciseModal(false);
        setCurrentBlock(null);
    };

    // PARTE 3: Função para remover exercício de um bloco
    const handleRemoveExercise = (index: number, blockType: WorkoutBlock) => {
        if (blockType === WorkoutBlock.WARM_UP) {
            const updated = warmUpExercises.filter((_, i) => i !== index);
            // Reordenar os exercícios
            updated.forEach((ex, i) => {
                ex.order = i + 1;
            });
            setWarmUpExercises(updated);
        } else if (blockType === WorkoutBlock.WORK) {
            const updated = workExercises.filter((_, i) => i !== index);
            updated.forEach((ex, i) => {
                ex.order = i + 1;
            });
            setWorkExercises(updated);
        } else if (blockType === WorkoutBlock.COOL_DOWN) {
            const updated = coolDownExercises.filter((_, i) => i !== index);
            updated.forEach((ex, i) => {
                ex.order = i + 1;
            });
            setCoolDownExercises(updated);
        }
    };

    // PARTE 4: Função para atualizar um exercício em um bloco
    const handleUpdateExercise = (index: number, blockType: WorkoutBlock, field: string, value: any) => {
        if (blockType === WorkoutBlock.WARM_UP) {
            const updated = [...warmUpExercises];
            (updated[index] as any)[field] = value;
            setWarmUpExercises(updated);
        } else if (blockType === WorkoutBlock.WORK) {
            const updated = [...workExercises];
            (updated[index] as any)[field] = value;
            setWorkExercises(updated);
        } else if (blockType === WorkoutBlock.COOL_DOWN) {
            const updated = [...coolDownExercises];
            (updated[index] as any)[field] = value;
            setCoolDownExercises(updated);
        }
    };

    // PARTE 5: Função para salvar as alterações
    const handleUpdateWorkout = async () => {
        // Validação básica
        if (!workoutName.trim()) {
            showAlert('Erro', 'Por favor, preencha o nome do treino.', 'error');
            return;
        }

        // Descrição é opcional, não precisa validar
        if (workExercises.length === 0) {
            showAlert('Erro', 'Nova regra: adicione pelo menos 1 exercício no bloco Principal.', 'error');
            return;
        }

        try {
            const blocks: WorkoutBlockData[] = [
                {
                    blockType: WorkoutBlock.WARM_UP,
                    exercises: warmUpExercises,
                    notes: warmUpNotes,
                },
                {
                    blockType: WorkoutBlock.WORK,
                    exercises: workExercises,
                    notes: workNotes,
                },
                {
                    blockType: WorkoutBlock.COOL_DOWN,
                    exercises: coolDownExercises,
                    notes: coolDownNotes,
                },
            ];

            await updateWorkoutTemplate(workoutIdString!, {
                name: workoutName.trim(),
                description: workoutDescription.trim(),
                blocks,
            });

            showAlert('Sucesso', 'Treino atualizado com sucesso!', 'success', () => {
                router.back();
            });
        } catch (error) {
            console.error('Erro ao atualizar treino:', error);
            showAlert('Erro', 'Não foi possível atualizar o treino.', 'error');
        }
    };

    // Mostrar loading enquanto carrega
    if (loading) {
        return (
            <View className="flex-1 items-center justify-center" style={themeStyles.bg}>
                <Text className="text-xl font-bold" style={themeStyles.text}>
                    Carregando...
                </Text>
            </View>
        );
    }

    // PARTE 6: Componente para renderizar um bloco de exercícios
    const renderBlock = (
        title: string,
        exercises: WorkoutExercise[],
        blockType: WorkoutBlock,
        notes: string,
        setNotes: (notes: string) => void,
        setExercises: (exercises: WorkoutExercise[]) => void
    ) => {
        return (
            <View className="mb-6">
                <Text className="text-xl font-bold mb-3" style={themeStyles.text}>
                    {title}
                </Text>

                {/* Campo de notas do bloco */}
                <View className="mb-3">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Notas do Bloco
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Ex: Aquecimento de 5 minutos"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={2}
                    />
                </View>

                {/* Botão para adicionar exercício */}
                <TouchableOpacity
                    className="rounded-lg py-3 px-4 mb-3"
                    style={{ backgroundColor: theme.colors.primary }}
                    onPress={() => {
                        setCurrentBlock(blockType);
                        setShowExerciseModal(true);
                    }}
                >
                    <Text className="font-semibold text-center" style={{ color: '#ffffff' }}>
                        ➕ Adicionar Exercício
                    </Text>
                </TouchableOpacity>

                {/* Lista de exercícios do bloco */}
                {exercises.map((exercise, index) => (
                    <View
                        key={index}
                        className="rounded-xl p-4 mb-3 border"
                        style={themeStyles.card}
                    >
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-lg font-semibold flex-1" style={themeStyles.text}>
                                {exercise.exercise?.name || 'Exercício'}
                            </Text>
                            <TouchableOpacity
                                className="rounded-lg px-3 py-1"
                                style={{ backgroundColor: '#ef4444' + '80' }}
                                onPress={() => handleRemoveExercise(index, blockType)}
                            >
                                <Text className="font-semibold text-xs" style={{ color: '#ffffff' }}>
                                    🗑️
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <WorkoutPrescriptionEditor
                            value={exercise}
                            onChange={(updates) => {
                                const updated = { ...exercise, ...updates };
                                if (blockType === WorkoutBlock.WARM_UP) {
                                    const list = [...warmUpExercises];
                                    list[index] = updated;
                                    setWarmUpExercises(list);
                                } else if (blockType === WorkoutBlock.WORK) {
                                    const list = [...workExercises];
                                    list[index] = updated;
                                    setWorkExercises(list);
                                } else {
                                    const list = [...coolDownExercises];
                                    list[index] = updated;
                                    setCoolDownExercises(list);
                                }
                            }}
                        />
                    </View>
                ))}

                {exercises.length === 0 && (
                    <Text className="text-center py-4" style={themeStyles.textSecondary}>
                        Nenhum exercício adicionado ainda
                    </Text>
                )}
            </View>
        );
    };

    // PARTE 7: JSX principal
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

                <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
                    Editar Treino
                </Text>
                <Text className="mb-6" style={themeStyles.textSecondary}>
                    Atualize as informações do treino
                </Text>

                {/* Formulário básico */}
                <View className="mb-6">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Nome do Treino *
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Ex: Treino de Força - Pernas"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={workoutName}
                        onChangeText={setWorkoutName}
                    />
                </View>

                <View className="mb-6">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Descrição (opcional)
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Descreva o treino..."
                        placeholderTextColor={theme.colors.textTertiary}
                        multiline
                        numberOfLines={3}
                        value={workoutDescription}
                        onChangeText={setWorkoutDescription}
                    />
                </View>

                {/* Renderizar os 3 blocos */}
                {renderBlock(
                    '🔥 Aquecimento',
                    warmUpExercises,
                    WorkoutBlock.WARM_UP,
                    warmUpNotes,
                    setWarmUpNotes,
                    setWarmUpExercises
                )}

                {renderBlock(
                    '💪 Treino Principal',
                    workExercises,
                    WorkoutBlock.WORK,
                    workNotes,
                    setWorkNotes,
                    setWorkExercises
                )}

                {renderBlock(
                    '🧘 Finalização',
                    coolDownExercises,
                    WorkoutBlock.COOL_DOWN,
                    coolDownNotes,
                    setCoolDownNotes,
                    setCoolDownExercises
                )}

                {/* Botão Salvar */}
                <TouchableOpacity
                    className="rounded-lg py-4 px-6 mt-6"
                    style={{
                      backgroundColor: theme.colors.primary,
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                    onPress={handleUpdateWorkout}
                >
                    <Text className="font-semibold text-center text-lg" style={{ color: '#ffffff' }}>
                        💾 Salvar Alterações
                    </Text>
                </TouchableOpacity>

                {/* Modal para seleção de exercícios - ATUALIZADO COM FILTROS */}
                <Modal
                    visible={showExerciseModal}
                    animationType="slide"
                    transparent={true}
                    statusBarTranslucent
                    navigationBarTranslucent
                    presentationStyle="overFullScreen"
                    onRequestClose={() => {
                        setShowExerciseModal(false);
                        setCurrentBlock(null);
                        resetFilters();
                    }}
                >
                    <View className="flex-1 bg-black/50 justify-center items-center p-6">
                        <View className="rounded-3xl p-6 w-full max-h-[80%] min-h-[70%] border" style={themeStyles.card}>
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-2xl font-bold" style={themeStyles.text}>
                                    Selecionar Exercício
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowExerciseModal(false);
                                        setCurrentBlock(null);
                                        resetFilters();
                                    }}
                                >
                                    <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>
                                        Fechar
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                className="border rounded-lg px-4 py-2 mb-3"
                                style={{
                                  backgroundColor: theme.colors.backgroundTertiary,
                                  borderColor: theme.colors.border,
                                  color: theme.colors.text,
                                }}
                                placeholder="Buscar exercício..."
                                placeholderTextColor={theme.colors.textTertiary}
                                value={searchExerciseText}
                                onChangeText={setSearchExerciseText}
                            />

                            {/* FILTRO POR TIPO DE EXERCÍCIO */}
                            <View className="mb-3">
                                <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                                    Tipo de Exercício
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
                                          backgroundColor: selectedExerciseType === 'warmup'
                                            ? theme.colors.primary
                                            : theme.colors.backgroundTertiary,
                                        }}
                                        onPress={() => {
                                            setSelectedExerciseType(
                                                selectedExerciseType === 'warmup' ? null : 'warmup'
                                            );
                                        }}
                                    >
                                        <Text className="text-sm font-semibold" style={{
                                          color: selectedExerciseType === 'warmup'
                                            ? '#ffffff'
                                            : theme.colors.text
                                        }}>
                                            🔥 Aquecimento
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className="px-4 py-2 rounded-lg"
                                        style={{
                                          backgroundColor: selectedExerciseType === 'work'
                                            ? theme.colors.primary
                                            : theme.colors.backgroundTertiary,
                                        }}
                                        onPress={() => {
                                            setSelectedExerciseType(
                                                selectedExerciseType === 'work' ? null : 'work'
                                            );
                                        }}
                                    >
                                        <Text className="text-sm font-semibold" style={{
                                          color: selectedExerciseType === 'work'
                                            ? '#ffffff'
                                            : theme.colors.text
                                        }}>
                                            💪 Treino
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className="px-4 py-2 rounded-lg"
                                        style={{
                                          backgroundColor: selectedExerciseType === 'cooldown'
                                            ? theme.colors.primary
                                            : theme.colors.backgroundTertiary,
                                        }}
                                        onPress={() => {
                                            setSelectedExerciseType(
                                                selectedExerciseType === 'cooldown' ? null : 'cooldown'
                                            );
                                        }}
                                    >
                                        <Text className="text-sm font-semibold" style={{
                                          color: selectedExerciseType === 'cooldown'
                                            ? '#ffffff'
                                            : theme.colors.text
                                        }}>
                                            🧘 Finalização
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                </ScrollView>
                            </View>

                            {/* FILTRO POR GRUPO MUSCULAR */}
                            <View className="mb-3">
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

                            {/* LISTA DE EXERCÍCIOS FILTRADOS */}
                            <ScrollView>
                                {getFilteredExercises().length === 0 ? (
                                    <Text className="text-center py-8" style={themeStyles.textSecondary}>
                                        Nenhum exercício encontrado
                                    </Text>
                                ) : (
                                    getFilteredExercises().map((exercise) => (
                                        <TouchableOpacity
                                            key={exercise.id}
                                            className="rounded-xl p-4 mb-3 border"
                                            style={themeStyles.card}
                                            onPress={() => {
                                                if (currentBlock) {
                                                    handleAddExercise(exercise, currentBlock);
                                                    resetFilters();
                                                }
                                            }}
                                        >
                                            <Text className="text-lg font-semibold" style={themeStyles.text}>
                                                {exercise.name}
                                            </Text>
                                            <Text className="text-sm mt-1" style={themeStyles.textSecondary}>
                                                {exercise.description}
                                            </Text>
                                            {/* Mostrar grupos musculares */}
                                            <View className="flex-row flex-wrap gap-1 mt-2">
                                                {exercise.muscleGroups?.map((group, idx) => (
                                                    <View
                                                        key={idx}
                                                        className="px-2 py-1 rounded border"
                                                        style={{
                                                          backgroundColor: theme.mode === 'dark' 
                                                            ? theme.colors.primary + '30'
                                                            : theme.colors.primary + '20',
                                                          borderColor: theme.colors.primary + '60',
                                                        }}
                                                    >
                                                        <Text className="text-xs" style={{ color: theme.colors.primary }}>
                                                            {group}
                                                        </Text>
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

                {/* Custom Alert */}
                <CustomAlert
                    visible={alertVisible}
                    title={alertTitle}
                    message={alertMessage}
                    type={alertType}
                    confirmText="OK"
                    onConfirm={() => {
                        setAlertVisible(false);
                        alertOnConfirm?.();
                    }}
                />
            </View>
        </ScrollView>
    );
}
