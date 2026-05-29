import { Linking } from 'react-native';

import type { HealthPermissionResult } from '@/src/types/health';

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

async function loadHealthKit() {
  const mod = await import('react-native-health');
  return mod.default;
}

export async function getHealthConnectAvailability(): Promise<HealthConnectAvailability> {
  return 'unavailable';
}

export async function isNativeHealthAvailable(): Promise<boolean> {
  if (!canUseNativeHealth()) {
    return false;
  }
  try {
    const AppleHealthKit = await loadHealthKit();
    return await new Promise<boolean>((resolve) => {
      AppleHealthKit.isAvailable((error: string | Object | null, available: boolean) => {
        if (error) {
          resolve(false);
          return;
        }
        resolve(Boolean(available));
      });
    });
  } catch {
    return false;
  }
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
    const AppleHealthKit = await loadHealthKit();
    const { Permissions } = AppleHealthKit.Constants;

    const permissions = {
      permissions: {
        read: [
          Permissions.HeartRate,
          Permissions.ActiveEnergyBurned,
          Permissions.DistanceWalkingRunning,
          Permissions.StepCount,
          Permissions.Workout,
        ],
        write: [],
      },
    };

    return await new Promise<HealthPermissionResult>((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          resolve({
            granted: false,
            grantedTypes: [],
            reason: error || 'permission_denied',
          });
          return;
        }
        resolve({
          granted: true,
          grantedTypes: [...READ_TYPE_LABELS],
        });
      });
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
