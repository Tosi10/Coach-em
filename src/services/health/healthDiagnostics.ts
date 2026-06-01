/**
 * Diagnóstico visível no telefone — evita builds só para “adivinhar” falhas de HealthKit.
 */

import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

import { canUseNativeHealth, isExpoGoApp } from './healthRuntime';

export type HealthDiagnostics = {
  collectedAt: string;
  platform: string;
  appOwnership: string | null;
  executionEnvironment: string | null;
  isExpoGo: boolean;
  canUseNativeHealth: boolean;
  iosNativeModulePresent: boolean;
  iosInitHealthKitInBundle: boolean;
  healthNativeModuleKeys: string[];
  nativeAppVersion: string | null;
  expoVersion: string | null;
  /** Último passo do fluxo “Ligar” (preenchido pela UI). */
  lastConnectStep?: string;
  /** Motivo bruto devolvido pelo nativo ou pelo catch. */
  lastRawReason?: string;
};

export async function collectHealthDiagnostics(
  partial?: Pick<HealthDiagnostics, 'lastConnectStep' | 'lastRawReason'>,
): Promise<HealthDiagnostics> {
  const iosNative =
    NativeModules.AppleHealthKit ??
    (NativeModules as { RCTAppleHealthKit?: unknown }).RCTAppleHealthKit;

  let iosInitHealthKitInBundle = false;
  if (Platform.OS === 'ios') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAppleHealthKit } = require('./healthKitBridge') as typeof import('./healthKitBridge.ios');
      const kit = getAppleHealthKit();
      iosInitHealthKitInBundle = typeof kit.initHealthKit === 'function';
    } catch (error) {
      partial = {
        ...partial,
        lastRawReason:
          partial?.lastRawReason ??
          (error instanceof Error ? error.message : 'import react-native-health failed'),
      };
    }
  }

  const healthNativeModuleKeys = Object.keys(NativeModules).filter((key) =>
    /health|Health|Apple/i.test(key),
  );

  return {
    collectedAt: new Date().toISOString(),
    platform: Platform.OS,
    appOwnership: (Constants as { appOwnership?: string | null }).appOwnership ?? null,
    executionEnvironment:
      (Constants as { executionEnvironment?: string | null }).executionEnvironment ?? null,
    isExpoGo: isExpoGoApp(),
    canUseNativeHealth: canUseNativeHealth(),
    iosNativeModulePresent: Boolean(iosNative),
    iosInitHealthKitInBundle,
    healthNativeModuleKeys,
    nativeAppVersion: Constants.nativeAppVersion ?? null,
    expoVersion: Constants.expoVersion ?? null,
    ...partial,
  };
}

export function formatHealthDiagnostics(diag: HealthDiagnostics): string {
  const lines = [
    `coletado: ${diag.collectedAt}`,
    `platform: ${diag.platform}`,
    `appOwnership: ${String(diag.appOwnership)}`,
    `executionEnvironment: ${String(diag.executionEnvironment)}`,
    `isExpoGo: ${diag.isExpoGo}`,
    `canUseNativeHealth: ${diag.canUseNativeHealth}`,
    `iOS NativeModule AppleHealthKit: ${diag.iosNativeModulePresent}`,
    `iOS JS initHealthKit(): ${diag.iosInitHealthKitInBundle}`,
    `NativeModules (saúde): ${diag.healthNativeModuleKeys.length ? diag.healthNativeModuleKeys.join(', ') : '(nenhum)'}`,
    `nativeAppVersion: ${String(diag.nativeAppVersion)}`,
    `expoVersion: ${String(diag.expoVersion)}`,
  ];
  if (diag.lastConnectStep) {
    lines.push(`ultimoPasso: ${diag.lastConnectStep}`);
  }
  if (diag.lastRawReason) {
    lines.push(`motivoBruto: ${diag.lastRawReason}`);
  }
  return lines.join('\n');
}

/** Log sempre visível no Metro / Xcode quando o Dev Client está ligado ao PC. */
export function logHealthDiagnostics(label: string, diag: HealthDiagnostics): void {
  const text = formatHealthDiagnostics(diag);
  console.warn(`[HealthDiag] ${label}\n${text}`);
}
