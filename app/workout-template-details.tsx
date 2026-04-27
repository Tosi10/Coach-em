/**
 * TELA DE DETALHES DO TEMPLATE DE TREINO (PARA TREINADOR)
 * 
 * Esta tela mostra os detalhes completos de um treino criado pelo treinador,
 * incluindo os 3 blocos organizados: Aquecimento, Principal e Finalização.
 */

import { CustomAlert } from '@/components/CustomAlert';
import { WorkoutDetails } from '@/src/components/WorkoutDetails';
import { useTheme } from '@/src/contexts/ThemeContext';
import { DEFAULT_EXERCISES } from '@/src/data/defaultExercises';
import { DEFAULT_WORKOUT_TEMPLATES } from '@/src/data/defaultWorkoutTemplates';
import { deleteWorkoutTemplate, getWorkoutTemplateById } from '@/src/services/workoutTemplates.service';
import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Exercícios padrão para fallback visual dos templates.
const mockExercises: Exercise[] = DEFAULT_EXERCISES;

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
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);
    const { workoutId } = useLocalSearchParams();
    
    // Garantir que workoutId seja sempre string
    const workoutIdString = Array.isArray(workoutId) ? workoutId[0] : workoutId;
    
    const [allWorkouts, setAllWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Carregar template do Firestore pelo ID
    useEffect(() => {
        const loadWorkout = async () => {
            try {
                if (!workoutIdString) return;
                const defaultWorkout = DEFAULT_WORKOUT_TEMPLATES.find((w) => w.id === workoutIdString);
                if (defaultWorkout) {
                    setAllWorkouts([defaultWorkout]);
                    return;
                }
                const workout = await getWorkoutTemplateById(workoutIdString);
                setAllWorkouts(workout ? [workout] : []);
            } catch (error) {
                console.error('Erro ao carregar treino:', error);
                setAllWorkouts([]);
            } finally {
                setLoading(false);
            }
        };
        loadWorkout();
    }, [workoutIdString]);

    // Mostrar loading enquanto carrega os treinos
    if (loading) {
        return (
            <View className="flex-1 items-center justify-center px-6" style={themeStyles.bg}>
                <Text className="text-xl font-bold" style={themeStyles.text}>
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
            <View className="flex-1 items-center justify-center px-6" style={themeStyles.bg}>
                <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                    Treino não encontrado
                </Text>
                <TouchableOpacity
                    className="rounded-lg py-3 px-6"
                    style={{ backgroundColor: theme.colors.primary }}
                    onPress={() => router.back()}
                >
                    <Text className="font-semibold" style={{ color: '#ffffff' }}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

     const confirmDeleteWorkout = async () => {
        try {
            if (!workoutIdString) return;
            await deleteWorkoutTemplate(workoutIdString);
            showAlert('Sucesso', 'Treino deletado com sucesso!', 'success', () => {
                router.back();
            });
        } catch (error) {
            console.error('Erro ao deletar treino:', error);
            showAlert('Erro', 'Não foi possível deletar o treino.', 'error');
        }
     };

     const handleDeleteWorkout = () => {
        showAlert(
            'Deletar treino',
            `Tem certeza que deseja deletar o treino "${workout.name}"? Esta ação não pode ser desfeita.`,
            'warning',
            confirmDeleteWorkout
        );
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

                {/* Informações do treino */}
                <View className="mb-6">
                    <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
                        {workout.name}
                    </Text>
                    {workout.description && (
                        <Text className="mb-2" style={themeStyles.textSecondary}>
                            {workout.description}
                        </Text>
                    )}
                    <Text className="text-sm mb-4" style={themeStyles.textTertiary}>
                        Criado em: {workout.createdAt}
                    </Text>
                </View>

                {/* Componente WorkoutDetails com os 3 blocos */}
                <WorkoutDetails
                    blocks={workout.blocks}
                />

                {/* Botões de ação - após os blocos do treino */}
                {workout.id.startsWith('workout_') && (
                    <View className="flex-row gap-3 mt-2">
                        {/* Botão Editar */}
                        <TouchableOpacity
                            className="flex-1 rounded-lg py-3 px-4 border"
                            style={{ 
                                backgroundColor: theme.mode === 'dark' 
                                    ? 'rgba(249, 115, 22, 0.4)' 
                                    : 'rgba(251, 146, 60, 0.1)',
                                borderColor: theme.colors.primary + '50',
                            }}
                            onPress={() => {
                                router.push({
                                    pathname: '/edit-workout',
                                    params: { workoutId: workoutIdString },
                                });
                            }}
                        >
                            <Text className="font-semibold text-center" style={{ color: theme.colors.primary }}>
                                ✏️ Editar
                            </Text>
                        </TouchableOpacity>
                        
                        {/* Botão Deletar */}
                        <TouchableOpacity
                            className="flex-1 rounded-lg py-3 px-4 border"
                            style={{ 
                                backgroundColor: theme.mode === 'dark' 
                                    ? 'rgba(239, 68, 68, 0.2)' 
                                    : 'rgba(239, 68, 68, 0.1)',
                                borderColor: '#ef4444' + '50',
                            }}
                            onPress={handleDeleteWorkout}
                        >
                            <Text className="font-semibold text-center" style={{ color: '#ef4444' }}>
                                🗑️ Deletar
                            </Text>
                        </TouchableOpacity>
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
