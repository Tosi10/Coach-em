import { Exercise } from '@/src/types';

const DEFAULT_CREATED_AT = '2026-01-01T00:00:00.000Z';

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'ex1', name: 'Leg Press 45°', description: 'Exercício base para quadríceps e glúteos na máquina leg press.', difficulty: 'beginner', muscleGroups: ['pernas', 'glúteos'], equipment: ['Máquina Leg Press'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex2', name: 'Cadeira Extensora', description: 'Isolamento de quadríceps com foco em controle de movimento.', difficulty: 'beginner', muscleGroups: ['pernas'], equipment: ['Cadeira Extensora'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex3', name: 'Cadeira Flexora', description: 'Fortalecimento de posteriores de coxa na máquina.', difficulty: 'beginner', muscleGroups: ['posterior de coxa'], equipment: ['Cadeira Flexora'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex4', name: 'Caminhada Leve na Esteira', description: 'Aquecimento cardiovascular leve por 5 minutos.', difficulty: 'beginner', muscleGroups: ['cardio'], equipment: ['Esteira'], duration: 300, createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex5', name: 'Alongamento de Pernas', description: 'Alongamento estático para quadríceps, posterior e glúteos.', difficulty: 'beginner', muscleGroups: ['flexibilidade'], equipment: ['Nenhum'], duration: 240, createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex6', name: 'Supino Reto (Máquina)', description: 'Exercício para peitoral com suporte de máquina guiada.', difficulty: 'intermediate', muscleGroups: ['peito', 'tríceps'], equipment: ['Máquina de Supino'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex7', name: 'Puxada Frontal na Polia', description: 'Fortalecimento de costas com foco em dorsais e bíceps.', difficulty: 'intermediate', muscleGroups: ['costas', 'bíceps'], equipment: ['Polia Alta'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex8', name: 'Remada Baixa na Polia', description: 'Exercício para espessura de costas e estabilidade escapular.', difficulty: 'intermediate', muscleGroups: ['costas', 'bíceps'], equipment: ['Polia Baixa'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex9', name: 'Bicicleta Ergométrica', description: 'Aquecimento moderado por 5 minutos para elevar temperatura corporal.', difficulty: 'beginner', muscleGroups: ['cardio'], equipment: ['Bike Ergométrica'], duration: 300, createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex10', name: 'Alongamento de Peitoral e Costas', description: 'Desaquecimento com foco em peitoral e região dorsal.', difficulty: 'beginner', muscleGroups: ['flexibilidade'], equipment: ['Nenhum'], duration: 240, createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex11', name: 'Agachamento no Smith', description: 'Agachamento guiado para membros inferiores com maior estabilidade.', difficulty: 'intermediate', muscleGroups: ['pernas', 'glúteos'], equipment: ['Smith Machine'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex12', name: 'Crucifixo na Máquina (Peck Deck)', description: 'Exercício isolado para peitoral com trajetória guiada.', difficulty: 'beginner', muscleGroups: ['peito'], equipment: ['Peck Deck'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex13', name: 'Desenvolvimento de Ombros na Máquina', description: 'Press vertical para deltoides com apoio da máquina.', difficulty: 'intermediate', muscleGroups: ['ombros', 'tríceps'], equipment: ['Máquina de Ombros'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex14', name: 'Elevação Lateral (Halteres)', description: 'Isolamento de deltoide lateral com controle de movimento.', difficulty: 'beginner', muscleGroups: ['ombros'], equipment: ['Halteres'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex15', name: 'Rosca Direta (Barra W)', description: 'Exercício clássico para bíceps com barra W.', difficulty: 'beginner', muscleGroups: ['bíceps'], equipment: ['Barra W'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex16', name: 'Tríceps Pulley (Corda)', description: 'Extensão de cotovelo para tríceps na polia com corda.', difficulty: 'beginner', muscleGroups: ['tríceps'], equipment: ['Polia', 'Corda'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex17', name: 'Abdominal Máquina', description: 'Fortalecimento do abdômen com carga guiada.', difficulty: 'beginner', muscleGroups: ['core', 'abdômen'], equipment: ['Máquina Abdominal'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex18', name: 'Panturrilha Sentado', description: 'Isolamento de panturrilha com foco em amplitude completa.', difficulty: 'beginner', muscleGroups: ['panturrilha'], equipment: ['Máquina Panturrilha Sentado'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex19', name: 'Hip Thrust na Máquina', description: 'Exercício de glúteos com foco em extensão de quadril.', difficulty: 'intermediate', muscleGroups: ['glúteos', 'posterior de coxa'], equipment: ['Máquina Hip Thrust'], createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex20', name: 'Mobilidade Dinâmica (Quadril/Ombro)', description: 'Sequência de mobilidade dinâmica por 4 a 6 minutos.', difficulty: 'beginner', muscleGroups: ['mobilidade', 'cardio'], equipment: ['Nenhum'], duration: 300, createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
  { id: 'ex21', name: 'Respiração e Desaquecimento Leve', description: 'Respiração controlada com caminhada leve para desacelerar.', difficulty: 'beginner', muscleGroups: ['flexibilidade', 'cardio'], equipment: ['Esteira (opcional)'], duration: 180, createdBy: 'coach_default', isGlobal: true, createdAt: DEFAULT_CREATED_AT, updatedAt: DEFAULT_CREATED_AT },
];

export function mergeDefaultExercisesWithCoachSaved(
  defaults: Exercise[],
  saved: Exercise[],
  coachId?: string
): Exercise[] {
  if (!saved?.length) return defaults;
  const suffix = coachId ? `_${coachId}` : '';
  const overriddenBaseIds = new Set<string>();

  saved.forEach((exercise) => {
    if (!exercise.id.startsWith('exercise_default_')) return;
    const withoutPrefix = exercise.id.replace('exercise_default_', '');
    const baseId = suffix && withoutPrefix.endsWith(suffix)
      ? withoutPrefix.slice(0, -suffix.length)
      : withoutPrefix;
    overriddenBaseIds.add(baseId);
  });

  const filteredDefaults = defaults.filter((exercise) => !overriddenBaseIds.has(exercise.id));
  return [...filteredDefaults, ...saved];
}
