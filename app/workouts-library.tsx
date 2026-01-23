import { WorkoutCard } from '@/src/components/WorkoutCard';
import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Exercícios mockados (simplificados para aprendizado)
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
                        duration: 300, // 5 minutos
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
                        duration: 180, // 3 minutos
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

export default function WorkoutLibraryScreen() {
    const router = useRouter();
    const [allWorkouts, setAllWorkouts] = useState(mockWorkouts);

    const loadSavedWorkouts = async () => {
        try {
            const savedWorkoutsJson = await AsyncStorage.getItem('workout_templates');
            let savedWorkouts = [];

            if (savedWorkoutsJson) {
                savedWorkouts = JSON.parse(savedWorkoutsJson);
            }

            const combinedWorkouts = [...mockWorkouts, ...savedWorkouts];

            setAllWorkouts(combinedWorkouts);
        } catch (error) {
            console.error('Erro ao carregar treinos:', error);
            setAllWorkouts(mockWorkouts);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadSavedWorkouts();
        }, [])
    );

    

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
                    Meus Treinos
                </Text>
                <Text className="text-neutral-400 mb-6">
                    Gerencie seus treinos e templates
                </Text>

                <TouchableOpacity 
                    className="bg-primary-500 rounded-lg py-4 px-6 mb-6"
                    style={{
                      shadowColor: '#fb923c',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                    onPress={() => router.push('/create-workout')}
                >
                    <Text className="text-white font-semibold text-center text-lg">
                        ➕ Criar Novo Treino
                    </Text>
                </TouchableOpacity>

                <View className="w-full">
                    <Text className="text-xl font-bold text-white mb-4">
                        Meus Treinos ({allWorkouts.length})
                    </Text>

                    {allWorkouts.map((workout) => {
                        // Calcular total de exercícios de todos os blocos
                        const totalExercises = workout.blocks.reduce(
                            (total, block) => total + block.exercises.length,
                            0
                        );

                        return (
                            <WorkoutCard
                                key={workout.id}
                                name={workout.name}
                                description={workout.description}
                                exercisesCount={totalExercises}
                                createdAt={workout.createdAt}
                                onPress={() => {
                                    router.push({
                                        pathname: '/workout-template-details',
                                        params: { workoutId: workout.id },
                                    });
                                }}
                            />
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );

}