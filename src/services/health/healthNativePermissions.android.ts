import { Linking } from 'react-native';

import type { HealthPermissionResult } from '@/src/types/health';

import { canUseNativeHealth } from './healthRuntime';

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';
const HEALTH_CONNECT_PLAY_URL = `https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`;

const READ_RECORD_TYPES = [
  'HeartRate',
  'ActiveCaloriesBurned',
  'Distance',
  'Steps',
  'ExerciseSession',
] as const;

export type HealthConnectAvailability =
  | 'available'
  | 'not_installed'
  | 'update_required'
  | 'unavailable';

async function loadHealthConnect() {
  return import('react-native-health-connect');
}

function mapSdkStatus(
  status: number,
  SdkAvailabilityStatus: {
    SDK_AVAILABLE: number;
    SDK_UNAVAILABLE: number;
    SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: number;
  },
): HealthConnectAvailability {
  if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
    return 'available';
  }
  if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
    return 'update_required';
  }
  if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
    return 'not_installed';
  }
  return 'unavailable';
}

export async function getHealthConnectAvailability(): Promise<HealthConnectAvailability> {
  if (!canUseNativeHealth()) {
    return 'unavailable';
  }
  try {
    const { getSdkStatus, SdkAvailabilityStatus } = await loadHealthConnect();
    const status = await getSdkStatus();
    return mapSdkStatus(status, SdkAvailabilityStatus);
  } catch {
    return 'unavailable';
  }
}

export async function isNativeHealthAvailable(): Promise<boolean> {
  const availability = await getHealthConnectAvailability();
  return availability === 'available';
}

export async function requestNativeHealthPermissions(): Promise<HealthPermissionResult> {
  if (!canUseNativeHealth()) {
    return {
      granted: false,
      grantedTypes: [],
      reason: 'expo_go',
    };
  }

  const availability = await getHealthConnectAvailability();
  if (availability === 'not_installed') {
    return {
      granted: false,
      grantedTypes: [],
      reason: 'health_connect_not_installed',
    };
  }
  if (availability === 'update_required') {
    return {
      granted: false,
      grantedTypes: [],
      reason: 'health_connect_update_required',
    };
  }
  if (availability !== 'available') {
    return {
      granted: false,
      grantedTypes: [],
      reason: 'health_connect_unavailable',
    };
  }

  try {
    const { initialize, requestPermission } = await loadHealthConnect();
    const initialized = await initialize();
    if (!initialized) {
      return {
        granted: false,
        grantedTypes: [],
        reason: 'health_connect_init_failed',
      };
    }

    const permissions = READ_RECORD_TYPES.map((recordType) => ({
      accessType: 'read' as const,
      recordType,
    }));

    const granted = await requestPermission(permissions);
    const grantedTypes = granted
      .map((entry) => ('recordType' in entry ? String(entry.recordType) : ''))
      .filter(Boolean);

    if (grantedTypes.length === 0) {
      return {
        granted: false,
        grantedTypes: [],
        reason: 'permission_denied',
      };
    }

    return {
      granted: true,
      grantedTypes,
    };
  } catch (error) {
    return {
      granted: false,
      grantedTypes: [],
      reason: error instanceof Error ? error.message : 'health_connect_error',
    };
  }
}

export async function revokeNativeHealthPermissions(): Promise<boolean> {
  if (!canUseNativeHealth()) {
    return false;
  }
  try {
    const { revokeAllPermissions } = await loadHealthConnect();
    await revokeAllPermissions();
    return true;
  } catch {
    return false;
  }
}

export async function openHealthConnectStore(): Promise<void> {
  await Linking.openURL(HEALTH_CONNECT_PLAY_URL);
}

export async function openHealthConnectSettingsScreen(): Promise<void> {
  try {
    const { openHealthConnectSettings } = await loadHealthConnect();
    openHealthConnectSettings();
  } catch {
    await Linking.openSettings();
  }
}
