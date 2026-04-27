/**
 * TELA DE DETALHES DO TREINO
 * 
 * Esta tela mostra os detalhes completos de um treino específico,
 * incluindo lista de exercícios e permite marcar como concluído.
 */

import { CelebrationAnimation } from '@/components/CelebrationAnimation';
import { CustomAlert } from '@/components/CustomAlert';
import { SkeletonCard, SkeletonLoader } from '@/components/SkeletonLoader';
import { FirstTimeTip } from '@/components/FirstTimeTip';
import { useTheme } from '@/src/contexts/ThemeContext';
import { DEFAULT_EXERCISES } from '@/src/data/defaultExercises';
import { db } from '@/src/services/firebase.config';
import { WorkoutBlockData } from '@/src/types';
import { getFeedbackLevel } from '@/src/utils/feedbackIcons';
import type { WorkoutTemplateForApp } from '@/src/services/workoutTemplates.service';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  InputAccessoryView,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';


// Função para buscar os treinos templates (mesma estrutura de workouts-library.tsx)
const getMockWorkoutTemplates = () => {
  // Exercícios mockados (simplificados)
  const mockExercises: any[] = DEFAULT_EXERCISES.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
  }));

  return [
    {
      id: '1',
      name: 'Treino de Força - Pernas',
      description: 'Treino completo para desenvolvimento de força nas pernas',
      blocks: [
        {
          blockType: 'WARM_UP',
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
          ],
        },
        {
          blockType: 'WORK',
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
          ],
        },
        {
          blockType: 'COOL_DOWN',
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
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'Treino de Força - Peito',
      description: 'Treino completo para desenvolvimento de força no peito',
      blocks: [
        {
          blockType: 'WARM_UP',
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
          ],
        },
        {
          blockType: 'WORK',
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
          ],
        },
        {
          blockType: 'COOL_DOWN',
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
          ],
        },
      ],
    },
  ];
};



