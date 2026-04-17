import { CustomAlert } from '@/components/CustomAlert';
import { FirstTimeTip } from '@/components/FirstTimeTip';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { DEFAULT_EXERCISES } from '@/src/data/defaultExercises';
import { createAssignedWorkouts } from '@/src/services/assignedWorkouts.service';
import { listWorkoutTemplatesByCoachId } from '@/src/services/workoutTemplates.service';
import { requestNotificationPermissions, scheduleWorkoutRemindersForCoach, setupNotificationChannel } from '@/src/services/notifications.service';
import { Exercise, WorkoutBlock, WorkoutBlockData, WorkoutExercise } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

/** Horários de 30 em 30 min: começa às 05:00, vai até 23:30 e continua 00:00→04:30 (dia completo) */
function getAllDayTimes(): string[] {
  const times: string[] = [];
  for (let h = 5; h <= 23; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  for (let h = 0; h <= 4; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return times;
}

const ALL_DAY_TIMES = getAllDayTimes();

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDatePtBr(dateStr: string): string {
  const d = parseLocalDateString(dateStr);
  return d.toLocaleDateString('pt-BR');
}

  const mockExercises: Exercise[] = DEFAULT_EXERCISES;
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
    const { user } = useAuthContext();
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);
    const { athleteId: athleteIdParam } = useLocalSearchParams<{ athleteId?: string }>();
    const athleteId = Array.isArray(athleteIdParam) ? athleteIdParam[0] : athleteIdParam;
  
    // Estado para armazenar qual treino foi selecionado
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
    
    // Estado para armazenar a data escolhida (formato: YYYY-MM-DD)
    const [selectedDate, setSelectedDate] = useState<string>(
      getLocalDateString() // Data de hoje local como padrão
    );

    // Estados para recorrência
    const [isRecurring, setIsRecurring] = useState<boolean>(false);
    const [recurrenceType, setRecurrenceType] = useState<'weekly' | 'monthly'>('weekly');
    const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(null); // 0 = Domingo, 1 = Segunda, etc.
    const [recurrenceCount, setRecurrenceCount] = useState<number>(4); // quantidade de treinos
    const [startDate, setStartDate] = useState<string>(
      getLocalDateString()
    );
    const [showCalendar, setShowCalendar] = useState<boolean>(false);
    const [showWorkoutModal, setShowWorkoutModal] = useState<boolean>(false);
    const [showTimeModal, setShowTimeModal] = useState<boolean>(false);
    // Horário do treino (para lembretes/avisos)
    const [scheduledTime, setScheduledTime] = useState<string>('08:00');
    
    // Estados para CustomAlert
    const [alertVisible, setAlertVisible] = useState<boolean>(false);
    const [alertTitle, setAlertTitle] = useState<string>('');
    const [alertMessage, setAlertMessage] = useState<string>('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);

    // Lista de templates do Firestore (do treinador logado)
    const [allWorkouts, setAllWorkouts] = useState<any[]>([]);
    // Nome do atleta (Firestore coachemAthletes) quando athleteId vem pela navegação
    const [athleteName, setAthleteName] = useState<string | null>(null);
    const [athleteStatus, setAthleteStatus] = useState<string | null>(null);
    // Lista de atletas para seleção quando assign-workout é aberto sem athleteId
    const [athletesList, setAthletesList] = useState<Array<{ id: string; name: string }>>([]);
  
    useEffect(() => {
      if (!athleteId) {
        setAthleteName(null);
        setAthleteStatus(null);
        return;
      }
      import('@/src/services/athletes.service').then(({ getAthleteById }) =>
        getAthleteById(athleteId).then((a) => {
          setAthleteName(a?.name ?? null);
          setAthleteStatus(a?.status ?? 'Ativo');
        })
      );
    }, [athleteId]);

    useEffect(() => {
      if (athleteId || !user?.id) {
        setAthletesList([]);
        return;
      }
      import('@/src/services/athletes.service').then(({ listAthletesByCoachId }) =>
        listAthletesByCoachId(user.id).then((list) =>
          setAthletesList(list.map((a) => ({ id: a.id, name: a.name })))
        )
      );
    }, [athleteId, user?.id]);

    const athlete = athleteId
      ? {
          id: athleteId,
          name: athleteName ?? `Atleta ${athleteId.length > 8 ? athleteId.slice(-8) : athleteId}`,
          status: athleteStatus ?? 'Ativo',
        }
      : null;

    // Carregar templates do Firestore
    const loadAllWorkouts = useCallback(async () => {
        try {
            const coachId = user?.id;
            if (!coachId) {
                setAllWorkouts([]);
                return;
            }
            const templates = await listWorkoutTemplatesByCoachId(coachId);
            setAllWorkouts(templates);
        } catch (error) {
            console.error('❌ Erro ao carregar treinos:', error);
            setAllWorkouts([]);
        }
    }, [user?.id]);

    // Carregar treinos quando a tela abrir
    useEffect(() => {
        loadAllWorkouts();
    }, [loadAllWorkouts]);

    // Quando ativar "Recorrente" ou quando startDate mudar, auto-selecionar o dia da semana
    useEffect(() => {
        if (isRecurring && startDate) {
            const dateObj = parseLocalDateString(startDate);
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
            console.log(`   - Data inicial não era o dia correto, ajustando para: ${getLocalDateString(currentDate)}`);
        } else {
            console.log(`   - Data inicial já é o dia correto, usando: ${getLocalDateString(currentDate)}`);
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

    // Função auxiliar para mostrar alertas customizados
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

    const handleAssignWorkout = async () => {
        if (!selectedWorkoutId) {
            showAlert('Erro', 'Por favor, selecione um treino.', 'error');
            return;
        }

        const workout = allWorkouts.find(w => w.id === selectedWorkoutId);

        if(!workout) {
            showAlert('Erro', 'Treino não encontrado.', 'error');
            return;
        }

        if(!athlete) {
            showAlert('Erro', 'Atleta não encontrado.', 'error');
            return;
        }

        // Validar recorrência
        if (isRecurring) {
            if (!startDate || startDate.trim() === '') {
                showAlert('Erro', 'Por favor, selecione a data inicial.', 'error');
                return;
            }
            if (selectedDayOfWeek === null) {
                showAlert('Erro', 'Por favor, selecione o dia da semana.', 'error');
                return;
            }
        } else {
            if(!selectedDate || selectedDate.trim() === '') {
                showAlert('Erro', 'Por favor, informe a data do treino.', 'error');
                return;
            }
        }

        try {
            const coachId = user?.id;
            if (!coachId) {
                showAlert('Erro', 'Você precisa estar logado para atribuir treinos.', 'error');
                return;
            }

            let datesToAssign: string[] = [];

            if (isRecurring) {
                console.log(`🔄 Gerando treinos recorrentes:`);
                datesToAssign = generateRecurringDates(startDate, selectedDayOfWeek!, recurrenceCount);
            } else {
                datesToAssign = [selectedDate];
            }

            const recurrenceGroupId = isRecurring ? `recurrence_${Date.now()}_${Math.random().toString(36).substr(2,9)}` : null;
            const todayStr = getLocalDateString();

            const newAssignments = datesToAssign.map((date) => {
                const assignedWorkoutId = `assigned_${Date.now()}_${Math.random().toString(36).substr(2,9)}_${date}`;
                return {
                    id: assignedWorkoutId,
                    workoutTemplateId: workout.id,
                    name: workout.name,
                    description: workout.description || '',
                    athleteId: athlete.id,
                    scheduledDate: date,
                    date,
                    scheduledTime,
                    status: 'Pendente',
                    coach: 'Treinador',
                    dayOfWeek: new Date(date).toLocaleDateString('pt-BR', { weekday: 'long'}),
                    isToday: date === todayStr,
                    isThisWeek: isDateThisWeek(date),
                    createdAt: new Date().toISOString(),
                    blocks: workout.blocks || [],
                    isRecurring: !!isRecurring,
                    recurrenceGroupId,
                };
            });

            await createAssignedWorkouts(coachId, newAssignments);
            
            // Agendar lembrete para o TREINADOR (apenas na hora do treino, 1 por aula)
            try {
                const hasPermission = await requestNotificationPermissions();
                if (hasPermission) {
                    await setupNotificationChannel();
                    for (const assignment of newAssignments) {
                        await scheduleWorkoutRemindersForCoach(
                            assignment.id,
                            assignment.date,
                            scheduledTime,
                            workout.name,
                            'workouts'
                        );
                    }
                }
            } catch (notifErr) {
                console.warn('Lembretes não agendados:', notifErr);
            }
            
            console.log('💾 Treinos salvos! Total:', newAssignments.length);

            const message = isRecurring 
                ? `Treino "${workout.name}" atribuído para ${athlete.name} em ${newAssignments.length} datas (${recurrenceCount} treinos)`
                : `Treino "${workout.name}" atribuído para ${athlete.name} em ${selectedDate}`;

            showAlert(
                'Treino Atribuído!',
                message,
                'success',
                () => router.back()
            );

        } catch(error) {
            console.error('Erro ao salvar treino:', error);
            showAlert(
                'Erro',
                'Não foi possível salvar o treino. Tente novamente.',
                'error'
            );
        }
    };

    // Sem athleteId: mostrar seletor de atleta
    if (!athleteId) {
        return (
            <ScrollView className="flex-1" style={themeStyles.bg}>
                <View className="px-6 pt-20 pb-20">
                    <TouchableOpacity className="mb-6 flex-row items-center" onPress={() => router.back()} activeOpacity={0.7}>
                        <View className="rounded-full w-10 h-10 items-center justify-center mr-3 border" style={themeStyles.cardSecondary}>
                            <FontAwesome name="arrow-left" size={18} color={theme.colors.primary} />
                        </View>
                        <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>Voltar</Text>
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold mb-2" style={themeStyles.text}>Atribuir treino</Text>
                    <Text className="mb-6" style={themeStyles.textSecondary}>Selecione o atleta para atribuir o treino.</Text>
                    {athletesList.length === 0 ? (
                        <View className="rounded-xl p-6 border" style={themeStyles.card}>
                            <Text className="text-center mb-4" style={themeStyles.textSecondary}>
                                Nenhum atleta cadastrado. Cadastre um na aba Atletas primeiro.
                            </Text>
                            <TouchableOpacity
                                className="rounded-xl py-3"
                                style={{ backgroundColor: theme.colors.primary }}
                                onPress={() => router.back()}
                            >
                                <Text className="font-semibold text-center" style={{ color: '#fff' }}>Voltar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        athletesList.map((a) => (
                            <TouchableOpacity
                                key={a.id}
                                className="rounded-xl p-4 mb-3 border"
                                style={themeStyles.card}
                                onPress={() => router.push({ pathname: '/assign-workout', params: { athleteId: a.id } })}
                            >
                                <Text className="text-lg font-semibold" style={themeStyles.text}>{a.name}</Text>
                                <Text className="text-sm mt-1" style={themeStyles.textSecondary}>Toque para atribuir treino</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        );
    }

    // athleteId presente mas atleta não encontrado (doc deletado etc.)
    if (!athlete) {
        return (
            <View className="flex-1 justify-center items-center px-6" style={themeStyles.bg}>
                <Text className="text-xl font-bold mb-4" style={themeStyles.text}>Atleta não encontrado</Text>
                <TouchableOpacity className="rounded-lg py-3 px-6" style={{ backgroundColor: theme.colors.primary }} onPress={() => router.back()}>
                    <Text className="font-semibold" style={{ color: '#ffffff' }}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
            <>
            <ScrollView className="flex-1" style={themeStyles.bg}>
                <View className="px-6 pt-20 pb-20">
                    <FirstTimeTip
                      storageKey="tutorial_assign_workout_v1"
                      title="Atribuir treino para o atleta"
                      description="Escolha um atleta (se necessário), selecione um treino da sua biblioteca, defina datas únicas ou recorrentes e confirme para criar os treinos atribuídos."
                    />
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
                                        {selectedDate ? formatDatePtBr(selectedDate) : 'Selecione uma data'}
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
                                        {startDate ? formatDatePtBr(startDate) : 'Selecione a data inicial'}
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
                                                const selectedDateObj = parseLocalDateString(day.dateString);
                                                const dayOfWeek = selectedDateObj.getDay(); // 0 = Domingo, 1 = Segunda, etc.
                                                setSelectedDayOfWeek(dayOfWeek);
                                            } else {
                                                setSelectedDate(day.dateString);
                                            }
                                            setShowCalendar(false);
                                        }}
                                        minDate={getLocalDateString()}
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

                    {/* Horário do treino (para avisos e lembretes) - abre modal com todo o dia de 30 em 30 min */}
                    <View className="mb-6">
                        <Text className="text-xl font-bold mb-2" style={themeStyles.text}>
                            Horário do treino *
                        </Text>
                        <Text className="text-sm mb-3" style={themeStyles.textSecondary}>
                            Toque para escolher o horário (lembretes: 1h antes, 30 min antes e na hora)
                        </Text>
                        <TouchableOpacity
                            className="border rounded-xl px-4 py-3 flex-row items-center justify-between"
                            style={themeStyles.card}
                            onPress={() => setShowTimeModal(true)}
                        >
                            <Text className="text-lg font-semibold" style={themeStyles.text}>
                                {scheduledTime}
                            </Text>
                            <FontAwesome name="clock-o" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Modal
                            visible={showTimeModal}
                            transparent={true}
                            animationType="slide"
                            onRequestClose={() => setShowTimeModal(false)}
                        >
                            <View className="flex-1 bg-black/50 justify-center px-2">
                                <View
                                    className="rounded-3xl border overflow-hidden"
                                    style={[
                                        themeStyles.card,
                                        { maxHeight: '85%', minHeight: 320 },
                                    ]}
                                >
                                    <View className="flex-row justify-between items-center p-4 border-b" style={{ borderBottomColor: theme.colors.border }}>
                                        <Text className="text-xl font-bold" style={themeStyles.text}>
                                            Escolher horário
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setShowTimeModal(false)}
                                            className="rounded-full w-8 h-8 items-center justify-center"
                                            style={themeStyles.cardSecondary}
                                        >
                                            <Text className="text-lg" style={themeStyles.text}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView
                                        className="flex-1"
                                        showsVerticalScrollIndicator={true}
                                        contentContainerStyle={{
                                            padding: 12,
                                            paddingBottom: 24,
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                        }}
                                    >
                                        {ALL_DAY_TIMES.map((time) => {
                                            const isSelected = scheduledTime === time;
                                            return (
                                                <TouchableOpacity
                                                    key={time}
                                                    className="rounded-xl items-center justify-center py-2.5"
                                                    style={{
                                                        width: '31%',
                                                        backgroundColor: isSelected
                                                            ? (theme.mode === 'dark' ? theme.colors.primary + '90' : theme.colors.primary + '50')
                                                            : theme.colors.backgroundTertiary || 'rgba(128,128,128,0.15)',
                                                        borderWidth: isSelected ? 2 : 0,
                                                        borderColor: theme.colors.primary,
                                                    }}
                                                    onPress={() => {
                                                        setScheduledTime(time);
                                                        setShowTimeModal(false);
                                                    }}
                                                >
                                                    <Text
                                                        className="text-sm font-semibold"
                                                        style={{
                                                            color: isSelected
                                                                ? (theme.mode === 'dark' ? '#000' : theme.colors.text)
                                                                : theme.colors.text,
                                                        }}
                                                    >
                                                        {time}
                                                    </Text>
                                                    {isSelected && (
                                                        <FontAwesome name="check" size={14} color={theme.colors.primary} style={{ marginTop: 2 }} />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
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
            
            {/* CustomAlert para substituir Alert.alert */}
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