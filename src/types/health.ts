/**
 * Coach'em - Tipos de integração de saúde (HealthKit + Health Connect)
 *
 * Tipos compartilhados entre iOS (HealthKit) e Android (Health Connect),
 * usados pela camada `health.service.ts` e pelas telas que consomem dados de saúde.
 *
 * Princípios:
 * - **Agnóstico de plataforma:** o consumidor não precisa saber se veio do HealthKit
 *   ou do Health Connect. O serviço normaliza tudo nestes tipos.
 * - **Tudo opcional:** dispositivos diferentes entregam coisas diferentes. Cada campo
 *   pode ser `null` quando o relógio/sistema não fornece.
 * - **Sem séries pesadas em Firestore:** as séries (`HRSample[]`) ficam apenas em memória
 *   e o que é persistido são agregados (média, máx, zonas, etc.).
 */

/** Identifica de qual sistema os dados foram lidos. */
export type HealthPlatform = 'healthkit' | 'healthconnect' | null;

/** Amostra individual de frequência cardíaca (FC) coletada do sistema. */
export interface HRSample {
  /** Momento exato da medição. */
  timestamp: Date;
  /** Batimentos por minuto. */
  bpm: number;
}

/** Tempo em segundos em cada uma das 5 zonas de FC (Z1–Z5). */
export interface HRZones {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

/** Agregados calculados a partir da série de FC do período. */
export interface HRAggregates {
  avg: number | null;
  max: number | null;
  min: number | null;
  samplesCount: number;
  zones: HRZones | null;
}

/** Tipos canônicos de exercício/sessão reconhecidos pelo Coach'em. */
export type WorkoutSessionType =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'strength'
  | 'hiit'
  | 'yoga'
  | 'swimming'
  | 'other';

/** Uma sessão de treino detectada pelo relógio dentro da janela de tempo. */
export interface WorkoutSession {
  type: WorkoutSessionType;
  durationSec: number;
  caloriesActive: number | null;
  distanceMeters: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
}

/**
 * Snapshot completo de saúde para uma janela de tempo (`startedAt → completedAt`).
 *
 * É o objeto único produzido por `health.service.readWindow()` e o que será
 * persistido (com `series` removido) em `coachemAssignedWorkouts/{id}/health/{uid}`.
 */
export interface HealthSnapshot {
  /** Quando o snapshot foi calculado (geralmente igual ao `completedAt`). */
  collectedAt: Date;
  /** Início da janela (atleta tocou Iniciar treino). */
  startedAt: Date;
  /** Fim da janela (atleta tocou Concluir treino). */
  completedAt: Date;
  /** De onde vieram os dados. `null` se nada foi coletado. */
  source: HealthPlatform;
  /** Nome legível do dispositivo, quando disponível. */
  device: string | null;

  /** Agregados de FC. Pode ser `null` se não houve amostras. */
  heartRate: HRAggregates | null;

  /** Série bruta de FC (não vai para Firestore — usado em UI rica se quisermos). */
  hrSeries: HRSample[];

  /** Calorias ativas totais no período. */
  caloriesActive: number | null;
  /** Distância total no período, em metros. */
  distanceMeters: number | null;
  /** Total de passos no período. */
  steps: number | null;

  /** Sessões de exercício que sobrepõem a janela. */
  workoutSessions: WorkoutSession[];

  /** Mensagens não fatais (ex.: "permissão de passos negada"). */
  notes: string[];
}

/** Resultado de uma tentativa de pedir permissões ao sistema. */
export interface HealthPermissionResult {
  granted: boolean;
  /** Quais tipos foram concedidos (vazio se `granted = false`). */
  grantedTypes: string[];
  /** Mensagem amigável quando algo deu errado. */
  reason?: string;
}
