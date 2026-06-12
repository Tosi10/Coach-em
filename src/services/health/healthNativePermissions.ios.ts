import { Linking } from 'react-native';

import type { HealthPermissionResult } from '@/src/types/health';

import { getAppleHealthKit } from './healthKitBridge';
import { canUseNativeHealth } from './healthRuntime';

const READ_TYPE_LABELS = [
  'HeartRate',
  'ActiveEnergyBurned',
  'DistanceWalkingRunning',
  'StepCount',
  'Workout',
] as const;

export type HealthConnectAvailability =
  | 'available'
  | 'not_installed'
  | 'update_required'
  | 'unavailable';

function loadHealthKit() {
  return getAppleHealthKit();
}

/** No iOS não há Health Connect; espelha disponibilidade do HealthKit para diagnóstico. */
export async function getHealthConnectAvailability(): Promise<HealthConnectAvailability> {
  if (!(await isNativeHealthAvailable())) {
    return 'unavailable';
  }
  return 'available';
}

export async function isNativeHealthAvailable(): Promise<boolean> {
  if (!canUseNativeHealth()) {
    return false;
  }
  try {
    const AppleHealthKit = loadHealthKit();
    return typeof AppleHealthKit.initHealthKit === 'function';
  } catch {
    return false;
  }
}

/** Re-inicializa o HealthKit antes de leituras (necessário após reinício do app). */
export async function ensureNativeHealthReadyForRead(): Promise<boolean> {
  const result = await requestNativeHealthPermissions();
  return result.granted;
}

export async function requestNativeHealthPermissions(): Promise<HealthPermissionResult> {
  if (!canUseNativeHealth()) {
    return {
      granted: false,
      grantedTypes: [],
      reason: 'expo_go',
    };
  }

  try {
    const AppleHealthKit = loadHealthKit();
    const Permissions = AppleHealthKit.Constants?.Permissions;
    if (!Permissions) {
      return {
        granted: false,
        grantedTypes: [],
        reason: 'healthkit_constants_missing',
      };
    }

    // write: [] quebra initHealthKit em várias versões — pelo menos um tipo de escrita (README do pacote).
    const permissions = {
      permissions: {
        read: [
          Permissions.HeartRate,
          Permissions.ActiveEnergyBurned,
          Permissions.DistanceWalkingRunning,
          Permissions.StepCount,
          Permissions.Workout,
        ],
        write: [Permissions.Workout],
      },
    };

    return await new Promise<HealthPermissionResult>((resolve) => {
      AppleHealthKit.initHealthKit(
        permissions,
        (error: string | Record<string, unknown> | null) => {
          if (error) {
            const message =
              typeof error === 'string'
                ? error
                : typeof (error as { message?: string })?.message === 'string'
                  ? (error as { message: string }).message
                  : 'permission_denied';
            resolve({
              granted: false,
              grantedTypes: [],
              reason: message,
            });
            return;
          }
          resolve({
            granted: true,
            grantedTypes: [...READ_TYPE_LABELS],
          });
        },
      );
    });
  } catch (error) {
    return {
      granted: false,
      grantedTypes: [],
      reason: error instanceof Error ? error.message : 'healthkit_unavailable',
    };
  }
}

/** iOS não permite revogar via API — o utilizador usa Definições → Saúde. */
export async function revokeNativeHealthPermissions(): Promise<boolean> {
  return false;
}

export async function openHealthConnectStore(): Promise<void> {
  // N/A no iOS
}

export async function openHealthConnectSettingsScreen(): Promise<void> {
  await Linking.openURL('x-apple-health://');
}
