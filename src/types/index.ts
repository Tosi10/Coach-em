/**
 * Coach'em - TypeScript Interfaces
 * 
 * Este arquivo define todas as interfaces principais do sistema.
 * A tipagem forte garante segurança em tempo de compilação e melhor
 * experiência de desenvolvimento com autocomplete e detecção de erros.
 */

/**
 * Enum para tipos de usuário
 * Usamos enum ao invés de string literal para garantir que apenas
 * valores válidos sejam aceitos em todo o sistema
 */
export enum UserType {
  COACH = 'COACH',
  ATHLETE = 'ATHLETE',
}

/**
 * Interface base para usuários do sistema
 * 
 * Por que usar interface ao invés de type?
 * - Interfaces são extensíveis (podem ser merged)
 * - Melhor para objetos que representam contratos
 * - Suporta herança com 'extends'
 * 
 * Partial<> torna todos os campos opcionais, útil para updates
 */
export interface BaseUser {
  id: string; // ID único do Firebase Auth
  email: string;
  displayName: string;
  userType: UserType;
  createdAt: Date | string; // Firebase retorna string, convertemos para Date
  updatedAt: Date | string;
  photoURL?: string; // Opcional: atleta pode não ter foto
}

/**
 * Interface específica para Treinadores (COACH)
 * 
 * Herda de BaseUser e adiciona campos específicos do treinador.
 * O 'extends' garante que Coach sempre terá os campos de BaseUser.
 */
export interface Coach extends BaseUser {
  userType: UserType.COACH;
  bio?: string; // Biografia opcional
  specialization?: string; // Ex: "Futebol", "Atletismo", etc.
  athletes?: string[]; // Array de IDs dos atletas vinculados
}

/**
 * Interface específica para Atletas (ATHLETE)
 * 
 * Similar ao Coach, mas com campos relevantes para atletas.
 */
export interface Athlete extends BaseUser {
  userType: UserType.ATHLETE;
  coachId?: string; // ID do treinador responsável
  dateOfBirth?: Date | string;
  sport?: string;
}

/**
 * Union Type para representar qualquer tipo de usuário
 * 
 * TypeScript permite criar tipos que podem ser um OU outro.
 * Isso é útil em funções que aceitam ambos os tipos.
 */
export type User = Coach | Athlete;

/**
 * Interface para Exercícios
 * 
 * Representa um exercício individual na biblioteca de repertório.
 * O treinador pode criar exercícios globais ou pessoais.
 */
export interface Exercise {
  id: string;
  name: string;
  description: string;
  videoURL?: string; // URL do vídeo no Firebase Storage
  thumbnailURL?: string; // URL da thumbnail
  duration?: number; // Duração em segundos
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[]; // Ex: ["pernas", "core"]
  equipment?: string[]; // Equipamentos necessários
  createdBy: string; // ID do treinador que criou
  isGlobal: boolean; // Se é um exercício global ou pessoal
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Enum para os blocos de treino
 * 
 * Seguindo o workflow solicitado: Warm-up, Work, Cool Down
 */
export enum WorkoutBlock {
  WARM_UP = 'WARM_UP',
  WORK = 'WORK',
  COOL_DOWN = 'COOL_DOWN',
}

/**
 * Interface para um exercício dentro de um bloco de treino
 * 
 * Inclui informações específicas do contexto do treino,
 * como séries, repetições, e ordem de execução.
 */
export interface WorkoutExercise {
  exerciseId: string; // Referência ao Exercise
  exercise?: Exercise; // Exercício populado (opcional para queries)
  sets?: number;
  reps?: number;
  duration?: number; // Em segundos
  restTime?: number; // Tempo de descanso em segundos
  order: number; // Ordem de execução dentro do bloco
  notes?: string; // Observações específicas do treinador
}

/**
 * Interface para um bloco de treino
 * 
 * Cada treino tem 3 blocos obrigatórios conforme especificado.
 */
export interface WorkoutBlockData {
  blockType: WorkoutBlock;
  exercises: WorkoutExercise[];
  notes?: string; // Observações gerais do bloco
}

/**
 * Interface para um Treino completo
 * 
 * Representa um treino atribuído a um atleta.
 * Pode ser criado do zero ou baseado em um Template.
 */
export interface Workout {
  id: string;
  name: string;
  description?: string;
  coachId: string; // ID do treinador que criou
  athleteId: string; // ID do atleta para quem foi atribuído
  blocks: WorkoutBlockData[]; // Array com os 3 blocos
  scheduledDate?: Date | string; // Data agendada para o treino
  completedDate?: Date | string; // Data de conclusão
  isCompleted: boolean;
  templateId?: string; // Se foi criado a partir de um template
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Interface para Templates de Treino
 * 
 * Permite que o treinador salve treinos como modelos
 * e os reutilize para múltiplos atletas.
 */
export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  coachId: string;
  blocks: WorkoutBlockData[]; // Mesma estrutura do Workout
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Tipo para documentos do Firestore
 * 
 * Firebase retorna Timestamps que precisam ser convertidos.
 * Este tipo auxiliar ajuda na conversão.
 */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

/**
 * Helper type para converter Timestamps do Firestore para Date
 * 
 * Usado em funções de serviço que fazem queries no Firestore.
 */
export type WithTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'> & {
  createdAt: FirestoreTimestamp | Date | string;
  updatedAt: FirestoreTimestamp | Date | string;
};




