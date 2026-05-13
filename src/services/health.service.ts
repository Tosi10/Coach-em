/**
 * Coach'em - Camada unificada de saúde (HealthKit + Health Connect)
 *
 * Esqueleto da fachada (interface única) que abstrai as diferenças entre
 * `react-native-health` (iOS) e `react-native-health-connect` (Android).
 *
 * Estado atual (Dia 5):
 *   - Apenas tipos + stubs.
 *   - **Nenhuma lib nativa é importada aqui** porque o app ainda roda em Expo Go
 *     no dia a dia, e importar nessas libs aqui quebraria o JS bundle.
 *   - As implementações reais entram nos Dias 14–15, depois de buildarmos o Dev Client.
 *
 * Princípios:
 *   - Falhas **nunca** podem quebrar o fluxo do atleta. Se algo não rolar,
 *     devolvemos snapshot vazio ou `granted: false`, sem exceções.
 *   - Nenhum side-effect global na importação.
 *   - O consumidor passa por **uma única função**: `getHealthService()`.
 */

import { Platform } from 'react-native';

import type { HealthPermissionResult, HealthPlatform, HealthSnapshot } from '@/src/types/health';

// ---------------------------------------------------------------------------
// Tipos da fachada
// ---------------------------------------------------------------------------

/**
 * Interface única que o resto do app consome.
 * Não importa se por baixo é HealthKit ou Health Connect.
 */
export interface HealthService {
  /** Identifica em qual plataforma este serviço está rodando. */
  readonly platform: HealthPlatform;

  /**
   * Verifica se este dispositivo suporta o serviço de saúde
   * (e, no Android, se o Health Connect está instalado).
   */
  isAvailable(): Promise<boolean>;

  /**
   * Pede ao sistema as permissões de leitura necessárias.
   * Mostra a UI nativa apropriada (popup iOS ou tela do Health Connect).
   */
  requestPermissions(): Promise<HealthPermissionResult>;

  /**
   * Revoga as permissões do app (quando possível).
   * Em iOS não dá para revogar via API — devolvemos `false` e instruímos o usuário
   * a abrir Definições → Saúde manualmente.
   */
  revokePermissions(): Promise<boolean>;

  /**
   * Lê todos os dados de saúde entre `start` e `end`, normaliza no formato
   * `HealthSnapshot` e devolve.
   *
   * **Nunca lança.** Se algo falhar, devolve snapshot vazio com `source: null`
   * e o motivo em `notes`.
   */
  readWindow(start: Date, end: Date): Promise<HealthSnapshot>;
}

// ---------------------------------------------------------------------------
// Helpers compartilhados
// ---------------------------------------------------------------------------

/** Snapshot vazio padrão (usado quando o serviço não está disponível). */
function emptySnapshot(
  start: Date,
  end: Date,
  source: HealthPlatform,
  note?: string,
): HealthSnapshot {
  return {
    collectedAt: new Date(),
    startedAt: start,
    completedAt: end,
    source,
    device: null,
    heartRate: null,
    hrSeries: [],
    caloriesActive: null,
    distanceMeters: null,
    steps: null,
    workoutSessions: [],
    notes: note ? [note] : [],
  };
}

// ---------------------------------------------------------------------------
// Stub: iOS / HealthKit
// ---------------------------------------------------------------------------

class HealthKitServiceStub implements HealthService {
  readonly platform: HealthPlatform = 'healthkit';

  async isAvailable(): Promise<boolean> {
    // Implementação real entra no Dia 14 (chama `AppleHealthKit.isAvailable`).
    return false;
  }

  async requestPermissions(): Promise<HealthPermissionResult> {
    return {
      granted: false,
      grantedTypes: [],
      reason: 'HealthKit ainda não implementado (stub do Dia 5).',
    };
  }

  async revokePermissions(): Promise<boolean> {
    return false;
  }

  async readWindow(start: Date, end: Date): Promise<HealthSnapshot> {
    return emptySnapshot(start, end, 'healthkit', 'stub: nenhuma leitura real disponível.');
  }
}

// ---------------------------------------------------------------------------
// Stub: Android / Health Connect
// ---------------------------------------------------------------------------

class HealthConnectServiceStub implements HealthService {
  readonly platform: HealthPlatform = 'healthconnect';

  async isAvailable(): Promise<boolean> {
    // Implementação real entra no Dia 14 (chama `getSdkStatus`).
    return false;
  }

  async requestPermissions(): Promise<HealthPermissionResult> {
    return {
      granted: false,
      grantedTypes: [],
      reason: 'Health Connect ainda não implementado (stub do Dia 5).',
    };
  }

  async revokePermissions(): Promise<boolean> {
    return false;
  }

  async readWindow(start: Date, end: Date): Promise<HealthSnapshot> {
    return emptySnapshot(start, end, 'healthconnect', 'stub: nenhuma leitura real disponível.');
  }
}

// ---------------------------------------------------------------------------
// Stub: plataforma sem suporte (web, etc.)
// ---------------------------------------------------------------------------

class NoopHealthService implements HealthService {
  readonly platform: HealthPlatform = null;

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async requestPermissions(): Promise<HealthPermissionResult> {
    return {
      granted: false,
      grantedTypes: [],
      reason: 'Plataforma sem suporte a serviços de saúde.',
    };
  }

  async revokePermissions(): Promise<boolean> {
    return false;
  }

  async readWindow(start: Date, end: Date): Promise<HealthSnapshot> {
    return emptySnapshot(start, end, null, 'plataforma sem suporte.');
  }
}

// ---------------------------------------------------------------------------
// Singleton com seleção automática por plataforma
// ---------------------------------------------------------------------------

let cachedService: HealthService | null = null;

/**
 * Devolve a instância do serviço de saúde apropriada ao dispositivo atual.
 *
 * Sempre o mesmo objeto durante o ciclo do app (singleton).
 */
export function getHealthService(): HealthService {
  if (cachedService) return cachedService;

  if (Platform.OS === 'ios') {
    cachedService = new HealthKitServiceStub();
  } else if (Platform.OS === 'android') {
    cachedService = new HealthConnectServiceStub();
  } else {
    cachedService = new NoopHealthService();
  }

  return cachedService;
}

/**
 * Apenas para testes: força o serviço a ser recalculado na próxima chamada.
 * Não usar em produção.
 */
export function __resetHealthServiceForTests(): void {
  cachedService = null;
}
