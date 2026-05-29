/**
 * Coach'em - Camada unificada de saúde (HealthKit + Health Connect)
 *
 * Fachada que abstrai iOS (HealthKit) e Android (Health Connect).
 * Permissões reais (Dia 9+): delegadas a `health/healthNativePermissions.*`
 * via import dinâmico de libs nativas — seguro no Expo Go.
 *
 * Leitura de dados (`readWindow`): HealthKit / Health Connect (Dias 14–15).
 */

import { Platform } from 'react-native';

import type { HealthPermissionResult, HealthPlatform, HealthSnapshot } from '@/src/types/health';

import * as NativeHealth from './health/healthNativePermissions';
import { readNativeHealthWindow } from './health/healthReadWindow';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface HealthService {
  readonly platform: HealthPlatform;
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<HealthPermissionResult>;
  revokePermissions(): Promise<boolean>;
  readWindow(start: Date, end: Date): Promise<HealthSnapshot>;
}

export { canUseNativeHealth } from './health/healthRuntime';
export type { HealthConnectAvailability } from './health/healthNativePermissions';
export {
  getHealthConnectAvailability,
  openHealthConnectSettingsScreen,
  openHealthConnectStore,
} from './health/healthNativePermissions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// Implementações por plataforma (permissões reais; leitura ainda stub)
// ---------------------------------------------------------------------------

class HealthKitService implements HealthService {
  readonly platform: HealthPlatform = 'healthkit';

  async isAvailable(): Promise<boolean> {
    return NativeHealth.isNativeHealthAvailable();
  }

  async requestPermissions(): Promise<HealthPermissionResult> {
    return NativeHealth.requestNativeHealthPermissions();
  }

  async revokePermissions(): Promise<boolean> {
    return NativeHealth.revokeNativeHealthPermissions();
  }

  async readWindow(start: Date, end: Date): Promise<HealthSnapshot> {
    return readNativeHealthWindow(start, end);
  }
}

class HealthConnectService implements HealthService {
  readonly platform: HealthPlatform = 'healthconnect';

  async isAvailable(): Promise<boolean> {
    return NativeHealth.isNativeHealthAvailable();
  }

  async requestPermissions(): Promise<HealthPermissionResult> {
    return NativeHealth.requestNativeHealthPermissions();
  }

  async revokePermissions(): Promise<boolean> {
    return NativeHealth.revokeNativeHealthPermissions();
  }

  async readWindow(start: Date, end: Date): Promise<HealthSnapshot> {
    return readNativeHealthWindow(start, end);
  }
}

class NoopHealthService implements HealthService {
  readonly platform: HealthPlatform = null;

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async requestPermissions(): Promise<HealthPermissionResult> {
    return {
      granted: false,
      grantedTypes: [],
      reason: 'unsupported_platform',
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
// Singleton
// ---------------------------------------------------------------------------

let cachedService: HealthService | null = null;

export function getHealthService(): HealthService {
  if (cachedService) return cachedService;

  if (Platform.OS === 'ios') {
    cachedService = new HealthKitService();
  } else if (Platform.OS === 'android') {
    cachedService = new HealthConnectService();
  } else {
    cachedService = new NoopHealthService();
  }

  return cachedService;
}

export function __resetHealthServiceForTests(): void {
  cachedService = null;
}
