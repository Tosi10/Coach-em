import { useTheme } from '@/src/contexts/ThemeContext';
import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

// Dados mockados de atletas (temporário - depois virá do Firebase)
const mockAthletes = [
    { id: '1', name: 'João Silva', sport: 'Futebol', status: 'Ativo' },
    { id: '2', name: 'Maria Oliveira', sport: 'Vôlei', status: 'Ativo' },
    { id: '3', name: 'Pedro Santos', sport: 'Basquete', status: 'Ativo' },
    { id: '4', name: 'Ana Souza', sport: 'Atletismo', status: 'Ativo' },
    { id: '5', name: 'Carlos Ferreira', sport: 'Futebol', status: 'Ativo' },
    { id: '6', name: 'Laura Rodrigues', sport: 'Vôlei', status: 'Ativo' },
    { id: '7', name: 'Rafael Oliveira', sport: 'Basquete', status: 'Ativo' },
    { id: '8', name: 'Camila Silva', sport: 'Atletismo', status: 'Ativo' },
  ];
  
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
                        duration: 300,
                        restTime: undefined,
                        order: 1,
                        notes: 'Caminhada leve para aquecer.',
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
       
]
    
  function isDateThisWeek(dateString: string): boolean {

    const date = new Date(dateString);

    const today = new Date();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59 , 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
  }
  
  export default function AssignWorkoutScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);
    const { athleteId } = useLocalSearchParams<{ athleteId: string }>();
  
    // Estado para armazenar qual treino foi selecionado
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
    
    // Estado para armazenar a data escolhida (formato: YYYY-MM-DD)
    const [selectedDate, setSelectedDate] = useState<string>(
      new Date().toISOString().split('T')[0] // Data de hoje como padrão
    );

    // Estados para recorrência
    const [isRecurring, setIsRecurring] = useState<boolean>(false);
    const [recurrenceType, setRecurrenceType] = useState<'weekly' | 'monthly'>('weekly');
    const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(null); // 0 = Domingo, 1 = Segunda, etc.
    const [recurrenceCount, setRecurrenceCount] = useState<number>(4); // quantidade de treinos
    const [startDate, setStartDate] = useState<string>(
      new Date().toISOString().split('T')[0]
    );
    const [showCalendar, setShowCalendar] = useState<boolean>(false);
    const [showWorkoutModal, setShowWorkoutModal] = useState<boolean>(false);

    // NOVO ESTADO: Lista completa de treinos (mock + salvos)
    const [allWorkouts, setAllWorkouts] = useState<any[]>(mockWorkouts);
  
    // Encontrar o atleta pelo ID recebido
    const athlete = mockAthletes.find(a => a.id === athleteId);

    // FUNÇÃO: Carregar treinos do AsyncStorage
    const loadAllWorkouts = useCallback(async () => {
        try {
            const savedWorkoutsJson = await AsyncStorage.getItem('workout_templates');
            let savedWorkouts: any[] = [];

            if (savedWorkoutsJson) {
                savedWorkouts = JSON.parse(savedWorkoutsJson);
            }

            // Combinar mockWorkouts + savedWorkouts
            const combined = [...mockWorkouts, ...savedWorkouts];
            setAllWorkouts(combined);

            console.log('✅ Treinos carregados no assign:', combined.length);
        } catch (error) {
            console.error('❌ Erro ao carregar treinos:', error);
            setAllWorkouts(mockWorkouts);
        }
    }, []);

    // Carregar treinos quando a tela abrir
    useEffect(() => {
        loadAllWorkouts();
    }, [loadAllWorkouts]);

    // Quando ativar "Recorrente" ou quando startDate mudar, auto-selecionar o dia da semana
    useEffect(() => {
        if (isRecurring && startDate) {
            const dateObj = new Date(startDate);
            const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Segunda, etc.
            setSelectedDayOfWeek(dayOfWeek);
        }
    }, [isRecurring, startDate]);

    // Função para gerar datas recorrentes baseado na quantidade de treinos
    const generateRecurringDates = (start: string, dayOfWeek: number, workoutCount: number): string[] => {
        const dates: string[] = [];
        
        // Parse da data inicial (formato YYYY-MM-DD)
        const [year, month, day] = start.split('-').map(Number);
        const startDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Usar meio-dia para evitar problemas de timezone
        
        console.log(`🔍 Debug generateRecurringDates:`);
        console.log(`   - Data inicial recebida: ${start}`);
        console.log(`   - Quantidade de treinos: ${workoutCount}`);
        console.log(`   - Dia da semana: ${dayOfWeek} (${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek]})`);

        // Encontrar a primeira ocorrência do dia da semana
        let currentDate = new Date(startDate);
        
        // Se a data inicial já é o dia correto, usar ela
        // Senão, encontrar a próxima ocorrência do dia da semana
        if (currentDate.getDay() !== dayOfWeek) {
            // Calcular quantos dias até o próximo dia da semana desejado
            const currentDay = currentDate.getDay();
            let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
            // Se daysToAdd é 0, significa que já é o dia correto (não deveria acontecer aqui)
            if (daysToAdd === 0) {
                daysToAdd = 7; // Ir para a próxima semana
            }
            currentDate.setDate(currentDate.getDate() + daysToAdd);
            console.log(`   - Data inicial não era o dia correto, ajustando para: ${currentDate.toISOString().split('T')[0]}`);
        } else {
            console.log(`   - Data inicial já é o dia correto, usando: ${currentDate.toISOString().split('T')[0]}`);
        }

        // Gerar exatamente a quantidade de treinos solicitada
        for (let i = 0; i < workoutCount; i++) {
            // Formatar data como YYYY-MM-DD
            const yearStr = currentDate.getFullYear();
            const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(currentDate.getDate()).padStart(2, '0');
            const dateString = `${yearStr}-${monthStr}-${dayStr}`;
            
            dates.push(dateString);
            console.log(`   - Adicionada data ${i + 1}/${workoutCount}: ${dateString} (${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentDate.getDay()]})`);
            
            // Avançar para a próxima semana (apenas se não for o último)
            if (i < workoutCount - 1) {
                currentDate.setDate(currentDate.getDate() + 7);
            }
        }

        console.log(`📅 Total: ${dates.length} datas geradas (de ${dates[0] || 'N/A'} até ${dates[dates.length - 1] || 'N/A'})`);
        return dates;
    };

    const handleAssignWorkout = async () => {
        if (!selectedWorkoutId) {
            Alert.alert('Erro', 'Por favor, selecione um treino.');
            return;
        }

        const workout = allWorkouts.find(w => w.id === selectedWorkoutId);

        if(!workout) {
            Alert.alert('Erro', 'Treino não encontrado.');
            return;
        }

        if(!athlete) {
            Alert.alert('Erro', 'Atleta não encontrado.');
            return;
        }

        // Validar recorrência
        if (isRecurring) {
            if (!startDate || startDate.trim() === '') {
                Alert.alert('Erro', 'Por favor, selecione a data inicial.');
                return;
            }
            if (selectedDayOfWeek === null) {
                Alert.alert('Erro', 'Por favor, selecione o dia da semana.');
                return;
            }
        } else {
            if(!selectedDate || selectedDate.trim() === '') {
                Alert.alert('Erro', 'Por favor, informe a data do treino.');
                return;
            }
        }

        try {
            const existingWorkoutsJson = await AsyncStorage.getItem('assigned_workouts');
            const existingWorkouts = existingWorkoutsJson ? JSON.parse(existingWorkoutsJson) : [];

            let datesToAssign: string[] = [];

            if (isRecurring) {
                // Gerar todas as datas recorrentes baseado na quantidade de treinos
                console.log(`🔄 Gerando treinos recorrentes:`);
                console.log(`   - Data inicial: ${startDate}`);
                console.log(`   - Dia da semana: ${selectedDayOfWeek} (${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][selectedDayOfWeek!]})`);
                console.log(`   - Quantidade de treinos: ${recurrenceCount}`);
                datesToAssign = generateRecurringDates(startDate, selectedDayOfWeek!, recurrenceCount);
                console.log(`   ✅ Total de datas geradas: ${datesToAssign.length}`);
                console.log(`   📋 Datas: ${datesToAssign.join(', ')}`);
            } else {
                // Apenas uma data
                datesToAssign = [selectedDate];
            }

            // Criar um ID único para este grupo de atribuição recorrente
            const recurrenceGroupId = isRecurring ? `recurrence_${Date.now()}_${Math.random().toString(36).substr(2,9)}` : null;
            
            // Criar uma atribuição para cada data
            const newAssignments = datesToAssign.map((date) => {
                const assignedWorkoutId = `assigned_${Date.now()}_${Math.random().toString(36).substr(2,9)}_${date}`;
                return {
                    id: assignedWorkoutId,
                    workoutTemplateId: workout.id,
                    name: workout.name,
                    description: workout.description || '',
                    athleteId: athlete.id,
                    scheduledDate: date,
                    date: date,
                    status: 'Pendente',
                    coach: 'Treinador',
                    dayOfWeek: new Date(date).toLocaleDateString('pt-BR', { weekday: 'long'}),
                    isToday: date === new Date().toISOString().split('T')[0],
                    isThisWeek: isDateThisWeek(date),
                    createdAt: new Date().toISOString(),
                    blocks: workout.blocks || [],
                    isRecurring: isRecurring,
                    recurrenceGroupId: recurrenceGroupId, // ID do grupo de atribuição recorrente
                };
            });

            const updatedWorkouts = [...existingWorkouts, ...newAssignments];
            await AsyncStorage.setItem('assigned_workouts', JSON.stringify(updatedWorkouts));
            
            console.log('💾 Treinos salvos! Total:', updatedWorkouts.length);
            console.log('📝 Novos treinos:', newAssignments.length);

            const message = isRecurring 
                ? `Treino "${workout.name}" atribuído para ${athlete.name} em ${newAssignments.length} datas (${recurrenceCount} treinos)`
                : `Treino "${workout.name}" atribuído para ${athlete.name} em ${selectedDate}`;

            Alert.alert(
                '✅ Treino Atribuído!',
                message,
                [
                    {text: 'OK', onPress: () => router.back()}
                ]
            );

        } catch(error) {
            console.error('Erro ao salvar treino:', error);
            Alert.alert(
                'Erro',
                'Não foi possível salvar o treino. Tente novamente.'
            );
        }
    };

    // Se o atleta não foi encontrado, mostra mensagem de erro
    if (!athlete) {
        return (
            <View className="flex-1 justify-center items-center px-6" style={themeStyles.bg}>
                <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                    Atleta não encontrado
                </Text>
                <TouchableOpacity
                    className="rounded-lg py-3 px-6"
                    style={{ backgroundColor: theme.colors.primary }}
                    onPress={() => router.back()}
                >
                    <Text className="font-semibold" style={{ color: '#ffffff' }}>
                        Voltar
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                        Atribuir Treino
                    </Text>
                    <Text className="mb-6" style={themeStyles.textSecondary}>
                        Escolha um treino e a data para {athlete.name}
                    </Text>

                    <View className="rounded-lg p-4 mb-6 border" style={themeStyles.card}>
                        <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
                            {athlete.name}
                        </Text>
                        <Text style={themeStyles.textSecondary}>
                            {athlete.status}
                        </Text>
                    </View>

                    <View className="mb-6">
                        <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                            Selecionar Treino *
                        </Text>

                        {/* Botão para abrir modal de seleção */}
                        <TouchableOpacity
                            className="rounded-xl p-4 mb-3 border-2"
                            style={{
                              backgroundColor: selectedWorkoutId
                                ? (theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20')
                                : theme.colors.card,
                              borderColor: selectedWorkoutId
                                ? theme.colors.primary
                                : theme.colors.border,
                              ...(selectedWorkoutId ? {
                                shadowColor: theme.colors.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 4,
                              } : {}),
                            }}
                            onPress={() => setShowWorkoutModal(true)}
                        >
                            {selectedWorkoutId ? (
                                (() => {
                                    const selectedWorkout = allWorkouts.find(w => w.id === selectedWorkoutId);
                                    const totalExercises = selectedWorkout?.blocks.reduce(
                                        (total: number, block: any) => total + block.exercises.length, 0
                                    ) || 0;
                                    return (
                                        <>
                                            <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
                                                {selectedWorkout?.name}
                                            </Text>
                                            <Text className="text-sm mb-2" style={themeStyles.textSecondary}>
                                                {selectedWorkout?.description}
                                            </Text>
                                            <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                                                📋 {totalExercises} exercícios • Criado em {selectedWorkout?.createdAt}
                                            </Text>
                                        </>
                                    );
                                })()
                            ) : (
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-base" style={themeStyles.textSecondary}>
                                        Toque para selecionar um treino
                                    </Text>
                                    <FontAwesome name="chevron-right" size={16} color={theme.colors.textTertiary} />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Modal de Seleção de Treinos */}
                        <Modal
                            visible={showWorkoutModal}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setShowWorkoutModal(false)}
                        >
                            <View className="flex-1 bg-black/50 justify-center items-center p-6">
                                <View className="rounded-3xl p-6 w-full max-h-[80%] min-h-[70%] border" style={themeStyles.card}>
                                    {/* Header do Modal */}
                                    <View className="flex-row justify-between items-center mb-4">
                                        <Text className="text-xl font-bold" style={themeStyles.text}>
                                            Selecionar Treino
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setShowWorkoutModal(false)}
                                            className="rounded-full w-8 h-8 items-center justify-center"
                                            style={themeStyles.cardSecondary}
                                        >
                                            <Text className="text-lg" style={themeStyles.text}>✕</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Lista de Treinos */}
                                    <ScrollView 
                                        className="flex-1"
                                        nestedScrollEnabled={true}
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {allWorkouts.length === 0 ? (
                                            <View className="rounded-xl p-6 mb-2" style={themeStyles.cardSecondary}>
                                                <Text className="text-center" style={themeStyles.textSecondary}>
                                                    Nenhum treino disponível
                                                </Text>
                                            </View>
                                        ) : (
                                            allWorkouts.map((workout) => {
                                                const totalExercises = workout.blocks.reduce(
                                                    (total: number, block: any) => total + block.exercises.length, 0
                                                );
                                                const isSelected = selectedWorkoutId === workout.id;
                                                
                                                return (
                                                    <TouchableOpacity
                                                        key={workout.id}
                                                        className="rounded-xl p-4 mb-3 border-2"
                                                        style={{
                                                          backgroundColor: isSelected
                                                            ? (theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20')
                                                            : theme.colors.card,
                                                          borderColor: isSelected
                                                            ? theme.colors.primary
                                                            : theme.colors.border,
                                                          ...(isSelected ? {
                                                            shadowColor: theme.colors.primary,
                                                            shadowOffset: { width: 0, height: 2 },
                                                            shadowOpacity: 0.3,
                                                            shadowRadius: 4,
                                                            elevation: 4,
                                                          } : {}),
                                                        }}
                                                        onPress={() => {
                                                            setSelectedWorkoutId(workout.id);
                                                            setShowWorkoutModal(false);
                                                        }}
                                                    >
                                                        <View className="flex-row items-start justify-between">
                                                            <View className="flex-1">
                                                                <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
                                                                    {workout.name}
                                                                </Text>
                                                                <Text className="text-sm mb-2" style={themeStyles.textSecondary}>
                                                                    {workout.description}
                                                                </Text>
                                                                <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                                                                    📋 {totalExercises} exercícios • Criado em {workout.createdAt}
                                                                </Text>
                                                            </View>
                                                            {isSelected && (
                                                                <View className="ml-2 rounded-full w-6 h-6 items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                                                                    <FontAwesome name="check" size={12} color={theme.mode === 'dark' ? '#000' : '#fff'} />
                                                                </View>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        )}
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>
                    </View>

                    <View className="mb-6">
                        <Text className="text-xl font-bold mb-4" style={themeStyles.text}>
                            Data do Treino *
                        </Text>

                        {/* Toggle entre data única e recorrente */}
                        <View className="flex-row mb-4 rounded-lg p-1" style={themeStyles.cardSecondary}>
                            <TouchableOpacity
                                className="flex-1 py-2 rounded-lg"
                                style={{
                                  backgroundColor: !isRecurring ? theme.colors.primary : 'transparent',
                                }}
                                onPress={() => setIsRecurring(false)}
                            >
                                <Text className="text-center font-semibold" style={{
                                  color: !isRecurring 
                                    ? (theme.mode === 'dark' ? '#000' : '#fff')
                                    : theme.colors.textSecondary
                                }}>
                                    Data Única
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-2 rounded-lg"
                                style={{
                                  backgroundColor: isRecurring ? theme.colors.primary : 'transparent',
                                }}
                                onPress={() => setIsRecurring(true)}
                            >
                                <Text className="text-center font-semibold" style={{
                                  color: isRecurring 
                                    ? (theme.mode === 'dark' ? '#000' : '#fff')
                                    : theme.colors.textSecondary
                                }}>
                                    Recorrente
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {!isRecurring ? (
                            // Data única
                            <View>
                                <TouchableOpacity
                                    className="border rounded-lg px-4 py-3 mb-2"
                                    style={themeStyles.card}
                                    onPress={() => setShowCalendar(true)}
                                >
                                    <Text style={themeStyles.text}>
                                        {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : 'Selecione uma data'}
                                    </Text>
                                </TouchableOpacity>
                                <Text className="text-xs" style={themeStyles.textTertiary}>
                                    Toque para abrir o calendário
                                </Text>
                            </View>
                        ) : (
                            // Recorrente
                            <View>
                                {/* Data inicial */}
                                <Text className="font-semibold mb-2" style={themeStyles.text}>Data Inicial:</Text>
                                <TouchableOpacity
                                    className="border rounded-lg px-4 py-3 mb-4"
                                    style={themeStyles.card}
                                    onPress={() => {
                                        setShowCalendar(true);
                                    }}
                                >
                                    <Text style={themeStyles.text}>
                                        {startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Selecione a data inicial'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Dia da semana */}
                                <Text className="font-semibold mb-2" style={themeStyles.text}>Dia da Semana:</Text>
                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            className="py-2 px-4 rounded-lg border-2"
                                            style={{
                                              backgroundColor: selectedDayOfWeek === index
                                                ? theme.colors.primary
                                                : theme.colors.card,
                                              borderColor: selectedDayOfWeek === index
                                                ? theme.colors.primary
                                                : theme.colors.border,
                                            }}
                                            onPress={() => setSelectedDayOfWeek(index)}
                                        >
                                            <Text className="font-semibold" style={{
                                              color: selectedDayOfWeek === index 
                                                ? (theme.mode === 'dark' ? '#000' : '#fff')
                                                : theme.colors.text
                                            }}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Quantidade de treinos */}
                                <Text className="font-semibold mb-2" style={themeStyles.text}>Quantidade de treinos:</Text>
                                <View className="flex-row items-center gap-4 mb-4">
                                    <TouchableOpacity
                                        className="border rounded-lg w-12 h-12 items-center justify-center"
                                        style={themeStyles.card}
                                        onPress={() => setRecurrenceCount(Math.max(1, recurrenceCount - 1))}
                                    >
                                        <Text className="text-xl font-bold" style={themeStyles.text}>-</Text>
                                    </TouchableOpacity>
                                    <Text className="text-xl font-semibold min-w-[60px] text-center" style={themeStyles.text}>
                                        {recurrenceCount}
                                    </Text>
                                    <TouchableOpacity
                                        className="border rounded-lg w-12 h-12 items-center justify-center"
                                        style={themeStyles.card}
                                        onPress={() => setRecurrenceCount(recurrenceCount + 1)}
                                    >
                                        <Text className="text-xl font-bold" style={themeStyles.text}>+</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Preview das datas */}
                                {startDate && selectedDayOfWeek !== null && (
                                    <View className="rounded-lg p-3 mb-2" style={themeStyles.cardSecondary}>
                                        <Text className="text-xs mb-1" style={themeStyles.textSecondary}>
                                            Serão criados exatamente {recurrenceCount} treino{recurrenceCount !== 1 ? 's' : ''} toda{' '}
                                            {['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'][selectedDayOfWeek]}
                                        </Text>
                                        {recurrenceCount > 1 && (
                                            <Text className="text-xs mt-1" style={themeStyles.textTertiary}>
                                                Período aproximado: {recurrenceCount} semana{recurrenceCount !== 1 ? 's' : ''}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Modal do Calendário */}
                        <Modal
                            visible={showCalendar}
                            transparent={true}
                            animationType="slide"
                            onRequestClose={() => setShowCalendar(false)}
                        >
                            <View className="flex-1 bg-black/50 justify-end">
                                <View className="rounded-t-3xl p-6 border-t" style={themeStyles.card}>
                                    <View className="flex-row justify-between items-center mb-4">
                                        <Text className="text-xl font-bold" style={themeStyles.text}>
                                            Selecionar Data
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setShowCalendar(false)}
                                            className="rounded-full w-8 h-8 items-center justify-center"
                                            style={themeStyles.cardSecondary}
                                        >
                                            <Text className="text-lg" style={themeStyles.text}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Calendar
                                        current={isRecurring ? startDate : selectedDate}
                                        markedDates={{
                                            [isRecurring ? startDate : selectedDate]: {
                                                selected: true,
                                                selectedColor: '#fb923c',
                                            }
                                        }}
                                        onDayPress={(day) => {
                                            if (isRecurring) {
                                                setStartDate(day.dateString);
                                                // Auto-selecionar o dia da semana baseado na data escolhida
                                                const selectedDateObj = new Date(day.dateString);
                                                const dayOfWeek = selectedDateObj.getDay(); // 0 = Domingo, 1 = Segunda, etc.
                                                setSelectedDayOfWeek(dayOfWeek);
                                            } else {
                                                setSelectedDate(day.dateString);
                                            }
                                            setShowCalendar(false);
                                        }}
                                        minDate={new Date().toISOString().split('T')[0]}
                                        theme={{
                                            backgroundColor: theme.colors.background,
                                            calendarBackground: theme.colors.background,
                                            textSectionTitleColor: theme.colors.textTertiary,
                                            selectedDayBackgroundColor: theme.colors.primary,
                                            selectedDayTextColor: theme.mode === 'dark' ? '#000' : '#fff',
                                            todayTextColor: theme.colors.primary,
                                            dayTextColor: theme.colors.text,
                                            textDisabledColor: theme.colors.textTertiary,
                                            dotColor: theme.colors.primary,
                                            selectedDotColor: theme.mode === 'dark' ? '#000' : '#fff',
                                            arrowColor: theme.colors.primary,
                                            monthTextColor: theme.colors.text,
                                            indicatorColor: theme.colors.primary,
                                            textDayFontWeight: '600',
                                            textMonthFontWeight: 'bold',
                                            textDayHeaderFontWeight: '600',
                                            textDayFontSize: 14,
                                            textMonthFontSize: 16,
                                            textDayHeaderFontSize: 13,
                                        }}
                                    />
                                </View>
                            </View>
                        </Modal>
                    </View>

                    {/* Botão de Atribuir */}
                    <TouchableOpacity
                        className="rounded-lg py-4 px-6 mt-6 border"
                        style={{
                          backgroundColor: theme.mode === 'dark' 
                            ? 'rgba(249, 115, 22, 0.4)' 
                            : 'rgba(251, 146, 60, 0.2)',
                          borderColor: theme.colors.primary + '50',
                        }}
                        onPress={handleAssignWorkout}
                    >
                        <Text className="font-semibold text-center text-lg" style={{ color: theme.colors.primary }}>
                            ✅ Atribuir Treino
                        </Text>
                    </TouchableOpacity>

                </View>

            </ScrollView>
    );
}