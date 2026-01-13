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

import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    const handleSaveWorkout = () => {
        // Validação básica
        if (!workoutName.trim()) {
            Alert.alert('Erro', 'Por favor, preencha o nome do treino.');
            return;
        }

        // Validação: cada bloco deve ter pelo menos 1 exercício
        if (warmUpExercises.length === 0 || workExercises.length === 0 || coolDownExercises.length === 0) {
            Alert.alert('Erro', 'Cada bloco deve ter pelo menos 1 exercício.');
            return;
        }

        // Montar a estrutura completa do treino
        const newWorkout = {
            id: Date.now().toString(), // ID temporário (depois será gerado pelo Firebase)
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

        // Por enquanto, apenas mostra um alert
        // TODO: Salvar no estado global ou no Firebase
        Alert.alert(
            'Treino Criado!',
            `Treino "${workoutName}" criado com sucesso!\n\n` +
            `Aquecimento: ${warmUpExercises.length} exercício(s)\n` +
            `Principal: ${workExercises.length} exercício(s)\n` +
            `Finalização: ${coolDownExercises.length} exercício(s)`,
            [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]
        );
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
        const exercise = mockExercises.find(e => e.id === exerciseId);
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
                    <Text className="text-xl font-bold text-neutral-900">
                        {getBlockName(blockType)}
                    </Text>
                    <TouchableOpacity
                        className="bg-primary-600 rounded-lg px-4 py-2"
                        onPress={() => setSelectingForBlock(blockType)}
                    >
                        <Text className="text-white font-semibold text-sm">
                            + Adicionar Exercício
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Lista de exercícios do bloco */}
                {exercises.length === 0 ? (
                    <View className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                        <Text className="text-neutral-500 text-center">
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
                                className="bg-neutral-50 rounded-lg p-4 mb-3 border border-neutral-200"
                            >
                                {/* Nome do exercício e botão remover */}
                                <View className="flex-row justify-between items-start mb-3">
                                    <View className="flex-1">
                                        <Text className="text-lg font-semibold text-neutral-900">
                                            {exercise.name}
                                        </Text>
                                        <Text className="text-sm text-neutral-600 mt-1">
                                            {exercise.description}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeExerciseFromBlock(index, blockType)}
                                        className="ml-2"
                                    >
                                        <Text className="text-red-600 font-semibold">✕</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Campos de configuração do exercício */}
                                <View className="flex-row gap-3 mb-2">
                                    {/* Séries */}
                                    <View className="flex-1">
                                        <Text className="text-xs text-neutral-600 mb-1">Séries</Text>
                                        <TextInput
                                            className="bg-white border border-neutral-200 rounded px-3 py-2 text-neutral-900"
                                            placeholder="Ex: 3"
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
                                        <Text className="text-xs text-neutral-600 mb-1">Repetições</Text>
                                        <TextInput
                                            className="bg-white border border-neutral-200 rounded px-3 py-2 text-neutral-900"
                                            placeholder="Ex: 12"
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
                                        <Text className="text-xs text-neutral-600 mb-1">Duração (s)</Text>
                                        <TextInput
                                            className="bg-white border border-neutral-200 rounded px-3 py-2 text-neutral-900"
                                            placeholder="Ex: 60"
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
                                        <Text className="text-xs text-neutral-600 mb-1">Descanso (s)</Text>
                                        <TextInput
                                            className="bg-white border border-neutral-200 rounded px-3 py-2 text-neutral-900"
                                            placeholder="Ex: 45"
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
                    Criar Novo Treino
                </Text>
                <Text className="text-neutral-600 mb-6">
                    Crie um treino completo com os 3 blocos obrigatórios
                </Text>

                {/* Formulário básico */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                        Nome do Treino *
                    </Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900 mb-4"
                        placeholder="Ex: Treino de Força - Pernas"
                        value={workoutName}
                        onChangeText={setWorkoutName}
                    />

                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                        Descrição (opcional)
                    </Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                        placeholder="Descreva o objetivo do treino..."
                        value={workoutDescription}
                        onChangeText={setWorkoutDescription}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Seção de seleção de exercícios (modal) */}
                <Modal
                    visible={selectingForBlock !== null}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectingForBlock(null)}
                >
                    <View className="flex-1 bg-black/50 justify-center items-center p-6">
                        <View className="bg-white rounded-lg p-6 w-full max-h-[80%]">
                            <Text className="text-xl font-bold text-neutral-900 mb-4">
                                Selecionar Exercício para {selectingForBlock ? getBlockName(selectingForBlock) : ''}
                            </Text>
                            <ScrollView 
                                className="max-h-96"
                                nestedScrollEnabled={true}
                                keyboardShouldPersistTaps="handled"
                            >
                                {mockExercises.map((exercise) => (
                                    <TouchableOpacity
                                        key={exercise.id}
                                        className="bg-neutral-50 rounded-lg p-4 mb-2 border border-neutral-200"
                                        onPress={() => addExerciseToBlock(exercise.id, selectingForBlock!)}
                                    >
                                        <Text className="text-lg font-semibold text-neutral-900">
                                            {exercise.name}
                                        </Text>
                                        <Text className="text-sm text-neutral-600 mt-1">
                                            {exercise.description}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                className="mt-4 bg-neutral-200 rounded-lg py-3"
                                onPress={() => setSelectingForBlock(null)}
                            >
                                <Text className="text-center text-neutral-900 font-semibold">
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
                    className="bg-primary-600 rounded-lg py-4 px-6 mt-6"
                    onPress={handleSaveWorkout}
                >
                    <Text className="text-white font-semibold text-center text-lg">
                        💾 Salvar Treino
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
