import type { HealthPermissionResult } from '@/src/types/health';

export type HealthConnectAvailability =
  | 'available'
  | 'not_installed'
  | 'update_required'
  | 'unavailable';

export async function isNativeHealthAvailable(): Promise<boolean> {
  return false;
}

export async function ensureNativeHealthReadyForRead(): Promise<boolean> {
  return false;
}

export async function requestNativeHealthPermissions(): Promise<HealthPermissionResult> {
  return {
    granted: false,
    grantedTypes: [],
    reason: 'unsupported_platform',
  };
}

export async function revokeNativeHealthPermissions(): Promise<boolean> {
  return false;
}

export async function getHealthConnectAvailability(): Promise<HealthConnectAvailability> {
  return 'unavailable';
}

export async function openHealthConnectStore(): Promise<void> {
  // noop
}

export async function openHealthConnectSettingsScreen(): Promise<void> {
  // noop
}
