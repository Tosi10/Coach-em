/**
 * TELA DE CRIAÇÃO DE TREINO
 * 
 * Esta tela permite ao treinador criar um novo treino completo
 * com os 3 blocos obrigatórios: Aquecimento, Principal e Finalização.
 * 
 * ESTRUTURA:
 * 1. Formulário básico (nome, descrição)
 * 2. Seção para cada bloco (Warm-up, Work, Cool Down)
 * 3. Para cada bloco: adicionar exercícios da biblioteca
 * 4. Para cada exercício: configurar séries, repetições, duração, descanso
 * 5. Botão de salvar
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Exercícios mockados (mesmos da biblioteca de exercícios)
// TODO: Depois vamos buscar da biblioteca real
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

export default function CreateWorkoutScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);

    // Estado para o formulário básico
    const [workoutName, setWorkoutName] = useState('');
    const [workoutDescription, setWorkoutDescription] = useState('');

    // Estado para os 3 blocos do treino
    // Cada bloco tem um array de exercícios
    const [warmUpExercises, setWarmUpExercises] = useState<WorkoutExercise[]>([]);
    const [workExercises, setWorkExercises] = useState<WorkoutExercise[]>([]);
    const [coolDownExercises, setCoolDownExercises] = useState<WorkoutExercise[]>([]);

    // Estado para controlar qual bloco está sendo editado (para seleção de exercícios)
    const [selectingForBlock, setSelectingForBlock] = useState<WorkoutBlock | null>(null);

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
        setAlertOnConfirm(() => onConfirm ?? null);
        setAlertVisible(true);
    };

    const loadAllExercises = useCallback(async () => {
        try {
            const savedExerciseJson = await AsyncStorage.getItem('saved_exercises');
            let savedExercises: Exercise[] = [];

            if (savedExerciseJson) {
                savedExercises = JSON.parse(savedExerciseJson);
            }

            const combined = [...mockExercises, ...savedExercises];

            setAllExercises(combined);

            console.log('Exercícios carregados:', combined.length);
        } catch (error) {
            console.error('Erro ao carregar exercícios:', error);

            setAllExercises(mockExercises);
        }
    }, []);

    useEffect(() => {
        loadAllExercises();
    }, [loadAllExercises]);

    const getExerciseType = (exercise: Exercise): 'warmup' | 'work' | 'cooldown' => {
        const groups = exercise.muscleGroups || [];

        const hasCardio = groups.some(g =>
            g.toLowerCase().includes('cardio') ||
            g.toLowerCase().includes('flexibilidade')
        );

        if(hasCardio) {
            if(groups.some(g => g.toLowerCase().includes('flexibilidade'))) {
                return 'cooldown';
            }

            return 'warmup';
        }

        return 'work';
    };

    const getFilteredExercises = (): Exercise[] => {
        let filtered = allExercises;

        if(searchExerciseText.trim()) {
            const searchLower = searchExerciseText.toLowerCase();
            filtered = filtered.filter(ex =>
                ex.name.toLowerCase().includes(searchLower) ||
                ex.description?.toLowerCase().includes(searchLower)
            );
        }

        if(selectedMuscleGroup) {
            filtered = filtered.filter(ex => 
                ex.muscleGroups?.some(group =>
                    group.toLowerCase() === selectedMuscleGroup.toLowerCase()
                )
            );
        }

        if(selectedExerciseType) {
            filtered = filtered.filter(ex => {
                const exerciseType = getExerciseType(ex);
                return exerciseType === selectedExerciseType;
            });
        }

        return filtered;
    };


    const getAllMuscleGroups = (): string[] => {
        const groupsSet = new Set<string>();

        allExercises.forEach(ex => {
            ex.muscleGroups?.forEach(group => {
                groupsSet.add(group.toLowerCase());
            });
        });

        return Array.from(groupsSet).sort();
    };

    const resetFilters = () => {
        setSelectedMuscleGroup(null);
        setSelectedExerciseType(null);
        setSearchExerciseText('');
    };

    

    /**
     * FUNÇÃO: handleSaveWorkout
     * 
     * O que faz: Salva o treino criado
     * 
     * Passos:
     * 1. Valida se o nome foi preenchido
     * 2. Valida se pelo menos um exercício foi adicionado em cada bloco
     * 3. Monta a estrutura completa do treino
     * 4. Salva (por enquanto mostra um alert, depois salvará de verdade)
     * 5. Volta para a tela anterior
     */
    const handleSaveWorkout = async() => {
        // Validação básica
        if (!workoutName.trim()) {
            showAlert('Erro', 'Por favor, preencha o nome do treino.', 'error');
            return;
        }

        // Validação: cada bloco deve ter pelo menos 1 exercício
        if (warmUpExercises.length === 0 || workExercises.length === 0 || coolDownExercises.length === 0) {
            showAlert('Erro', 'Cada bloco deve ter pelo menos 1 exercício.', 'error');
            return;
        }

        // Montar a estrutura completa do treino
        const newWorkout = {
            id: `workout_${Date.now()}`,
            name: workoutName,
            description: workoutDescription,
            createdAt: new Date().toISOString().split('T')[0], // Data no formato YYYY-MM-DD
            blocks: [
                {
                    blockType: WorkoutBlock.WARM_UP,
                    exercises: warmUpExercises,
                    notes: '',
                },
                {
                    blockType: WorkoutBlock.WORK,
                    exercises: workExercises,
                    notes: '',
                },
                {
                    blockType: WorkoutBlock.COOL_DOWN,
                    exercises: coolDownExercises,
                    notes: '',
                },
            ] as WorkoutBlockData[],
        };

        try {
            const existingWorkoutsJson = await AsyncStorage.getItem('workout_templates');
            let existingWorkouts = [];

            if (existingWorkoutsJson) {
                existingWorkouts = JSON.parse(existingWorkoutsJson);
            }

            const updatedWorkouts = [...existingWorkouts, newWorkout];
            await AsyncStorage.setItem('workout_templates', JSON.stringify(updatedWorkouts));

            showAlert(
                'Treino Criado!',
                `Treino "${workoutName}" criado com sucesso!\n\n` +
                `Aquecimento: ${warmUpExercises.length} exercício(s)\n` +
                `Principal: ${workExercises.length} exercício(s)\n` +
                `Finalização: ${coolDownExercises.length} exercício(s)`,
                'success',
                () => router.back()
            );
        } catch (error){
            console.error('Erro ao salvar treino:', error);
            showAlert('Erro', 'Não foi possível salvar o treino. Por favor, tente novamente.', 'error');
        }
    };

    /**
     * FUNÇÃO: addExerciseToBlock
     * 
     * O que faz: Adiciona um exercício a um bloco específico
     * 
     * Parâmetros:
     * - exerciseId: ID do exercício selecionado
     * - blockType: Qual bloco (WARM_UP, WORK, COOL_DOWN)
     */
    const addExerciseToBlock = (exerciseId: string, blockType: WorkoutBlock) => {
        const exercise = allExercises.find(e => e.id === exerciseId);
        if (!exercise) return;

        // Criar o objeto WorkoutExercise
        const workoutExercise: WorkoutExercise = {
            exerciseId: exercise.id,
            exercise: exercise,
            sets: undefined,
            reps: undefined,
            duration: undefined,
            restTime: undefined,
            order: 0, // Será calculado depois
            notes: '',
        };

        // Adicionar ao bloco correto
        if (blockType === WorkoutBlock.WARM_UP) {
            workoutExercise.order = warmUpExercises.length + 1;
            setWarmUpExercises([...warmUpExercises, workoutExercise]);
        } else if (blockType === WorkoutBlock.WORK) {
            workoutExercise.order = workExercises.length + 1;
            setWorkExercises([...workExercises, workoutExercise]);
        } else if (blockType === WorkoutBlock.COOL_DOWN) {
            workoutExercise.order = coolDownExercises.length + 1;
            setCoolDownExercises([...coolDownExercises, workoutExercise]);
        }

        // Fechar a seleção
        setSelectingForBlock(null);
    };

    /**
     * FUNÇÃO: removeExerciseFromBlock
     * 
     * O que faz: Remove um exercício de um bloco
     */
    const removeExerciseFromBlock = (index: number, blockType: WorkoutBlock) => {
        if (blockType === WorkoutBlock.WARM_UP) {
            const updated = warmUpExercises.filter((_, i) => i !== index);
            // Reordenar
            updated.forEach((ex, i) => { ex.order = i + 1; });
            setWarmUpExercises(updated);
        } else if (blockType === WorkoutBlock.WORK) {
            const updated = workExercises.filter((_, i) => i !== index);
            updated.forEach((ex, i) => { ex.order = i + 1; });
            setWorkExercises(updated);
        } else if (blockType === WorkoutBlock.COOL_DOWN) {
            const updated = coolDownExercises.filter((_, i) => i !== index);
            updated.forEach((ex, i) => { ex.order = i + 1; });
            setCoolDownExercises(updated);
        }
    };

    /**
     * FUNÇÃO: updateExerciseInBlock
     * 
     * O que faz: Atualiza as configurações de um exercício (séries, reps, etc.)
     */
    const updateExerciseInBlock = (
        index: number,
        blockType: WorkoutBlock,
        updates: Partial<WorkoutExercise>
    ) => {
        if (blockType === WorkoutBlock.WARM_UP) {
            const updated = [...warmUpExercises];
            updated[index] = { ...updated[index], ...updates };
            setWarmUpExercises(updated);
        } else if (blockType === WorkoutBlock.WORK) {
            const updated = [...workExercises];
            updated[index] = { ...updated[index], ...updates };
            setWorkExercises(updated);
        } else if (blockType === WorkoutBlock.COOL_DOWN) {
            const updated = [...coolDownExercises];
            updated[index] = { ...updated[index], ...updates };
            setCoolDownExercises(updated);
        }
    };

    /**
     * FUNÇÃO AUXILIAR: getBlockName
     * 
     * Traduz o enum WorkoutBlock para português
     */
    const getBlockName = (blockType: WorkoutBlock) => {
        switch (blockType) {
            case WorkoutBlock.WARM_UP:
                return 'Aquecimento';
            case WorkoutBlock.WORK:
                return 'Principal';
            case WorkoutBlock.COOL_DOWN:
                return 'Finalização';
        }
    };

    /**
     * FUNÇÃO AUXILIAR: renderBlockSection
     * 
     * Renderiza uma seção de bloco (Aquecimento, Principal ou Finalização)
     */
    const renderBlockSection = (
        blockType: WorkoutBlock,
        exercises: WorkoutExercise[],
        setExercises: React.Dispatch<React.SetStateAction<WorkoutExercise[]>>
    ) => {
        return (
            <View className="mb-6">
                {/* Cabeçalho do bloco */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold" style={themeStyles.text}>
                        {getBlockName(blockType)}
                    </Text>
                    <TouchableOpacity
                        className="rounded-lg px-4 py-2 border"
                        style={{ 
                            backgroundColor: theme.mode === 'dark' 
                                ? 'rgba(249, 115, 22, 0.4)' 
                                : 'rgba(251, 146, 60, 0.2)',
                            borderColor: theme.colors.primary + '50',
                        }}
                        onPress={() => setSelectingForBlock(blockType)}
                    >
                        <Text className="font-semibold text-sm" style={{ color: theme.colors.primary }}>
                            + Adicionar Exercício
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Lista de exercícios do bloco */}
                {exercises.length === 0 ? (
                    <View className="rounded-xl p-4 border" style={themeStyles.card}>
                        <Text className="text-center" style={themeStyles.textSecondary}>
                            Nenhum exercício adicionado ainda
                        </Text>
                    </View>
                ) : (
                    exercises.map((workoutExercise, index) => {
                        const exercise = workoutExercise.exercise;
                        if (!exercise) return null;

                        return (
                            <View
                                key={`${blockType}-${index}`}
                                className="rounded-xl p-4 mb-3 border"
                                style={themeStyles.card}
                            >
                                {/* Nome do exercício e botão remover */}
                                <View className="flex-row justify-between items-start mb-3">
                                    <View className="flex-1">
                                        <Text className="text-lg font-semibold" style={themeStyles.text}>
                                            {exercise.name}
                                        </Text>
                                        <Text className="text-sm mt-1" style={themeStyles.textSecondary}>
                                            {exercise.description}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeExerciseFromBlock(index, blockType)}
                                        className="ml-2"
                                    >
                                        <Text className="font-semibold" style={{ color: '#ef4444' }}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Campos de configuração do exercício */}
                                <View className="flex-row gap-3 mb-2">
                                    {/* Séries */}
                                    <View className="flex-1">
                                        <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Séries</Text>
                                        <TextInput
                                            className="border rounded px-3 py-2"
                                            style={{
                                              backgroundColor: theme.colors.card,
                                              borderColor: theme.colors.border,
                                              color: theme.colors.text,
                                            }}
                                            placeholder="Ex: 3"
                                            placeholderTextColor={theme.colors.textTertiary}
                                            keyboardType="numeric"
                                            value={workoutExercise.sets?.toString() || ''}
                                            onChangeText={(text) => {
                                                const value = text === '' ? undefined : parseInt(text);
                                                updateExerciseInBlock(index, blockType, { sets: value });
                                            }}
                                        />
                                    </View>

                                    {/* Repetições */}
                                    <View className="flex-1">
                                        <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Repetições</Text>
                                        <TextInput
                                            className="border rounded px-3 py-2"
                                            style={{
                                              backgroundColor: theme.colors.card,
                                              borderColor: theme.colors.border,
                                              color: theme.colors.text,
                                            }}
                                            placeholder="Ex: 12"
                                            placeholderTextColor={theme.colors.textTertiary}
                                            keyboardType="numeric"
                                            value={workoutExercise.reps?.toString() || ''}
                                            onChangeText={(text) => {
                                                const value = text === '' ? undefined : parseInt(text);
                                                updateExerciseInBlock(index, blockType, { reps: value });
                                            }}
                                        />
                                    </View>
                                </View>

                                <View className="flex-row gap-3">
                                    {/* Duração (segundos) */}
                                    <View className="flex-1">
                                        <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Duração (s)</Text>
                                        <TextInput
                                            className="border rounded px-3 py-2"
                                            style={{
                                              backgroundColor: theme.colors.card,
                                              borderColor: theme.colors.border,
                                              color: theme.colors.text,
                                            }}
                                            placeholder="Ex: 60"
                                            placeholderTextColor={theme.colors.textTertiary}
                                            keyboardType="numeric"
                                            value={workoutExercise.duration?.toString() || ''}
                                            onChangeText={(text) => {
                                                const value = text === '' ? undefined : parseInt(text);
                                                updateExerciseInBlock(index, blockType, { duration: value });
                                            }}
                                        />
                                    </View>

                                    {/* Descanso (segundos) */}
                                    <View className="flex-1">
                                        <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Descanso (s)</Text>
                                        <TextInput
                                            className="border rounded px-3 py-2"
                                            style={{
                                              backgroundColor: theme.colors.card,
                                              borderColor: theme.colors.border,
                                              color: theme.colors.text,
                                            }}
                                            placeholder="Ex: 45"
                                            placeholderTextColor={theme.colors.textTertiary}
                                            keyboardType="numeric"
                                            value={workoutExercise.restTime?.toString() || ''}
                                            onChangeText={(text) => {
                                                const value = text === '' ? undefined : parseInt(text);
                                                updateExerciseInBlock(index, blockType, { restTime: value });
                                            }}
                                        />
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        );
    };

    return (
        <>
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
                    Criar Novo Treino
                </Text>
                <Text className="mb-6" style={themeStyles.textSecondary}>
                    Crie um treino completo com os 3 blocos obrigatórios
                </Text>

                {/* Formulário básico */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        Nome do Treino *
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3 mb-4"
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

                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        Descrição (opcional)
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Descreva o objetivo do treino..."
                        placeholderTextColor={theme.colors.textTertiary}
                        value={workoutDescription}
                        onChangeText={setWorkoutDescription}
                        multiline
                        numberOfLines={3}
                    />
                </View>

               {/* Seção de seleção de exercícios (modal) - ATUALIZADO COM FILTROS */}
                <Modal
                    visible={selectingForBlock !== null}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {
                        setSelectingForBlock(null);
                        resetFilters(); // Limpar filtros ao fechar
                    }}
                >
                    <View className="flex-1 bg-black/50 justify-center items-center p-6">
                        <View className="rounded-3xl p-6 w-full max-h-[80%] min-h-[70%] border" style={themeStyles.card}>
                            {/* Título */}
                            <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                                Selecionar Exercício para {selectingForBlock ? getBlockName(selectingForBlock) : ''}
                            </Text>

                            {/* BUSCA POR TEXTO */}
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
                            <ScrollView 
                                className="max-h-96"
                                nestedScrollEnabled={true}
                                keyboardShouldPersistTaps="handled"
                            >
                                {getFilteredExercises().length === 0 ? (
                                    <Text className="text-center py-8" style={themeStyles.textSecondary}>
                                        Nenhum exercício encontrado
                                    </Text>
                                ) : (
                                    getFilteredExercises().map((exercise) => (
                                        <TouchableOpacity
                                            key={exercise.id}
                                            className="rounded-xl p-4 mb-2 border"
                                            style={themeStyles.card}
                                            onPress={() => {
                                                if (selectingForBlock) {
                                                    addExerciseToBlock(exercise.id, selectingForBlock);
                                                    resetFilters(); // Limpar filtros após seleção
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

                            {/* Botão Cancelar */}
                            <TouchableOpacity
                                className="mt-4 rounded-lg py-3 border"
                                style={themeStyles.cardSecondary}
                                onPress={() => {
                                    setSelectingForBlock(null);
                                    resetFilters();
                                }}
                            >
                                <Text className="text-center font-semibold" style={themeStyles.text}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Seções dos 3 blocos */}
                {renderBlockSection(WorkoutBlock.WARM_UP, warmUpExercises, setWarmUpExercises)}
                {renderBlockSection(WorkoutBlock.WORK, workExercises, setWorkExercises)}
                {renderBlockSection(WorkoutBlock.COOL_DOWN, coolDownExercises, setCoolDownExercises)}

                {/* Botão de salvar */}
                <TouchableOpacity
                    className="rounded-lg py-4 px-6 mt-6 border"
                    style={{
                      backgroundColor: theme.mode === 'dark' 
                        ? 'rgba(249, 115, 22, 0.4)' 
                        : 'rgba(251, 146, 60, 0.2)',
                      borderColor: theme.colors.primary + '50',
                    }}
                    onPress={handleSaveWorkout}
                >
                    <Text className="font-semibold text-center text-lg" style={{ color: theme.colors.primary }}>
                        💾 Salvar Treino
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>

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
    </>
    );
}
