import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const mockExercises: Exercise[] = [
    { id: '1', name: 'Agachamento', description: 'Exercício fundamental para desenvolvimento de força nas pernas e glúteos.', difficulty: 'beginner', muscleGroups: ['pernas', 'glúteos'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'Supino Reto', description: 'Exercício clássico para desenvolvimento do peitoral, tríceps e deltoides.', difficulty: 'intermediate', muscleGroups: ['peito', 'tríceps', 'ombros'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '3', name: 'Puxada Frontal', description: 'Exercício para desenvolvimento das costas e bíceps.', difficulty: 'intermediate', muscleGroups: ['costas', 'bíceps'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '4', name: 'Leg Press', description: 'Exercício para pernas realizado em máquina, ideal para iniciantes.', difficulty: 'beginner', muscleGroups: ['pernas', 'glúteos'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '5', name: 'Rosca Direta', description: 'Exercício isolado para desenvolvimento dos bíceps.', difficulty: 'beginner', muscleGroups: ['bíceps'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '6', name: 'Tríceps Pulley', description: 'Exercício isolado para desenvolvimento dos tríceps.', difficulty: 'beginner', muscleGroups: ['tríceps'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '7', name: 'Desenvolvimento com Halteres', description: 'Exercício para desenvolvimento dos ombros.', difficulty: 'intermediate', muscleGroups: ['ombros'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '8', name: 'Remada Curvada', description: 'Exercício para desenvolvimento das costas e bíceps.', difficulty: 'advanced', muscleGroups: ['costas', 'bíceps'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '9', name: 'Abdominal Crunch', description: 'Exercício básico para fortalecimento do core.', difficulty: 'beginner', muscleGroups: ['core', 'abdômen'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '10', name: 'Prancha', description: 'Exercício isométrico para fortalecimento do core.', difficulty: 'intermediate', muscleGroups: ['core', 'abdômen'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '11', name: 'Caminhada Leve', description: '5 minutos de caminhada', difficulty: 'beginner', muscleGroups: ['cardio'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '12', name: 'Corrida Leve', description: '5 minutos de corrida', difficulty: 'beginner', muscleGroups: ['cardio'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '13', name: 'Alongamento de Pernas', description: 'Alongamento estático', difficulty: 'beginner', muscleGroups: ['flexibilidade'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: '14', name: 'Alongamento de Peito', description: 'Alongamento estático', difficulty: 'beginner', muscleGroups: ['flexibilidade'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
];

export default function EditWorkoutScreen() {
    const router = useRouter();
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

    // NOVOS ESTADOS: Para carregar e filtrar exercícios
    const [allExercises, setAllExercises] = useState<Exercise[]>(mockExercises);
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
    const [selectedExerciseType, setSelectedExerciseType] = useState<'warmup' | 'work' | 'cooldown' | null>(null);
    const [searchExerciseText, setSearchExerciseText] = useState('');

    // PARTE 1: Carregar dados do treino quando a tela abrir
    useEffect(() => {
        const loadWorkout = async () => {
            try {
                // Buscar todos os treinos salvos
                const savedWorkoutsJson = await AsyncStorage.getItem('workout_templates');
                let savedWorkouts = [];

                if (savedWorkoutsJson) {
                    savedWorkouts = JSON.parse(savedWorkoutsJson);
                }

                // Encontrar o treino pelo ID
                const workout = savedWorkouts.find((w: any) => w.id === workoutIdString);

                if (workout) {
                    // Salvar o treino original para manter dados como createdAt, createdBy
                    setOriginalWorkout(workout);

                    // Preencher os campos com os dados do treino
                    setWorkoutName(workout.name || '');
                    setWorkoutDescription(workout.description || '');

                    // Separar os exercícios por bloco
                    const warmUpBlock = workout.blocks.find((b: WorkoutBlockData) => b.blockType === WorkoutBlock.WARM_UP);
                    const workBlock = workout.blocks.find((b: WorkoutBlockData) => b.blockType === WorkoutBlock.WORK);
                    const coolDownBlock = workout.blocks.find((b: WorkoutBlockData) => b.blockType === WorkoutBlock.COOL_DOWN);

                    // Preencher exercícios de cada bloco
                    setWarmUpExercises(warmUpBlock?.exercises || []);
                    setWorkExercises(workBlock?.exercises || []);
                    setCoolDownExercises(coolDownBlock?.exercises || []);

                    // Preencher notas de cada bloco
                    setWarmUpNotes(warmUpBlock?.notes || '');
                    setWorkNotes(workBlock?.notes || '');
                    setCoolDownNotes(coolDownBlock?.notes || '');
                } else {
                    Alert.alert('Erro', 'Treino não encontrado.');
                    router.back();
                }
            } catch (error) {
                console.error('Erro ao carregar treino:', error);
                Alert.alert('Erro', 'Não foi possível carregar o treino.');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (workoutIdString) {
            loadWorkout();
        }
    }, [workoutIdString]);

    // NOVA FUNÇÃO: Carregar exercícios do AsyncStorage
    const loadAllExercises = useCallback(async () => {
        try {
            const savedExerciseJson = await AsyncStorage.getItem('saved_exercises');
            let savedExercises: Exercise[] = [];

            if (savedExerciseJson) {
                savedExercises = JSON.parse(savedExerciseJson);
            }

            const combined = [...mockExercises, ...savedExercises];
            setAllExercises(combined);

            console.log('✅ Exercícios carregados no edit:', combined.length);
        } catch (error) {
            console.error('❌ Erro ao carregar exercícios:', error);
            setAllExercises(mockExercises);
        }
    }, []);

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
            Alert.alert('Erro', 'Por favor, preencha o nome do treino.');
            return;
        }

        if (!workoutDescription.trim()) {
            Alert.alert('Erro', 'Por favor, preencha a descrição do treino.');
            return;
        }

        try {
            // Buscar todos os treinos salvos
            const savedWorkoutsJson = await AsyncStorage.getItem('workout_templates');
            let savedWorkouts = [];

            if (savedWorkoutsJson) {
                savedWorkouts = JSON.parse(savedWorkoutsJson);
            }

            // Encontrar o índice do treino a ser atualizado
            const workoutIndex = savedWorkouts.findIndex((w: any) => w.id === workoutIdString);

            if (workoutIndex === -1) {
                Alert.alert('Erro', 'Treino não encontrado.');
                return;
            }

            // Criar os blocos atualizados
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

            // Criar objeto atualizado (mantém ID, createdAt, createdBy)
            const updatedWorkout = {
                ...originalWorkout, // Mantém dados originais
                name: workoutName.trim(),
                description: workoutDescription.trim(),
                blocks: blocks,
                updatedAt: new Date().toISOString(), // Atualiza data de modificação
            };

            // Substituir o treino antigo pelo atualizado
            savedWorkouts[workoutIndex] = updatedWorkout;

            // Salvar de volta no AsyncStorage
            await AsyncStorage.setItem(
                'workout_templates',
                JSON.stringify(savedWorkouts)
            );

            Alert.alert('Sucesso', 'Treino atualizado com sucesso!');
            router.back();
        } catch (error) {
            console.error('Erro ao atualizar treino:', error);
            Alert.alert('Erro', 'Não foi possível atualizar o treino.');
        }
    };

    // Mostrar loading enquanto carrega
    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-dark-950">
                <Text className="text-xl font-bold text-white">
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
                <Text className="text-xl font-bold text-white mb-3">
                    {title}
                </Text>

                {/* Campo de notas do bloco */}
                <View className="mb-3">
                    <Text className="text-neutral-300 font-semibold mb-2">
                        Notas do Bloco
                    </Text>
                    <TextInput
                        className="bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white"
                        placeholder="Ex: Aquecimento de 5 minutos"
                        placeholderTextColor="#737373"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={2}
                    />
                </View>

                {/* Botão para adicionar exercício */}
                <TouchableOpacity
                    className="bg-primary-500 rounded-lg py-3 px-4 mb-3"
                    onPress={() => {
                        setCurrentBlock(blockType);
                        setShowExerciseModal(true);
                    }}
                >
                    <Text className="text-white font-semibold text-center">
                        ➕ Adicionar Exercício
                    </Text>
                </TouchableOpacity>

                {/* Lista de exercícios do bloco */}
                {exercises.map((exercise, index) => (
                    <View
                        key={index}
                        className="bg-dark-900 rounded-xl p-4 mb-3 border border-dark-700"
                    >
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-lg font-semibold text-white flex-1">
                                {exercise.exercise?.name || 'Exercício'}
                            </Text>
                            <TouchableOpacity
                                className="bg-red-500/80 rounded-lg px-3 py-1"
                                onPress={() => handleRemoveExercise(index, blockType)}
                            >
                                <Text className="text-white font-semibold text-xs">
                                    🗑️
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Campos para configurar o exercício */}
                        <View className="flex-row gap-2 mb-2">
                            <View className="flex-1">
                                <Text className="text-neutral-300 text-xs mb-1">Séries</Text>
                                <TextInput
                                    className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white"
                                    placeholder="Ex: 3"
                                    placeholderTextColor="#737373"
                                    keyboardType="numeric"
                                    value={exercise.sets?.toString() || ''}
                                    onChangeText={(text) => {
                                        const value = text ? parseInt(text) : undefined;
                                        handleUpdateExercise(index, blockType, 'sets', value);
                                    }}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-neutral-300 text-xs mb-1">Repetições</Text>
                                <TextInput
                                    className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white"
                                    placeholder="Ex: 12"
                                    placeholderTextColor="#737373"
                                    keyboardType="numeric"
                                    value={exercise.reps?.toString() || ''}
                                    onChangeText={(text) => {
                                        const value = text ? parseInt(text) : undefined;
                                        handleUpdateExercise(index, blockType, 'reps', value);
                                    }}
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-2 mb-2">
                            <View className="flex-1">
                                <Text className="text-neutral-300 text-xs mb-1">Duração (seg)</Text>
                                <TextInput
                                    className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white"
                                    placeholder="Ex: 60"
                                    placeholderTextColor="#737373"
                                    keyboardType="numeric"
                                    value={exercise.duration?.toString() || ''}
                                    onChangeText={(text) => {
                                        const value = text ? parseInt(text) : undefined;
                                        handleUpdateExercise(index, blockType, 'duration', value);
                                    }}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-neutral-700 text-xs mb-1">Descanso (seg)</Text>
                                <TextInput
                                    className="bg-white border border-neutral-200 rounded px-3 py-2 text-neutral-900"
                                    placeholder="Ex: 45"
                                    keyboardType="numeric"
                                    value={exercise.restTime?.toString() || ''}
                                    onChangeText={(text) => {
                                        const value = text ? parseInt(text) : undefined;
                                        handleUpdateExercise(index, blockType, 'restTime', value);
                                    }}
                                />
                            </View>
                        </View>

                        <View className="mb-2">
                            <Text className="text-neutral-300 text-xs mb-1">Notas</Text>
                            <TextInput
                                className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white"
                                placeholder="Ex: Foco em técnica"
                                placeholderTextColor="#737373"
                                value={exercise.notes || ''}
                                onChangeText={(text) => {
                                    handleUpdateExercise(index, blockType, 'notes', text);
                                }}
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    </View>
                ))}

                {exercises.length === 0 && (
                    <Text className="text-neutral-400 text-center py-4">
                        Nenhum exercício adicionado ainda
                    </Text>
                )}
            </View>
        );
    };

    // PARTE 7: JSX principal
    return (
        <ScrollView className="flex-1 bg-dark-950">
            <View className="px-6 pt-20 pb-20">
                {/* Header com botão voltar melhorado */}
                <TouchableOpacity
                    className="mb-6 flex-row items-center"
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <View className="bg-dark-800 border border-dark-700 rounded-full w-10 h-10 items-center justify-center mr-3">
                        <FontAwesome name="arrow-left" size={18} color="#fb923c" />
                    </View>
                    <Text className="text-primary-400 font-semibold text-lg">
                        Voltar
                    </Text>
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-white mb-2">
                    Editar Treino
                </Text>
                <Text className="text-neutral-400 mb-6">
                    Atualize as informações do treino
                </Text>

                {/* Formulário básico */}
                <View className="mb-6">
                    <Text className="text-neutral-300 font-semibold mb-2">
                        Nome do Treino *
                    </Text>
                    <TextInput
                        className="bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white"
                        placeholder="Ex: Treino de Força - Pernas"
                        placeholderTextColor="#737373"
                        value={workoutName}
                        onChangeText={setWorkoutName}
                    />
                </View>

                <View className="mb-6">
                    <Text className="text-neutral-300 font-semibold mb-2">
                        Descrição *
                    </Text>
                    <TextInput
                        className="bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white"
                        placeholder="Descreva o treino..."
                        placeholderTextColor="#737373"
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
                    className="bg-primary-500 rounded-lg py-4 px-6 mt-6"
                    style={{
                      shadowColor: '#fb923c',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                    onPress={handleUpdateWorkout}
                >
                    <Text className="text-white font-semibold text-center text-lg">
                        💾 Salvar Alterações
                    </Text>
                </TouchableOpacity>

                {/* Modal para seleção de exercícios - ATUALIZADO COM FILTROS */}
                <Modal
                    visible={showExerciseModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => {
                        setShowExerciseModal(false);
                        setCurrentBlock(null);
                        resetFilters();
                    }}
                >
                    <View className="flex-1 bg-black/50 justify-center items-center p-6">
                        <View className="bg-dark-900 rounded-3xl p-6 w-full max-h-[80%] min-h-[70%]">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-2xl font-bold text-white">
                                    Selecionar Exercício
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowExerciseModal(false);
                                        setCurrentBlock(null);
                                        resetFilters();
                                    }}
                                >
                                    <Text className="text-primary-400 font-semibold text-lg">
                                        Fechar
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white mb-3"
                                placeholder="Buscar exercício..."
                                placeholderTextColor="#737373"
                                value={searchExerciseText}
                                onChangeText={setSearchExerciseText}
                            />

                            {/* FILTRO POR TIPO DE EXERCÍCIO */}
                            <View className="mb-3">
                                <Text className="text-sm font-semibold text-neutral-300 mb-2">
                                    Tipo de Exercício
                                </Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        className={`px-4 py-2 rounded-lg ${
                                            selectedExerciseType === 'warmup'
                                                ? 'bg-primary-500'
                                                : 'bg-dark-800'
                                        }`}
                                        onPress={() => {
                                            setSelectedExerciseType(
                                                selectedExerciseType === 'warmup' ? null : 'warmup'
                                            );
                                        }}
                                    >
                                        <Text className={`text-sm font-semibold ${
                                            selectedExerciseType === 'warmup'
                                                ? 'text-white'
                                                : 'text-neutral-300'
                                        }`}>
                                            🔥 Aquecimento
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className={`px-4 py-2 rounded-lg ${
                                            selectedExerciseType === 'work'
                                                ? 'bg-primary-500'
                                                : 'bg-dark-800'
                                        }`}
                                        onPress={() => {
                                            setSelectedExerciseType(
                                                selectedExerciseType === 'work' ? null : 'work'
                                            );
                                        }}
                                    >
                                        <Text className={`text-sm font-semibold ${
                                            selectedExerciseType === 'work'
                                                ? 'text-white'
                                                : 'text-neutral-300'
                                        }`}>
                                            💪 Treino
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className={`px-4 py-2 rounded-lg ${
                                            selectedExerciseType === 'cooldown'
                                                ? 'bg-primary-500'
                                                : 'bg-dark-800'
                                        }`}
                                        onPress={() => {
                                            setSelectedExerciseType(
                                                selectedExerciseType === 'cooldown' ? null : 'cooldown'
                                            );
                                        }}
                                    >
                                        <Text className={`text-sm font-semibold ${
                                            selectedExerciseType === 'cooldown'
                                                ? 'text-white'
                                                : 'text-neutral-300'
                                        }`}>
                                            🧘 Finalização
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* FILTRO POR GRUPO MUSCULAR */}
                            <View className="mb-3">
                                <Text className="text-sm font-semibold text-neutral-300 mb-2">
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
                                            className={`px-4 py-2 rounded-lg ${
                                                selectedMuscleGroup === null
                                                    ? 'bg-primary-500'
                                                    : 'bg-dark-800'
                                            }`}
                                            onPress={() => setSelectedMuscleGroup(null)}
                                        >
                                            <Text className={`text-sm font-semibold ${
                                                selectedMuscleGroup === null
                                                    ? 'text-white'
                                                    : 'text-neutral-300'
                                            }`}>
                                                Todos
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Lista de grupos musculares */}
                                        {getAllMuscleGroups().map((group) => (
                                            <TouchableOpacity
                                                key={group}
                                                className={`px-4 py-2 rounded-lg ${
                                                    selectedMuscleGroup === group
                                                        ? 'bg-primary-500'
                                                        : 'bg-dark-800'
                                                }`}
                                                onPress={() => {
                                                    setSelectedMuscleGroup(
                                                        selectedMuscleGroup === group ? null : group
                                                    );
                                                }}
                                            >
                                                <Text className={`text-sm font-semibold ${
                                                    selectedMuscleGroup === group
                                                        ? 'text-white'
                                                        : 'text-neutral-300'
                                                }`}>
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
                                    <Text className="text-neutral-500 text-center py-8">
                                        Nenhum exercício encontrado
                                    </Text>
                                ) : (
                                    getFilteredExercises().map((exercise) => (
                                        <TouchableOpacity
                                            key={exercise.id}
                                            className="bg-dark-900 rounded-xl p-4 mb-3 border border-dark-700"
                                            onPress={() => {
                                                if (currentBlock) {
                                                    handleAddExercise(exercise, currentBlock);
                                                    resetFilters();
                                                }
                                            }}
                                        >
                                            <Text className="text-lg font-semibold text-white">
                                                {exercise.name}
                                            </Text>
                                            <Text className="text-neutral-400 text-sm mt-1">
                                                {exercise.description}
                                            </Text>
                                            {/* Mostrar grupos musculares */}
                                            <View className="flex-row flex-wrap gap-1 mt-2">
                                                {exercise.muscleGroups?.map((group, idx) => (
                                                    <View
                                                        key={idx}
                                                        className="bg-primary-500/20 border border-primary-500/30 px-2 py-1 rounded"
                                                    >
                                                        <Text className="text-xs text-primary-400">
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
            </View>
        </ScrollView>
    );
}