export default function WorkoutDetailsScreen() {
  const weightInputAccessoryViewId = 'weightInputAccessoryView';
  const router = useRouter();
  const { workoutId: workoutIdRaw } = useLocalSearchParams();
  const workoutId =
    typeof workoutIdRaw === 'string'
      ? workoutIdRaw
      : Array.isArray(workoutIdRaw)
        ? workoutIdRaw[0]
        : undefined;
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  
  // Buscar o treino correspondente
  const [assignedWorkout, setAssignedWorkout] = useState<any>(null);
  const [coachDisplayName, setCoachDisplayName] = useState<string>('Treinador(a)');
  const [workoutTemplate, setWorkoutTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState(''); // Observação opcional do atleta
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Estados para CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | null>(null);
  
  // Animação de pulse para o botão
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
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
  
  // Estados para progresso do treino
  // Set é uma estrutura que não permite valores duplicados - perfeito para IDs de exercícios
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // Estados para modal de exercício e navegação
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const insets = useSafeAreaInsets();
  const exerciseModalScrollRef = useRef<ScrollView>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  
  // Estados para timer de descanso
  const [restTime, setRestTime] = useState(0); // Tempo restante em segundos
  const [isResting, setIsResting] = useState(false);
  
  // Estados para timer de duração (alongamento/desaquecimento) - progressivo
  const [durationTime, setDurationTime] = useState(0); // Tempo decorrido em segundos
  const [durationTotal, setDurationTotal] = useState(0); // Tempo total em segundos
  const [isRunningDuration, setIsRunningDuration] = useState(false);
  
  // Estados para timer de aquecimento - regressivo (countdown)
  const [warmUpTime, setWarmUpTime] = useState(0); // Tempo restante em segundos (countdown)
  const [warmUpTotal, setWarmUpTotal] = useState(0); // Tempo total em segundos
  const [isRunningWarmUp, setIsRunningWarmUp] = useState(false);
  
  // Estados para registro de peso/carga
  const [exerciseWeight, setExerciseWeight] = useState<string>(''); // Peso digitado pelo atleta
  const [savedWeights, setSavedWeights] = useState<Record<string, number>>({}); // Pesos salvos por exercício
  const [weightSaveMessage, setWeightSaveMessage] = useState('');
  const weightInputRef = useRef<TextInput>(null);

  // Animação de pulse contínua no botão
  useEffect(() => {
    if (assignedWorkout?.status === 'Pendente') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [assignedWorkout?.status, pulseAnim]);
  
  // Feedback com ícones próprios (substituindo emojis do sistema)
  const feedbackLevels = [
    { level: 1, emoji: '😊', label: 'Muito Fácil', color: '#10b981', icon: require('../assets/images/FeedbackMuitoFacil.png') },
    { level: 2, emoji: '🙂', label: 'Fácil', color: '#22c55e', icon: require('../assets/images/FeedbackFacil.png') },
    { level: 3, emoji: '😐', label: 'Normal', color: '#f59e0b', icon: require('../assets/images/FeedbackModerado.png') },
    { level: 4, emoji: '😓', label: 'Difícil', color: '#f97316', icon: require('../assets/images/FeedbackDificil.png') },
    { level: 5, emoji: '😰', label: 'Muito Difícil', color: '#ef4444', icon: require('../assets/images/FeedbackMuitoDificil.png') },
  ];


  useEffect(() => {
    const loadWorkoutData = async () => {
      try {
        setLoading(true);
        if (!workoutId) {
          setLoading(false);
          return;
        }
        const { getAssignedWorkoutById } = await import('@/src/services/assignedWorkouts.service');
        const found = await getAssignedWorkoutById(workoutId);
        if (!found) {
          showAlert('Erro', 'Treino não encontrado', 'error', () => router.back());
          return;
        }

        setAssignedWorkout(found);
        const workoutCoachPublicName =
          typeof found?.coachPublicName === 'string' ? found.coachPublicName.trim() : '';
        const workoutCoachRaw = typeof found?.coach === 'string' ? found.coach.trim() : '';
        const workoutCoachLower = workoutCoachRaw.toLowerCase();
        const workoutCoachIsGeneric =
          !workoutCoachRaw || workoutCoachLower === 'treinador' || workoutCoachLower === 'coach' || workoutCoachLower === 'treinador(a)';

        if (workoutCoachPublicName) {
          setCoachDisplayName(workoutCoachPublicName);
        } else if (!workoutCoachIsGeneric) {
          setCoachDisplayName(workoutCoachRaw);
        } else {
          try {
            const athleteDoc = await getDoc(doc(db, 'coachemAthletes', found.athleteId));
            const fromAthleteDoc =
              typeof athleteDoc.data()?.coachPublicName === 'string'
                ? athleteDoc.data()?.coachPublicName.trim()
                : '';
            setCoachDisplayName(fromAthleteDoc || 'Treinador(a)');
          } catch {
            setCoachDisplayName('Treinador(a)');
          }
        }

        const { enrichWorkoutBlocksWithLatestExercises } = await import('@/src/services/exercises.service');

        if (found.blocks && found.blocks.length > 0) {
          const blockTypes = ['WARM_UP', 'WORK', 'COOL_DOWN'] as const;
          const blocks = found.blocks.map((b: { blockType?: string; exercises?: unknown[] }, i: number) => ({
            ...b,
            blockType: b.blockType ?? blockTypes[Math.min(i, 2)],
            exercises: b.exercises ?? [],
          }));
          const enriched = await enrichWorkoutBlocksWithLatestExercises(blocks as any);
          setWorkoutTemplate({
            id: found.workoutTemplateId || found.id,
            name: found.name,
            blocks: enriched,
          });
        } else {
          const { getWorkoutTemplateById } = await import('@/src/services/workoutTemplates.service');
          let template: WorkoutTemplateForApp | null = await getWorkoutTemplateById(
            found.workoutTemplateId
          );
          if (!template) {
            const mockTemplates = getMockWorkoutTemplates();
            const fromMock = mockTemplates.find((t: any) => t.id === found.workoutTemplateId);
            template = fromMock ? (fromMock as WorkoutTemplateForApp) : null;
          }
          if (!template) {
            const savedTemplatesJson = await AsyncStorage.getItem('workout_templates');
            if (savedTemplatesJson) {
              const savedTemplates = JSON.parse(savedTemplatesJson);
              const fromSaved = savedTemplates.find((t: any) => t.id === found.workoutTemplateId);
              template = fromSaved ? (fromSaved as WorkoutTemplateForApp) : null;
            }
          }
          if (template) {
            const enriched = await enrichWorkoutBlocksWithLatestExercises((template.blocks || []) as any);
            setWorkoutTemplate({ ...template, blocks: enriched });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar treino:', error);
        showAlert('Erro', 'Não foi possível carregar o treino', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadWorkoutData();
  }, [workoutId]);

  // Função para calcular porcentagem de conclusão
  const calculateCompletionPercentage = useCallback((completedSet: Set<string>) => {
    // Contar total de exercícios em todos os blocos
    let totalExercises = 0;
    if (workoutTemplate?.blocks) {
      workoutTemplate.blocks.forEach((block: any) => {
        totalExercises += block.exercises?.length || 0;
      });
    }
    
    // Se não há exercícios, porcentagem é 0
    if (totalExercises === 0) {
      setCompletionPercentage(0);
      return;
    }
    
    // Calcular porcentagem: (concluídos / total) × 100
    const percentage = (completedSet.size / totalExercises) * 100;
    setCompletionPercentage(Math.round(percentage)); // Arredondar para número inteiro
  }, [workoutTemplate]);

  // Função para marcar ou desmarcar um exercício como concluído
  const toggleExercise = useCallback((exerciseId: string) => {
    // Criar um novo Set (não modificar o antigo diretamente - imutabilidade)
    const newCompleted = new Set(completedExercises);
    
    // Se o exercício já está marcado, desmarcar
    // Se não está marcado, marcar
    if (newCompleted.has(exerciseId)) {
      newCompleted.delete(exerciseId);
    } else {
      newCompleted.add(exerciseId);
    }
    
    // Atualizar o estado
    setCompletedExercises(newCompleted);
    
    // Calcular nova porcentagem
    calculateCompletionPercentage(newCompleted);
  }, [completedExercises, calculateCompletionPercentage]);

  // Carregar progresso salvo quando o treino for carregado
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!workoutId || !workoutTemplate || !assignedWorkout) return;
      
      try {
        const savedProgressJson = await AsyncStorage.getItem(`workout_progress_${workoutId}`);
        if (savedProgressJson) {
          const savedProgress = JSON.parse(savedProgressJson);
          // Converter array de volta para Set (garantir que são strings)
          const savedArray = (savedProgress.completedExercises || []) as string[];
          const savedSet = new Set<string>(savedArray);
          setCompletedExercises(savedSet);
          calculateCompletionPercentage(savedSet);
        } else {
          // Se não há progresso salvo mas o treino está concluído,
          // assumir que todos os exercícios foram feitos (100%)
          if (assignedWorkout.status === 'Concluído') {
            // Marcar todos como concluídos
            const allCompleted = new Set<string>();
            workoutTemplate.blocks?.forEach((block: any, blockIndex: number) => {
              block.exercises?.forEach((exercise: any, exerciseIndex: number) => {
                const exerciseId = exercise.exerciseId || `block_${blockIndex}_ex_${exerciseIndex}`;
                allCompleted.add(exerciseId);
              });
            });
            setCompletedExercises(allCompleted);
            setCompletionPercentage(100);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      }
    };
    
    loadSavedProgress();
  }, [workoutId, workoutTemplate, calculateCompletionPercentage, assignedWorkout]);

  // Salvar progresso automaticamente sempre que mudar
  useEffect(() => {
    const saveProgress = async () => {
      if (!workoutId || !workoutTemplate || completedExercises.size === 0) return;
      
      try {
        // Converter Set para array (AsyncStorage não aceita Set diretamente)
        const progressToSave = {
          completedExercises: Array.from(completedExercises),
          lastUpdated: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(
          `workout_progress_${workoutId}`,
          JSON.stringify(progressToSave)
        );
      } catch (error) {
        console.error('Erro ao salvar progresso:', error);
      }
    };
    
    saveProgress();
  }, [completedExercises, workoutId, workoutTemplate]);

  // Timer de descanso - contador regressivo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            // Vibrar quando o timer acabar
            Vibration.vibrate(400);
            // Mostrar alerta
            showAlert('Descanso Concluído', 'Hora de continuar o treino!', 'success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restTime]);

  // Timer de duração (alongamento) - contador progressivo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isRunningDuration && durationTime < durationTotal) {
      interval = setInterval(() => {
        setDurationTime((prev) => {
          if (prev >= durationTotal - 1) {
            setIsRunningDuration(false);
            // Vibrar quando o timer acabar
            Vibration.vibrate(400);
            // Mostrar alerta
            showAlert('Tempo Concluído', 'Alongamento completo!', 'success');
            return durationTotal;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunningDuration, durationTime, durationTotal]);

  // Timer de aquecimento - contador regressivo (countdown)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (isRunningWarmUp && warmUpTime > 0) {
      interval = setInterval(() => {
        setWarmUpTime((prev) => {
          if (prev <= 1) {
            setIsRunningWarmUp(false);
            // Vibrar quando o timer acabar (padrão: 400ms)
            Vibration.vibrate(400);
            // Mostrar alerta
            showAlert('Aquecimento Concluído', 'Hora de começar o treino!', 'success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunningWarmUp, warmUpTime]);

  // Função para calcular o índice total do exercício (considerando todos os blocos)
  const getTotalExerciseIndex = useCallback((blockIndex: number, exerciseIndex: number): number => {
    if (!workoutTemplate?.blocks) return 0;
    
    let totalIndex = 0;
    for (let i = 0; i < blockIndex; i++) {
      totalIndex += workoutTemplate.blocks[i]?.exercises?.length || 0;
    }
    return totalIndex + exerciseIndex;
  }, [workoutTemplate]);

  // Função para calcular o total de exercícios
  const getTotalExercises = useCallback((): number => {
    if (!workoutTemplate?.blocks) return 0;
    let total = 0;
    workoutTemplate.blocks.forEach((block: any) => {
      total += block.exercises?.length || 0;
    });
    return total;
  }, [workoutTemplate]);

  // Função para encontrar o exercício atual pelos índices
  const getCurrentExercise = useCallback(() => {
    if (currentBlockIndex === null || currentExerciseIndex === null || !workoutTemplate?.blocks) {
      return null;
    }
    return workoutTemplate.blocks[currentBlockIndex]?.exercises?.[currentExerciseIndex] || null;
  }, [currentBlockIndex, currentExerciseIndex, workoutTemplate]);

  // Função para abrir exercício no modal
  const openExercise = useCallback((blockIndex: number, exerciseIndex: number) => {
    // Resetar timers ao abrir novo exercício
    setIsResting(false);
    setRestTime(0);
    setIsRunningDuration(false);
    setDurationTime(0);
    setDurationTotal(0);
    setIsRunningWarmUp(false);
    setWarmUpTime(0);
    setWarmUpTotal(0);
    
    setCurrentBlockIndex(blockIndex);
    setCurrentExerciseIndex(exerciseIndex);
    setShowExerciseModal(true);
  }, []);

  // Função para navegar para o próximo exercício
  const goToNextExercise = useCallback(() => {
    if (currentBlockIndex === null || currentExerciseIndex === null || !workoutTemplate?.blocks) return;
    
    const currentBlock = workoutTemplate.blocks[currentBlockIndex];
    const nextExerciseIndex = currentExerciseIndex + 1;
    
    // Se há próximo exercício no mesmo bloco
    if (nextExerciseIndex < (currentBlock?.exercises?.length || 0)) {
      setCurrentExerciseIndex(nextExerciseIndex);
      return;
    }
    
    // Se não há, procurar no próximo bloco
    const nextBlockIndex = currentBlockIndex + 1;
    if (nextBlockIndex < workoutTemplate.blocks.length) {
      const nextBlock = workoutTemplate.blocks[nextBlockIndex];
      if (nextBlock?.exercises && nextBlock.exercises.length > 0) {
        setCurrentBlockIndex(nextBlockIndex);
        setCurrentExerciseIndex(0);
        return;
      }
    }
    
    // Se não há próximo exercício, fechar modal
    setShowExerciseModal(false);
    showAlert('Treino Completo', 'Você chegou ao final do treino!', 'success');
  }, [currentBlockIndex, currentExerciseIndex, workoutTemplate]);

  // Função para navegar para o exercício anterior
  const goToPreviousExercise = useCallback(() => {
    if (currentBlockIndex === null || currentExerciseIndex === null || !workoutTemplate?.blocks) return;
    
    const prevExerciseIndex = currentExerciseIndex - 1;
    
    // Se há exercício anterior no mesmo bloco
    if (prevExerciseIndex >= 0) {
      setCurrentExerciseIndex(prevExerciseIndex);
      return;
    }
    
    // Se não há, procurar no bloco anterior
    const prevBlockIndex = currentBlockIndex - 1;
    if (prevBlockIndex >= 0) {
      const prevBlock = workoutTemplate.blocks[prevBlockIndex];
      if (prevBlock?.exercises && prevBlock.exercises.length > 0) {
        setCurrentBlockIndex(prevBlockIndex);
        setCurrentExerciseIndex(prevBlock.exercises.length - 1);
        return;
      }
    }
    
    // Se não há exercício anterior, não fazer nada (já está no primeiro)
  }, [currentBlockIndex, currentExerciseIndex, workoutTemplate]);

  // Função para iniciar timer de descanso
  const startRestTimer = useCallback((seconds: number) => {
    setRestTime(seconds);
    setIsResting(true);
  }, []);

  // Função para pular descanso
  const skipRest = useCallback(() => {
    setRestTime(0);
    setIsResting(false);
  }, []);

  // Função para iniciar timer de duração (alongamento) - progressivo
  const startDurationTimer = useCallback((totalSeconds: number) => {
    setDurationTotal(totalSeconds);
    setDurationTime(0);
    setIsRunningDuration(true);
  }, []);

  // Função para parar timer de duração
  const stopDurationTimer = useCallback(() => {
    setIsRunningDuration(false);
    setDurationTime(0);
  }, []);

  // Função para iniciar timer de aquecimento - regressivo (countdown)
  const startWarmUpTimer = useCallback((totalSeconds: number) => {
    setWarmUpTotal(totalSeconds);
    setWarmUpTime(totalSeconds);
    setIsRunningWarmUp(true);
  }, []);

  // Função para parar timer de aquecimento
  const stopWarmUpTimer = useCallback(() => {
    setIsRunningWarmUp(false);
    setWarmUpTime(0);
  }, []);

  // Função para salvar peso usado no exercício
  const saveExerciseWeight = useCallback(async (exerciseId: string, weight: number, workoutId: string) => {
    try {
      const athleteId = assignedWorkout?.athleteId;
      if (!athleteId) {
        showAlert('Erro', 'Não foi possível identificar o atleta para salvar a evolução', 'error');
        return;
      }

      const exerciseName = getCurrentExercise()?.exercise?.name || 'Exercício';

      const { addExerciseWeightRecord } = await import('@/src/services/exerciseWeightHistory.service');
      await addExerciseWeightRecord({
        athleteId,
        workoutId,
        exerciseId,
        exerciseName,
        weight,
        date: new Date().toISOString(),
      });

      // Compatibilidade temporária com dados locais já existentes.
      // Buscar histórico existente
      const weightHistoryJson = await AsyncStorage.getItem('exercise_weight_history');
      const weightHistory = weightHistoryJson ? JSON.parse(weightHistoryJson) : [];
      
      // Criar novo registro
      const newRecord = {
        id: `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        exerciseId: exerciseId,
        exerciseName,
        weight: weight,
        date: new Date().toISOString(),
        workoutId: workoutId,
        athleteId,
      };
      
      // Adicionar ao histórico
      weightHistory.push(newRecord);
      
      // Salvar de volta
      await AsyncStorage.setItem('exercise_weight_history', JSON.stringify(weightHistory));
      
      // Atualizar estado local
      setSavedWeights(prev => ({
        ...prev,
        [exerciseId]: weight,
      }));
      
      // Limpar campo de input
      setExerciseWeight('');

      // Mantém o modal aberto: feedback discreto evita empilhar Modal por cima de Modal no iOS.
      setWeightSaveMessage(`Peso ${weight}kg salvo com sucesso!`);
      setTimeout(() => setWeightSaveMessage(''), 1800);
    } catch (error) {
      console.error('Erro ao salvar peso:', error);
      showAlert('Erro', 'Não foi possível salvar o peso', 'error');
    }
  }, [assignedWorkout, getCurrentExercise]);

  // Carregar peso salvo para o exercício atual
  useEffect(() => {
    const loadSavedWeight = async () => {
      if (!showExerciseModal || currentBlockIndex === null || currentExerciseIndex === null) return;
      
      const exercise = getCurrentExercise();
      if (!exercise) return;
      
      const exerciseId = exercise.exerciseId || `block_${currentBlockIndex}_ex_${currentExerciseIndex}`;
      
      try {
        const athleteId = assignedWorkout?.athleteId;
        if (!athleteId) return;

        const { getLatestExerciseWeightForAthlete } = await import('@/src/services/exerciseWeightHistory.service');
        const lastRecord = await getLatestExerciseWeightForAthlete(athleteId, exerciseId);

        if (lastRecord) {
          setSavedWeights(prev => ({
            ...prev,
            [exerciseId]: lastRecord.weight,
          }));
          return;
        }

        // Fallback para histórico local legado.
        const weightHistoryJson = await AsyncStorage.getItem('exercise_weight_history');
        if (!weightHistoryJson) return;
        const weightHistory = JSON.parse(weightHistoryJson);
        const localLastRecord = weightHistory
          .filter((r: any) => r.exerciseId === exerciseId && r.athleteId === athleteId)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (localLastRecord) {
          setSavedWeights(prev => ({
            ...prev,
            [exerciseId]: localLastRecord.weight,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar peso salvo:', error);
      }
    };
    
    loadSavedWeight();
  }, [showExerciseModal, currentBlockIndex, currentExerciseIndex, getCurrentExercise, assignedWorkout?.athleteId]);



  // Se não encontrou o treino, volta para a tela anterior
  if (loading) {
    return (
      <ScrollView className="flex-1" style={themeStyles.bg}>
        <View className="px-6 pt-20 pb-20">
          {/* Skeleton do Header */}
          <View className="mb-6">
            <SkeletonLoader width="60%" height={32} borderRadius={8} style={{ marginBottom: 12 }} />
            <SkeletonLoader width="40%" height={20} borderRadius={8} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="50%" height={20} borderRadius={8} />
          </View>
          
          {/* Skeleton do Progresso */}
          <View className="rounded-xl p-4 mb-6 border" style={themeStyles.card}>
            <SkeletonLoader width="50%" height={20} borderRadius={8} style={{ marginBottom: 16 }} />
            <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="40%" height={16} borderRadius={8} />
          </View>
          
          {/* Skeleton dos Blocos */}
          {Array.from({ length: 3 }).map((_, blockIndex) => (
            <View key={blockIndex} className="mb-6">
              <SkeletonLoader width="40%" height={24} borderRadius={8} style={{ marginBottom: 12 }} />
              {Array.from({ length: 2 }).map((_, exerciseIndex) => (
                <SkeletonCard key={exerciseIndex} lines={3} />
              ))}
            </View>
          ))}
          
          {/* Skeleton do Botão */}
          <SkeletonLoader width="100%" height={56} borderRadius={12} />
        </View>
      </ScrollView>
    );
  }

  if (!assignedWorkout) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={themeStyles.bg}>
        <Text className='text-xl font-bold mb-4' style={themeStyles.text}>
          Treino não encontrado
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
    )
  }

  const handleMarkAsCompleted = () => {
    // Abrir modal de feedback primeiro
    setShowFeedbackModal(true);
  };

  const handleConfirmCompletion = async () => {
    if (selectedFeedback === null) {
      showAlert(
        'Atenção',
        'Por favor, selecione como você se sentiu após o treino.',
        'warning'
      );
      return;
    }
    if (!workoutId) {
      showAlert('Erro', 'Treino inválido', 'error');
      return;
    }

    try {
      // 1. Salvar progresso atual antes de marcar como concluído
      // Se não há progresso salvo, marcar todos os exercícios como concluídos
      if (completedExercises.size === 0 && workoutTemplate) {
        const allCompleted = new Set<string>();
        workoutTemplate.blocks?.forEach((block: any, blockIndex: number) => {
          block.exercises?.forEach((exercise: any, exerciseIndex: number) => {
            const exerciseId = exercise.exerciseId || `block_${blockIndex}_ex_${exerciseIndex}`;
            allCompleted.add(exerciseId);
          });
        });
        setCompletedExercises(allCompleted);
        setCompletionPercentage(100);
        
        // Salvar progresso completo
        const progressToSave = {
          completedExercises: Array.from(allCompleted),
          lastUpdated: new Date().toISOString(),
        };
        await AsyncStorage.setItem(
          `workout_progress_${workoutId}`,
          JSON.stringify(progressToSave)
        );
      }
      
      // 2. Atualizar no Firestore
      const { updateAssignedWorkout } = await import('@/src/services/assignedWorkouts.service');
      await updateAssignedWorkout(workoutId, {
        status: 'Concluído',
        completedDate: new Date().toISOString(),
        feedback: selectedFeedback,
        feedbackEmoji: feedbackLevels[selectedFeedback - 1].emoji,
        feedbackText: feedbackText.trim() || undefined,
      });

      // 3. Atualizar o estado local
      setAssignedWorkout({
        ...assignedWorkout,
        status: 'Concluído',
        completedDate: new Date().toISOString(),
        feedback: selectedFeedback,
        feedbackEmoji: feedbackLevels[selectedFeedback - 1].emoji,
        feedbackText: feedbackText.trim() || undefined,
      });
      
      // 6. Fechar modal e mostrar animação de celebração
      setShowFeedbackModal(false);
      setFeedbackText('');
      setShowCelebration(true);
      
      // Após animação, mostrar alerta customizado e voltar
      setTimeout(() => {
        showAlert(
          'Treino Concluído',
          `Parabéns! Você concluiu o treino "${assignedWorkout?.name}"`,
          'success',
          () => {
            setShowCelebration(false);
            router.back();
          }
        );
      }, 500);
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error);
      showAlert('Erro', 'Não foi possível marcar o treino como concluído', 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <ScrollView
      className="flex-1"
      style={[{ flex: 1 }, themeStyles.bg]}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
      nestedScrollEnabled
    >
      <View className="px-6 pt-20 pb-20">
        <FirstTimeTip
          storageKey="tutorial_workout_details_v1"
          title="Como usar o treino"
          description="Passe pelos blocos do treino, toque nos exercícios para ver detalhes e vá marcando o que concluir. No final, envie seu feedback para o treinador saber como foi a sessão."
        />
        {/* Header: Pressable (evita conflito de gesto com ScrollView no iOS) */}
        <Pressable
          className="mb-6 flex-row items-center self-start"
          onPress={() => router.back()}
          hitSlop={16}
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, zIndex: 10 })}
        >
          <View className="rounded-full w-10 h-10 items-center justify-center mr-3 border" style={themeStyles.cardSecondary}>
            <FontAwesome name="arrow-left" size={18} color={theme.colors.primary} />
          </View>
          <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>
            Voltar
          </Text>
        </Pressable>

                {/* Informações do treino */}
                <View className="mb-6">
          <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
            {assignedWorkout.name}
          </Text>
          <Text className="mb-1" style={themeStyles.textSecondary}>
            Treinador: {coachDisplayName}
          </Text>
          <Text className="mb-4" style={themeStyles.textSecondary}>
            Data: {new Date(assignedWorkout.date).toLocaleDateString('pt-BR')} ({assignedWorkout.dayOfWeek})
            {assignedWorkout.scheduledTime ? ` • ${assignedWorkout.scheduledTime}` : ''}
          </Text>

          {/* Indicador de Progresso - Disco Circular + Barra */}
          {workoutTemplate && (() => {
            // Calcular total de exercícios
            let totalExercises = 0;
            workoutTemplate.blocks?.forEach((block: any) => {
              totalExercises += block.exercises?.length || 0;
            });
            
            // Cores baseadas no status
            const progressColor = assignedWorkout.status === 'Concluído' 
              ? '#10b981' // Verde quando concluído
              : '#fb923c'; // Laranja quando pendente
            
            const textColor = assignedWorkout.status === 'Concluído'
              ? 'text-green-400'
              : 'text-primary-400';
            
            return (
              <View className="mb-4 rounded-xl p-4 border" style={themeStyles.card}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-semibold text-base flex-1" style={themeStyles.text}>
                    Progresso do Treino
                  </Text>
                  
                  {/* Disco Circular de Percentual - Solução Simples */}
                  <View className="items-center justify-center ml-4">
                    <View 
                      className="w-20 h-20 rounded-full items-center justify-center"
                      style={{
                        borderWidth: 6,
                        borderColor: progressColor,
                        backgroundColor: theme.colors.backgroundTertiary,
                      }}
                    >
                      <Text 
                        className="font-bold text-xl"
                        style={{ 
                          color: progressColor,
                          textAlign: 'center',
                          includeFontPadding: false,
                        }}
                      >
                        {completionPercentage}%
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Barra visual de progresso */}
                <View className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${completionPercentage}%`,
                      backgroundColor: progressColor,
                    }}
                  />
                </View>
                
                <Text className="text-xs text-center" style={themeStyles.textSecondary}>
                  {completedExercises.size} de {totalExercises} exercícios concluídos
                </Text>
              </View>
            );
          })()}
          
          {/* Badge de status */}
          <View className={`self-start px-4 py-2 rounded-full ${
            assignedWorkout.status === 'Concluído'
              ? 'bg-green-500/20 border border-green-500/30'
              : 'bg-yellow-500/20 border border-yellow-500/30'
          }`}>
            <Text className={`text-sm font-semibold ${
              assignedWorkout.status === 'Concluído'
                ? 'text-green-400'
                : 'text-yellow-400'
            }`}>
              {assignedWorkout.status}
            </Text>
          </View>

          {/* Seu feedback (emoji + observação) - visível para o atleta no próprio treino */}
          {assignedWorkout.status === 'Concluído' && (assignedWorkout.feedback || assignedWorkout.feedbackEmoji || assignedWorkout.feedbackText) && (
            <View className="mt-4 rounded-xl p-4 border" style={themeStyles.card}>
              <Text className="font-semibold mb-2" style={themeStyles.text}>
                Seu feedback
              </Text>
              <View className="flex-row flex-wrap items-center gap-2 mb-2">
                {(() => {
                  const level = getFeedbackLevel(assignedWorkout.feedback, assignedWorkout.feedbackEmoji);
                  if (level != null) {
                    return (
                      <Image
                        source={feedbackLevels[level - 1].icon}
                        style={{ width: 48, height: 48 }}
                        resizeMode="contain"
                      />
                    );
                  }
                  if (assignedWorkout.feedbackEmoji) {
                    return (
                      <Text className="text-4xl" style={{ lineHeight: 48 }}>
                        {assignedWorkout.feedbackEmoji}
                      </Text>
                    );
                  }
                  return null;
                })()}
                {assignedWorkout.completedDate && (
                  <Text className="text-sm" style={themeStyles.textTertiary}>
                    {new Date(assignedWorkout.completedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                )}
              </View>
              {assignedWorkout.feedbackText ? (
                <Text className="text-sm leading-5" style={themeStyles.textSecondary}>
                  "{assignedWorkout.feedbackText}"
                </Text>
              ) : null}
            </View>
          )}
        </View>

                {/* Lista de blocos e exercícios */}
          {workoutTemplate && (
          <View className="mb-6">
            <Text className="text-2xl font-bold mb-4" style={themeStyles.text}>
              Detalhes do Treino
            </Text>
            
            {workoutTemplate.blocks.map((block: WorkoutBlockData, blockIndex: number) => {
              const blockNames: Record<string, string> = {
                WARM_UP: 'Aquecimento',
                WORK: 'Trabalho Principal',
                COOL_DOWN: 'Finalização',
              };
              const blockIcons: Record<string, any> = {
                WARM_UP: require('../assets/images/IconeAquecimento.png'),
                WORK: require('../assets/images/IconeTrabalhoPrincipal.png'),
                COOL_DOWN: require('../assets/images/IconeFinalizacao.png'),
              };
              
              return (
                <View key={blockIndex} className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <Image
                      source={blockIcons[block.blockType]}
                      style={{ width: 48, height: 48, marginRight: 10 }}
                      resizeMode="contain"
                    />
                    <Text className="text-xl font-semibold" style={themeStyles.text}>
                      {blockNames[block.blockType] || block.blockType}
                    </Text>
                  </View>
                  
                  {block.exercises.map((exercise: any, exerciseIndex: number) => {
                    // Criar ID único para este exercício
                    const exerciseUniqueId = exercise.exerciseId || `block_${blockIndex}_ex_${exerciseIndex}`;
                    const isCompleted = completedExercises.has(exerciseUniqueId);
                    
                    const pending = assignedWorkout.status === 'Pendente';
                    return (
                      <View
                        key={`${blockIndex}-${exerciseIndex}-${exerciseUniqueId}`}
                        className="rounded-xl mb-3 border"
                        style={{
                          ...themeStyles.card,
                          borderColor: isCompleted ? 'rgba(16, 185, 129, 0.5)' : theme.colors.border,
                          shadowColor: isCompleted ? '#10b981' : '#fb923c',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isCompleted ? 0.2 : 0.1,
                          shadowRadius: 4,
                          elevation: 4,
                          position: 'relative',
                          overflow: 'visible',
                        }}
                        collapsable={false}
                      >
                        <Pressable
                          onPress={() => openExercise(blockIndex, exerciseIndex)}
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.92 : 1,
                          })}
                        >
                          <View
                            style={{
                              paddingVertical: 16,
                              paddingLeft: 18,
                              paddingRight: pending ? 52 : 18,
                            }}
                          >
                            <Text className="text-lg font-semibold mb-2 pr-1"
                              style={{
                                color: isCompleted ? '#10b981' : theme.colors.text,
                                textDecorationLine: isCompleted ? 'line-through' : 'none',
                              }}
                            >
                              {exercise.exercise?.name || `Exercício ${exerciseIndex + 1}`}
                            </Text>
                            
                            {exercise.exercise?.description && (
                              <Text className="text-sm mb-2" style={themeStyles.textSecondary}>
                                {exercise.exercise.description}
                              </Text>
                            )}
                            
                            <View className="flex-row gap-3 flex-wrap">
                              {exercise.sets && (
                                <View
                                  className="rounded-lg px-3 py-2 border items-center"
                                  style={{
                                    backgroundColor: theme.colors.primary + '1f',
                                    borderColor: theme.colors.primary + '55',
                                    minWidth: 52,
                                  }}
                                >
                                  <Text className="text-[10px] font-semibold mb-0.5 text-center" style={{ color: theme.colors.primary }}>
                                    Séries
                                  </Text>
                                  <Text className="text-xl font-bold text-center" style={themeStyles.text}>
                                    {exercise.sets}
                                  </Text>
                                </View>
                              )}
                              {exercise.reps && (
                                <View
                                  className="rounded-lg px-3 py-2 border items-center"
                                  style={{
                                    backgroundColor: theme.colors.primary + '1f',
                                    borderColor: theme.colors.primary + '55',
                                    minWidth: 76,
                                  }}
                                >
                                  <Text className="text-[10px] font-semibold mb-0.5 text-center" style={{ color: theme.colors.primary }}>
                                    Repetições
                                  </Text>
                                  <Text className="text-xl font-bold text-center" style={themeStyles.text}>
                                    {exercise.reps}
                                  </Text>
                                </View>
                              )}
                              {exercise.duration && (
                                <Text style={themeStyles.textSecondary}>
                                  Duração: {Math.floor(exercise.duration / 60)}min
                                </Text>
                              )}
                              {exercise.restTime && (
                                <Text style={themeStyles.textSecondary}>
                                  Descanso: {exercise.restTime}s
                                </Text>
                              )}
                            </View>
                            
                            {exercise.notes && (
                              <Text className="text-sm mt-2 italic" style={themeStyles.textTertiary}>
                                💡 {exercise.notes}
                              </Text>
                            )}
                          </View>
                        </Pressable>
                        {pending && (
                          <View
                            pointerEvents="box-none"
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              zIndex: 30,
                              elevation: 8,
                            }}
                          >
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Alternar exercício concluído"
                              onPress={() => toggleExercise(exerciseUniqueId)}
                              hitSlop={12}
                              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                            >
                              <View
                                className="w-7 h-7 rounded-full border-2 items-center justify-center"
                                style={{
                                  backgroundColor: isCompleted ? '#10b981' : theme.colors.backgroundTertiary,
                                  borderColor: isCompleted ? '#10b981' : theme.colors.primary,
                                  ...(isCompleted
                                    ? {
                                        shadowColor: '#10b981',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 4,
                                        elevation: 4,
                                      }
                                    : {}),
                                }}
                              >
                                {isCompleted && <FontAwesome name="check" size={14} color="#fff" />}
                              </View>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        {/* Concluir treino no fim do conteúdo (após último bloco/exercício), não fixo na base */}
        {assignedWorkout.status === 'Pendente' && (
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              marginBottom: Math.max(insets.bottom, 24) + 30,
            }}
          >
            <TouchableOpacity
              className="rounded-lg py-4 px-6"
              style={{
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={handleMarkAsCompleted}
            >
              <Text className="font-semibold text-center text-lg" style={{ color: '#ffffff' }}>
                Marcar como Concluído
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Mensagem se já estiver concluído */}
        {assignedWorkout.status === 'Concluído' && (
          <View className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <Text className="text-green-400 font-semibold text-center">
              ✅ Este treino já foi concluído!
            </Text>
          </View>
        )}
       
      </View>
    </ScrollView>

      {/* Fora do ScrollView: overlays não roubam toques da lista nem do Voltar */}
      <CelebrationAnimation
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
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

        {/* Modal de Exercício Focado */}
        {showExerciseModal && currentBlockIndex !== null && currentExerciseIndex !== null && (() => {
          const exercise = getCurrentExercise();
          if (!exercise) return null;
          
          const exerciseUniqueId = exercise.exerciseId || `block_${currentBlockIndex}_ex_${currentExerciseIndex}`;
          const isCompleted = completedExercises.has(exerciseUniqueId);
          const totalExercises = getTotalExercises();
          const currentTotalIndex = getTotalExerciseIndex(currentBlockIndex, currentExerciseIndex);
          const exerciseNumber = currentTotalIndex + 1;
          
          // Verificar se há próximo/anterior
          const hasNext = currentTotalIndex < totalExercises - 1;
          const hasPrevious = currentTotalIndex > 0;
          
          // Formatar tempo de descanso
          const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
          };
          
          return (
            <Modal
              visible={showExerciseModal}
              transparent={true}
              animationType="slide"
              statusBarTranslucent
              navigationBarTranslucent
              presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
              onRequestClose={() => setShowExerciseModal(false)}
            >
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top, 8) : 0}
              >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.82)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingTop: Math.max(insets.top, 8),
                  paddingBottom: Math.max(insets.bottom, 12),
                }}
              >
                <View
                  className="rounded-3xl w-full max-w-md border"
                  style={{
                    ...themeStyles.card,
                    maxHeight: '94%',
                    minHeight: 0,
                    overflow: 'hidden',
                    borderColor: theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.35)' : '#000000',
                  }}
                >
                  {/* Header do Modal */}
                  <View className="flex-row items-center justify-between mb-4 px-6 pt-6">
                    <Pressable
                      onPress={() => {
                        setIsResting(false);
                        setRestTime(0);
                        setIsRunningDuration(false);
                        setDurationTime(0);
                        setDurationTotal(0);
                        setIsRunningWarmUp(false);
                        setWarmUpTime(0);
                        setWarmUpTotal(0);
                        setShowExerciseModal(false);
                      }}
                      hitSlop={14}
                      className="p-2"
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <FontAwesome name="times" size={20} color={theme.colors.text} />
                    </Pressable>
                    <Text className="font-semibold text-lg" style={themeStyles.text}>
                      Exercício {exerciseNumber} de {totalExercises}
                    </Text>
                    <View className="w-8" />
                  </View>
                  
                  {/* Detalhes do Exercício */}
                  <ScrollView
                    ref={exerciseModalScrollRef}
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                  >
                    <Text className="text-2xl font-bold mb-2" style={themeStyles.text}>
                      {exercise.exercise?.name || `Exercício ${exerciseNumber}`}
                    </Text>
                    
                    {exercise.exercise?.description && (
                      <Text className="text-sm mb-4" style={themeStyles.textSecondary}>
                        {exercise.exercise.description}
                      </Text>
                    )}

                    {/* Vídeo do Exercício - player dentro do app (mobile) */}
                    {exercise.exercise?.videoURL && (
                      <View className="rounded-xl overflow-hidden mb-4" style={themeStyles.cardSecondary}>
                        <Video
                          source={{ uri: exercise.exercise.videoURL }}
                          style={{ width: '100%', height: 200 }}
                          useNativeControls
                          resizeMode={ResizeMode.CONTAIN}
                          shouldPlay={false}
                        />
                      </View>
                    )}
                    
                    <View className="rounded-xl p-4 mb-4" style={themeStyles.cardSecondary}>
                      <View className="flex-row gap-4 flex-wrap mb-2">
                        {exercise.sets && (
                          <View className="flex-1 min-w-[100px]">
                            <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Séries</Text>
                            <Text className="font-bold text-3xl" style={{ color: theme.colors.primary }}>
                              {exercise.sets}
                            </Text>
                          </View>
                        )}
                        {exercise.reps && (
                          <View className="flex-1 min-w-[100px]">
                            <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Repetições</Text>
                            <Text className="font-bold text-3xl" style={{ color: theme.colors.primary }}>
                              {exercise.reps}
                            </Text>
                          </View>
                        )}
                        {exercise.duration && (
                          <View className="flex-1 min-w-[100px]">
                            <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Duração</Text>
                            <Text className="font-semibold text-lg" style={themeStyles.text}>
                              {Math.floor(exercise.duration / 60)}min
                            </Text>
                          </View>
                        )}
                        {exercise.restTime && (
                          <View className="flex-1 min-w-[100px]">
                            <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Descanso</Text>
                            <Text className="font-semibold text-lg" style={themeStyles.text}>{exercise.restTime}s</Text>
                          </View>
                        )}
                      </View>
                      
                      {exercise.notes && (
                        <View className="mt-3 pt-3" style={{ borderTopColor: theme.colors.border, borderTopWidth: 1 }}>
                          <Text className="text-sm" style={themeStyles.textSecondary}>
                            💡 {exercise.notes}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Timer de Descanso (para exercícios com restTime) */}
                    {exercise.restTime && (
                      <View className="rounded-xl p-4 mb-4" style={themeStyles.cardSecondary}>
                        <Text className="font-semibold mb-3" style={themeStyles.text}>⏱️ Timer de Descanso</Text>
                        {isResting ? (
                          <View className="items-center">
                            <Text className="text-4xl font-bold text-primary-400 mb-4">
                              {formatTime(restTime)}
                            </Text>
                            <TouchableOpacity
                              onPress={skipRest}
                              className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2"
                            >
                              <Text className="text-red-400 font-semibold">Pular Descanso</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => startRestTimer(exercise.restTime)}
                            className="bg-primary-500/20 border border-primary-500/30 rounded-lg px-4 py-3 items-center"
                          >
                            <Text className="text-primary-400 font-semibold">
                              Iniciar Descanso ({exercise.restTime}s)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    
                    {/* Timer de Duração (para exercícios de aquecimento) - REGRESSIVO */}
                    {exercise.duration && workoutTemplate?.blocks[currentBlockIndex]?.blockType === 'WARM_UP' && (
                      <View className="rounded-xl p-4 mb-4" style={themeStyles.cardSecondary}>
                        <Text className="font-semibold mb-3" style={themeStyles.text}>🔥 Timer de Aquecimento</Text>
                        {isRunningWarmUp ? (
                          <View className="items-center">
                            <Text className="text-4xl font-bold mb-2" style={{ color: theme.colors.primary }}>
                              {formatTime(warmUpTime)}
                            </Text>
                            <Text className="text-sm mb-4" style={themeStyles.textSecondary}>
                              de {formatTime(warmUpTotal)}
                            </Text>
                            <View className="w-full rounded-full h-2 mb-4" style={{ backgroundColor: theme.colors.border }}>
                              <View 
                                className="h-2 rounded-full"
                                style={{ 
                                  backgroundColor: theme.colors.primary,
                                  width: `${((warmUpTotal - warmUpTime) / warmUpTotal) * 100}%` 
                                }}
                              />
                            </View>
                            <TouchableOpacity
                              onPress={stopWarmUpTimer}
                              className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2"
                            >
                              <Text className="text-red-400 font-semibold">Parar Timer</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => startWarmUpTimer(exercise.duration)}
                            className="bg-primary-500/20 border border-primary-500/30 rounded-lg px-4 py-3 items-center"
                            style={{
                              backgroundColor: theme.mode === 'dark' 
                                ? 'rgba(251, 146, 60, 0.2)' 
                                : 'rgba(251, 146, 60, 0.1)',
                              borderColor: theme.colors.primary + '50',
                            }}
                          >
                            <Text className="font-semibold" style={{ color: theme.colors.primary }}>
                              Iniciar Aquecimento ({Math.floor(exercise.duration / 60)}min)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    
                    {/* Timer de Duração (para exercícios de alongamento/desaquecimento) */}
                    {exercise.duration && workoutTemplate?.blocks[currentBlockIndex]?.blockType === 'COOL_DOWN' && (
                      <View className="rounded-xl p-4 mb-4" style={themeStyles.cardSecondary}>
                        <Text className="font-semibold mb-3" style={themeStyles.text}>🧘 Timer de Alongamento</Text>
                        {isRunningDuration ? (
                          <View className="items-center">
                            <Text className="text-4xl font-bold mb-2" style={{ color: '#10b981' }}>
                              {formatTime(durationTime)}
                            </Text>
                            <Text className="text-sm mb-4" style={themeStyles.textSecondary}>
                              de {formatTime(durationTotal)}
                            </Text>
                            <View className="w-full rounded-full h-2 mb-4" style={{ backgroundColor: theme.colors.border }}>
                              <View 
                                className="h-2 rounded-full"
                                style={{ 
                                  backgroundColor: '#10b981',
                                  width: `${(durationTime / durationTotal) * 100}%` 
                                }}
                              />
                            </View>
                            <TouchableOpacity
                              onPress={stopDurationTimer}
                              className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2"
                            >
                              <Text className="text-red-400 font-semibold">Parar Timer</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => startDurationTimer(exercise.duration)}
                            className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-3 items-center"
                          >
                            <Text className="text-green-400 font-semibold">
                              Iniciar Alongamento ({Math.floor(exercise.duration / 60)}min)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Timer de Duração (para exercícios do bloco principal com duração, ex: Corrida Leve) */}
                    {(() => {
                      const blockType = workoutTemplate?.blocks[currentBlockIndex]?.blockType;
                      const durationSec = exercise.duration ?? (exercise.exercise?.duration ? Number(exercise.exercise.duration) : 0);
                      const showWorkDurationTimer = blockType === 'WORK' && durationSec > 0;
                      if (!showWorkDurationTimer) return null;
                      return (
                        <View className="rounded-xl p-4 mb-4" style={themeStyles.cardSecondary}>
                          <Text className="font-semibold mb-3" style={themeStyles.text}>⏱️ Timer de Duração</Text>
                          {isRunningDuration ? (
                            <View className="items-center">
                              <Text className="text-4xl font-bold mb-2" style={{ color: theme.colors.primary }}>
                                {formatTime(durationTime)}
                              </Text>
                              <Text className="text-sm mb-4" style={themeStyles.textSecondary}>
                                de {formatTime(durationTotal)}
                              </Text>
                              <View className="w-full rounded-full h-2 mb-4" style={{ backgroundColor: theme.colors.border }}>
                                <View 
                                  className="h-2 rounded-full"
                                  style={{ 
                                    backgroundColor: theme.colors.primary,
                                    width: `${(durationTime / durationTotal) * 100}%` 
                                  }}
                                />
                              </View>
                              <TouchableOpacity
                                onPress={stopDurationTimer}
                                className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-2"
                              >
                                <Text className="text-red-400 font-semibold">Parar Timer</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => startDurationTimer(durationSec)}
                              className="rounded-lg px-4 py-3 items-center"
                              style={{
                                backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)',
                                borderWidth: 1,
                                borderColor: theme.colors.primary + '50',
                              }}
                            >
                              <Text className="font-semibold" style={{ color: theme.colors.primary }}>
                                Iniciar ({Math.floor(durationSec / 60)}min)
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })()}
                    
                    {/* Registro de Peso/Carga: só para exercícios que fazem sentido (força, com aparelho). Oculta para corrida, alongamento, aquecimento, desaquecimento, descanso. */}
                    {(() => {
                      const exerciseName = (exercise?.exercise?.name ?? '').toLowerCase();
                      const blockType = workoutTemplate?.blocks[currentBlockIndex ?? 0]?.blockType ?? '';
                      const noLoadKeywords = ['corrida', 'alongamento', 'aquecimento', 'desaquecimento', 'caminhada', 'esteira', 'stretch', 'descanso'];
                      const isNoLoadExercise = noLoadKeywords.some(kw => exerciseName.includes(kw)) || blockType === 'WARM_UP' || blockType === 'COOL_DOWN';
                      const showWeightLoad = assignedWorkout.status === 'Pendente' && !isNoLoadExercise;
                      if (!showWeightLoad) return null;
                      return (
                        <View className="rounded-xl p-4 mb-4" style={themeStyles.cardSecondary}>
                          <Text className="font-semibold mb-3" style={themeStyles.text}>💪 Registrar Peso/Carga</Text>
                          
                          {savedWeights[exerciseUniqueId] && (
                            <View className="mb-3 p-3 rounded-lg" style={themeStyles.cardSecondary}>
                              <Text className="text-xs mb-1" style={themeStyles.textSecondary}>Último peso registrado</Text>
                              <Text className="font-bold text-xl" style={themeStyles.text}>
                                {savedWeights[exerciseUniqueId]} kg
                              </Text>
                            </View>
                          )}
                          
                          <View className="flex-row gap-2 items-center">
                            <TextInput
                              ref={weightInputRef}
                              value={exerciseWeight}
                              onChangeText={setExerciseWeight}
                              placeholder="Peso em kg"
                              placeholderTextColor={theme.colors.textTertiary}
                              keyboardType="numeric"
                              inputAccessoryViewID={Platform.OS === 'ios' ? weightInputAccessoryViewId : undefined}
                              className="flex-1 border rounded-lg px-4 py-3"
                              style={{ 
                                backgroundColor: theme.colors.backgroundTertiary,
                                borderColor: theme.colors.border,
                                color: theme.colors.text,
                              }}
                              onFocus={() => {
                                setTimeout(() => {
                                  exerciseModalScrollRef.current?.scrollToEnd({ animated: true });
                                }, 120);
                              }}
                            />
                            <Text style={themeStyles.textSecondary}>kg</Text>
                          </View>
                          {Platform.OS === 'ios' ? (
                            <InputAccessoryView nativeID={weightInputAccessoryViewId}>
                              <View
                                style={{
                                  backgroundColor: theme.colors.card,
                                  borderTopWidth: 1,
                                  borderTopColor: theme.colors.border,
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  alignItems: 'flex-end',
                                }}
                              >
                                <Pressable
                                  onPress={() => {
                                    weightInputRef.current?.blur();
                                  }}
                                  hitSlop={10}
                                >
                                  <Text className="font-semibold" style={{ color: theme.colors.primary }}>
                                    Fechar
                                  </Text>
                                </Pressable>
                              </View>
                            </InputAccessoryView>
                          ) : null}
                          
                          <TouchableOpacity
                            onPress={() => {
                              const weight = parseFloat(exerciseWeight);
                              if (isNaN(weight) || weight <= 0) {
                                showAlert('Atenção', 'Por favor, digite um peso válido', 'warning');
                                return;
                              }
                              if (!workoutId) return;
                              saveExerciseWeight(exerciseUniqueId, weight, workoutId);
                            }}
                            className="bg-primary-500/20 border border-primary-500/30 rounded-lg px-4 py-3 items-center mt-3"
                          >
                            <Text className="text-primary-400 font-semibold">
                              Salvar Peso
                            </Text>
                          </TouchableOpacity>
                          {weightSaveMessage ? (
                            <View className="mt-2 flex-row items-center justify-center">
                              <FontAwesome name="check-circle" size={14} color="#10b981" />
                              <Text className="text-xs ml-1" style={{ color: '#10b981' }}>
                                {weightSaveMessage}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })()}
                    
                    {/* Botão Marcar como Concluído */}
                    {assignedWorkout.status === 'Pendente' && (
                      <TouchableOpacity
                        onPress={() => {
                          toggleExercise(exerciseUniqueId);
                          if (hasNext) {
                            // Aguardar um pouco antes de navegar
                            setTimeout(() => {
                              goToNextExercise();
                            }, 500);
                          } else {
                            // Último exercício - fechar modal
                            setTimeout(() => {
                              setShowExerciseModal(false);
                            }, 500);
                          }
                        }}
                        className={`rounded-lg py-4 px-6 items-center mb-4 ${
                          isCompleted
                            ? 'bg-green-500/20 border border-green-500/30'
                            : 'bg-primary-500/20 border border-primary-500/30'
                        }`}
                      >
                        <Text className={`font-semibold text-lg ${
                          isCompleted ? 'text-green-400' : 'text-primary-400'
                        }`}>
                          {isCompleted ? '✓ Concluído' : '✓ Marcar como Concluído'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                  
                  {/* Botões de Navegação */}
                  <View className="flex-row gap-3 px-6 pb-6 mt-4">
                    <TouchableOpacity
                      onPress={goToPreviousExercise}
                      disabled={!hasPrevious}
                      className="flex-1 rounded-lg py-3 px-4 items-center border"
                      style={{
                        backgroundColor: hasPrevious ? theme.colors.backgroundTertiary : theme.colors.card,
                        borderColor: theme.colors.border,
                        opacity: hasPrevious ? 1 : 0.5,
                      }}
                    >
                      <Text className="font-semibold" style={{
                        color: hasPrevious ? theme.colors.text : theme.colors.textTertiary
                      }}>
                        ← Anterior
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={goToNextExercise}
                      disabled={!hasNext}
                      className="flex-1 rounded-lg py-3 px-4 items-center border"
                      style={{
                        backgroundColor: hasNext ? theme.colors.backgroundTertiary : theme.colors.card,
                        borderColor: theme.colors.border,
                        opacity: hasNext ? 1 : 0.5,
                      }}
                    >
                      <Text className="font-semibold" style={{
                        color: hasNext ? theme.colors.text : theme.colors.textTertiary
                      }}>
                        Próximo →
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              </KeyboardAvoidingView>
            </Modal>
          );
        })()}

        {/* Modal de Feedback */}
        <Modal
          visible={showFeedbackModal}
          transparent={true}
          animationType="fade"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setShowFeedbackModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-6">
            <View className="rounded-3xl p-6 w-full max-w-md border" style={themeStyles.card}>
              <Text className="text-2xl font-bold mb-2 text-center" style={themeStyles.text}>
                Como foi o treino?
              </Text>
              <Text className="text-center mb-6" style={themeStyles.textSecondary}>
                Selecione como você se sentiu após completar este treino
              </Text>

              {/* Grid de emojis */}
              <View className="flex-row flex-wrap justify-center gap-4 mb-4">
                {feedbackLevels.map((feedback) => (
                  <TouchableOpacity
                    key={feedback.level}
                    className="items-center justify-center w-20 h-20 rounded-2xl border-2"
                    style={{
                      backgroundColor: selectedFeedback === feedback.level
                        ? (theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.1)')
                        : theme.colors.backgroundTertiary,
                      borderColor: selectedFeedback === feedback.level
                        ? theme.colors.primary
                        : theme.colors.border,
                      ...(selectedFeedback === feedback.level ? {
                        shadowColor: feedback.color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                      } : {}),
                    }}
                    onPress={() => setSelectedFeedback(feedback.level)}
                  >
                    <Image
                      source={feedback.icon}
                      style={{ width: 44, height: 44, marginBottom: 4 }}
                      resizeMode="contain"
                    />
                    <Text className="text-xs font-semibold" style={{
                      color: selectedFeedback === feedback.level ? theme.colors.text : theme.colors.textTertiary
                    }}>
                      {feedback.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Observação opcional (feedback em texto) */}
              <View className="mb-6">
                <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
                  Observação (opcional)
                </Text>
                <TextInput
                  className="rounded-xl px-4 py-3 border text-base"
                  style={{
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    minHeight: 80,
                  }}
                  placeholder="Ex: Senti dor no joelho no Leg Press..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Botões */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-dark-800 border border-dark-700 rounded-lg py-3"
                  onPress={() => {
                    setShowFeedbackModal(false);
                    setSelectedFeedback(null);
                    setFeedbackText('');
                  }}
                >
                  <Text className="text-white font-semibold text-center">
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary-500 rounded-lg py-3"
                  onPress={handleConfirmCompletion}
                >
                  <Text className="text-black font-bold text-center">
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

  </View>
  );
}
