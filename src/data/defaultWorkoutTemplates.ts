import { DEFAULT_EXERCISES } from '@/src/data/defaultExercises';
import { WorkoutBlock, type WorkoutBlockData, type WorkoutExercise } from '@/src/types';

const DEFAULT_TEMPLATE_DATE = '27/04/2026';

function exerciseById(id: string) {
  return DEFAULT_EXERCISES.find((exercise) => exercise.id === id);
}

function item(
  exerciseId: string,
  order: number,
  data: Partial<WorkoutExercise> = {}
): WorkoutExercise {
  return {
    exerciseId,
    exercise: exerciseById(exerciseId),
    sets: data.sets,
    reps: data.reps,
    duration: data.duration,
    restTime: data.restTime,
    order,
    notes: data.notes,
  };
}

export const DEFAULT_WORKOUT_TEMPLATES = [
  {
    id: 'default_academia_forca_base',
    name: 'Academia Completa - Força Base',
    description: 'Treino profissional de academia com aquecimento, 8 exercícios principais e finalização para força geral.',
    coachId: 'default',
    isActive: true,
    createdAt: DEFAULT_TEMPLATE_DATE,
    updatedAt: DEFAULT_TEMPLATE_DATE,
    blocks: [
      {
        blockType: WorkoutBlock.WARM_UP,
        notes: 'Preparar articulações e elevar temperatura corporal antes das cargas.',
        exercises: [
          item('ex4', 1, { duration: 300, notes: 'Caminhada progressiva na esteira por 5 minutos.' }),
          item('ex20', 2, { duration: 300, notes: 'Mobilidade dinâmica para quadril, ombro e coluna.' }),
        ],
      },
      {
        blockType: WorkoutBlock.WORK,
        notes: 'Carga moderada, técnica controlada e descanso completo entre séries.',
        exercises: [
          item('ex1', 1, { sets: 4, reps: 12, restTime: 75, notes: 'Amplitude segura e controle na descida.' }),
          item('ex11', 2, { sets: 4, reps: 10, restTime: 90, notes: 'Manter tronco firme e joelhos alinhados.' }),
          item('ex6', 3, { sets: 4, reps: 10, restTime: 90, notes: 'Empurrar sem perder contato com o apoio.' }),
          item('ex7', 4, { sets: 3, reps: 12, restTime: 75, notes: 'Puxar com escápulas ativas, sem balanço.' }),
          item('ex8', 5, { sets: 3, reps: 12, restTime: 75, notes: 'Cotovelos próximos ao corpo e postura estável.' }),
          item('ex13', 6, { sets: 3, reps: 10, restTime: 75, notes: 'Evitar compensar com lombar.' }),
          item('ex17', 7, { sets: 3, reps: 15, restTime: 45, notes: 'Contrair abdômen no final do movimento.' }),
          item('ex18', 8, { sets: 4, reps: 15, restTime: 45, notes: 'Pausar 1 segundo no topo da contração.' }),
        ],
      },
      {
        blockType: WorkoutBlock.COOL_DOWN,
        notes: 'Reduzir frequência cardíaca e melhorar recuperação pós-treino.',
        exercises: [
          item('ex10', 1, { duration: 240, notes: 'Alongar peitoral e costas sem dor.' }),
          item('ex21', 2, { duration: 180, notes: 'Respiração controlada e caminhada leve.' }),
        ],
      },
    ] as WorkoutBlockData[],
  },
  {
    id: 'default_funcional_performance',
    name: 'Funcional Performance - Corpo Inteiro',
    description: 'Circuito funcional completo para condicionamento, estabilidade e força integrada.',
    coachId: 'default',
    isActive: true,
    createdAt: DEFAULT_TEMPLATE_DATE,
    updatedAt: DEFAULT_TEMPLATE_DATE,
    blocks: [
      {
        blockType: WorkoutBlock.WARM_UP,
        notes: 'Ativar corpo inteiro antes do circuito principal.',
        exercises: [
          item('ex20', 1, { duration: 360, notes: 'Mobilidade dinâmica com foco em quadril e ombros.' }),
          item('ex9', 2, { duration: 300, notes: 'Bike em ritmo moderado para elevar frequência cardíaca.' }),
        ],
      },
      {
        blockType: WorkoutBlock.WORK,
        notes: 'Executar em ritmo controlado, priorizando qualidade técnica em cada estação.',
        exercises: [
          item('ex11', 1, { sets: 3, reps: 12, restTime: 45, notes: 'Agachamento guiado como base de membros inferiores.' }),
          item('ex19', 2, { sets: 3, reps: 12, restTime: 45, notes: 'Foco em glúteos e extensão completa do quadril.' }),
          item('ex7', 3, { sets: 3, reps: 12, restTime: 45, notes: 'Puxada firme para equilíbrio postural.' }),
          item('ex14', 4, { sets: 3, reps: 15, restTime: 40, notes: 'Controle total, sem impulso.' }),
          item('ex16', 5, { sets: 3, reps: 15, restTime: 40, notes: 'Manter cotovelos próximos ao corpo.' }),
          item('ex17', 6, { sets: 3, reps: 15, restTime: 40, notes: 'Core ativo durante todo o movimento.' }),
          item('ex18', 7, { sets: 3, reps: 18, restTime: 35, notes: 'Movimento completo e cadenciado.' }),
          item('ex12', 8, { sets: 3, reps: 12, restTime: 45, notes: 'Fechar o circuito com peitoral isolado e controlado.' }),
        ],
      },
      {
        blockType: WorkoutBlock.COOL_DOWN,
        notes: 'Desacelerar e finalizar com mobilidade leve.',
        exercises: [
          item('ex5', 1, { duration: 240, notes: 'Alongamento de pernas e glúteos.' }),
          item('ex21', 2, { duration: 180, notes: 'Respiração nasal e relaxamento gradual.' }),
        ],
      },
    ] as WorkoutBlockData[],
  },
] as const;
