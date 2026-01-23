/**
 * TELA DE DETALHES DO TEMPLATE DE TREINO (PARA TREINADOR)
 * 
 * Esta tela mostra os detalhes completos de um treino criado pelo treinador,
 * incluindo os 3 blocos organizados: Aquecimento, Principal e Finalização.
 */

import { WorkoutDetails } from '@/src/components/WorkoutDetails';
import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Exercícios mockados (mesmos do workouts-library.tsx)
const mockExercises: Exercise[] = [
    { id: 'ex1', name: 'Agachamento', description: 'Agachamento livre', difficulty: 'intermediate', muscleGroups: ['pernas'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'ex2', name: 'Leg Press', description: 'Leg press 45°', difficulty: 'beginner', muscleGroups: ['pernas'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'ex3', name: 'Extensão de Pernas', description: 'Extensão no aparelho', difficulty: 'beginner', muscleGroups: ['pernas'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'ex4', name: 'Caminhada Leve', description: '5 minutos de caminhada', difficulty: 'beginner', muscleGroups: ['cardio'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'ex5', name: 'Alongamento de Pernas', description: 'Alongamento estático', difficulty: 'beginner', muscleGroups: ['flexibilidade'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'ex6', name: 'Supino Reto', description: 'Supino com barra', difficulty: 'intermediate', muscleGroups: ['peito'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'ex7', name: 'Supino Inclinado', description: 'Supino inclinado 45°', difficulty: 'intermediate', muscleGroups: ['peito'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'ex8', name: 'Crucifixo', description: 'Crucifixo com halteres', difficulty: 'beginner', muscleGroups: ['peito'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'ex9', name: 'Corrida Leve', description: '5 minutos de corrida', difficulty: 'beginner', muscleGroups: ['cardio'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'ex10', name: 'Alongamento de Peito', description: 'Alongamento estático', difficulty: 'beginner', muscleGroups: ['flexibilidade'], createdBy: 'coach1', isGlobal: true, createdAt: new Date(), updatedAt: new Date() },
];

// Dados mockados de treinos (mesmos do workouts-library.tsx)
const mockWorkouts = [
    {
        id: '1',
        name: 'Treino de Força - Pernas',
        description: 'Treino completo para desenvolvimento de força nas pernas',
        createdAt: '2026-01-05',
        blocks: [
            {
                blockType: WorkoutBlock.WARM_UP,
                exercises: [
                    {
                        exerciseId: 'ex4',
                        exercise: mockExercises.find(e => e.id === 'ex4'),
                        sets: undefined,
                        reps: undefined,
                        duration: 300,
                        restTime: undefined,
                        order: 1,
                        notes: 'Caminhada leve para aquecer',
                    },
                ] as WorkoutExercise[],
                notes: 'Aquecimento de 5 minutos',
            },
            {
                blockType: WorkoutBlock.WORK,
                exercises: [
                    {
                        exerciseId: 'ex1',
                        exercise: mockExercises.find(e => e.id === 'ex1'),
                        sets: 4,
                        reps: 12,
                        duration: undefined,
                        restTime: 60,
                        order: 1,
                    },
                    {
                        exerciseId: 'ex2',
                        exercise: mockExercises.find(e => e.id === 'ex2'),
                        sets: 3,
                        reps: 15,
                        duration: undefined,
                        restTime: 45,
                        order: 2,
                    },
                    {
                        exerciseId: 'ex3',
                        exercise: mockExercises.find(e => e.id === 'ex3'),
                        sets: 3,
                        reps: 12,
                        duration: undefined,
                        restTime: 45,
                        order: 3,
                    },
                ] as WorkoutExercise[],
                notes: 'Foco em força e hipertrofia',
            },
            {
                blockType: WorkoutBlock.COOL_DOWN,
                exercises: [
                    {
                        exerciseId: 'ex5',
                        exercise: mockExercises.find(e => e.id === 'ex5'),
                        sets: undefined,
                        reps: undefined,
                        duration: 180,
                        restTime: undefined,
                        order: 1,
                        notes: 'Alongamento estático de 3 minutos',
                    },
                ] as WorkoutExercise[],
                notes: 'Alongamento para relaxamento',
            },
        ] as WorkoutBlockData[],
    },
    {
        id: '2',
        name: 'Treino de Força - Peito',
        description: 'Treino completo para desenvolvimento de força no peito',
        createdAt: '2026-01-05',
        blocks: [
            {
                blockType: WorkoutBlock.WARM_UP,
                exercises: [
                    {
                        exerciseId: 'ex9',
                        exercise: mockExercises.find(e => e.id === 'ex9'),
                        sets: undefined,
                        reps: undefined,
                        duration: 300,
                        restTime: undefined,
                        order: 1,
                        notes: 'Corrida leve para aquecer',
                    },
                ] as WorkoutExercise[],
                notes: 'Aquecimento de 5 minutos',
            },
            {
                blockType: WorkoutBlock.WORK,
                exercises: [
                    {
                        exerciseId: 'ex6',
                        exercise: mockExercises.find(e => e.id === 'ex6'),
                        sets: 4,
                        reps: 10,
                        duration: undefined,
                        restTime: 90,
                        order: 1,
                    },
                    {
                        exerciseId: 'ex7',
                        exercise: mockExercises.find(e => e.id === 'ex7'),
                        sets: 3,
                        reps: 12,
                        duration: undefined,
                        restTime: 60,
                        order: 2,
                    },
                    {
                        exerciseId: 'ex8',
                        exercise: mockExercises.find(e => e.id === 'ex8'),
                        sets: 3,
                        reps: 15,
                        duration: undefined,
                        restTime: 45,
                        order: 3,
                    },
                ] as WorkoutExercise[],
                notes: 'Foco em força e hipertrofia do peitoral',
            },
            {
                blockType: WorkoutBlock.COOL_DOWN,
                exercises: [
                    {
                        exerciseId: 'ex10',
                        exercise: mockExercises.find(e => e.id === 'ex10'),
                        sets: undefined,
                        reps: undefined,
                        duration: 180,
                        restTime: undefined,
                        order: 1,
                        notes: 'Alongamento estático de 3 minutos',
                    },
                ] as WorkoutExercise[],
                notes: 'Alongamento para relaxamento',
            },
        ] as WorkoutBlockData[],
    },
];

export default function WorkoutTemplateDetailsScreen() {
    const router = useRouter();
    const { workoutId } = useLocalSearchParams();
    
    // Garantir que workoutId seja sempre string
    const workoutIdString = Array.isArray(workoutId) ? workoutId[0] : workoutId;
    
    const [allWorkouts, setAllWorkouts] = useState(mockWorkouts);
    const [loading, setLoading] = useState(true);

    // Função para carregar treinos salvos do AsyncStorage
useEffect(() => {
    const loadSavedWorkouts = async () => {
        try {
            // PARTE 1: Buscar treinos salvos do AsyncStorage
            const savedWorkoutsJson = await AsyncStorage.getItem('workout_templates');
            let savedWorkouts = [];
            
            if (savedWorkoutsJson) {
                savedWorkouts = JSON.parse(savedWorkoutsJson);
            }

            // PARTE 2: Combinar treinos mockados com os salvos
            const combinedWorkouts = [...mockWorkouts, ...savedWorkouts];

            // PARTE 3: Atualizar o estado
            setAllWorkouts(combinedWorkouts);
        } catch (error) {
            console.error('Erro ao carregar treinos:', error);
            // Se der erro, mantém apenas os mockados
            setAllWorkouts(mockWorkouts);
        } finally {
            setLoading(false);
        }
    };

    loadSavedWorkouts();
}, []);

    // Mostrar loading enquanto carrega os treinos
    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-dark-950 px-6">
                <Text className="text-xl font-bold text-white">
                    Carregando...
                </Text>
            </View>
        );
    }

    // Buscar o treino correspondente (após carregar)
    const workout = allWorkouts.find(w => w.id === workoutIdString);

    // Se não encontrou o treino, volta para a tela anterior
    if (!workout) {
        return (
            <View className="flex-1 items-center justify-center bg-dark-950 px-6">
                <Text className="text-xl font-bold text-white mb-4">
                    Treino não encontrado
                </Text>
                <TouchableOpacity
                    className="bg-primary-500 rounded-lg py-3 px-6"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-semibold">Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

     const handleDeleteWorkout = async () => {
        Alert.alert(
            'Deletar treino',
            `Tem certeza que deseja deletar o treino "${workout.name}"? Esta açaão não pode ser desfeita.`,
            [
                {
                    text:'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Deletar',
                    style: 'destructive',
                    onPress: async() => {
                        try {
                            const savedWorkoutsJson = await AsyncStorage.getItem('workout_templates');
                            let savedWorkouts = [];

                            if (savedWorkoutsJson) {
                                savedWorkouts = JSON.parse(savedWorkoutsJson);
                            }

                            const updatedWorkouts = savedWorkouts.filter(
                                (w:any) => w.id !== workoutIdString
                            );

                            await AsyncStorage.setItem(
                                'workout_templates',
                                JSON.stringify(updatedWorkouts)
                            );

                            Alert.alert('Sucesso', 'Treino deletado com sucesso!');
                            router.back();
                        }
                        catch (error) {
                            console.error('Erro ao deletar treino:', error);
                            Alert.alert('Erro', 'Não foi possível deletar o treino.');
                        }
                    },
                },
            ]
        );
     };

    return (
        <ScrollView className="flex-1 bg-dark-950">
            <View className="px-6 pt-20 pb-20">
                {/* Header com botão voltar melhorado */}
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity
                        className="flex-row items-center"
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
                    
                    {/* Botões de ação - só aparecem para treinos criados (não mockados) */}
                    {workout.id.startsWith('workout_') && (
                        <View className="flex-row gap-2">
                            {/* Botão Editar */}
                            <TouchableOpacity
                                className="bg-blue-500/80 rounded-lg px-4 py-2"
                                onPress={() => {
                                    router.push({
                                        pathname: '/edit-workout',
                                        params: { workoutId: workoutIdString },
                                    });
                                }}
                            >
                                <Text className="text-white font-semibold">
                                    ✏️ Editar
                                </Text>
                            </TouchableOpacity>
                            
                            {/* Botão Deletar */}
                            <TouchableOpacity
                                className="bg-red-500/80 rounded-lg px-4 py-2"
                                onPress={handleDeleteWorkout}
                            >
                                <Text className="text-white font-semibold">
                                    🗑️ Deletar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Informações do treino */}
                <View className="mb-6">
                    <Text className="text-3xl font-bold text-white mb-2">
                        {workout.name}
                    </Text>
                    <Text className="text-neutral-400 mb-2">
                        {workout.description}
                    </Text>
                    <Text className="text-neutral-500 text-sm">
                        Criado em: {workout.createdAt}
                    </Text>
                </View>

                {/* Componente WorkoutDetails com os 3 blocos */}
                <WorkoutDetails
                    blocks={workout.blocks}
                    workoutName={workout.name}
                />
            </View>
        </ScrollView>
    );
}
