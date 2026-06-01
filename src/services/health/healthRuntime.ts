import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/**
 * Indica se o binário atual pode usar HealthKit / Health Connect (Dev Client ou loja).
 * Expo Go não inclui os módulos nativos — retorna false.
 */
export function canUseNativeHealth(): boolean {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  const executionEnvironment = (Constants as { executionEnvironment?: string })
    .executionEnvironment;
  const appOwnership = (Constants as { appOwnership?: string }).appOwnership;

  const isExpoGo =
    executionEnvironment === 'storeClient' || appOwnership === 'expo';

  if (isExpoGo) {
    return false;
  }

  if (Platform.OS === 'ios') {
    // react-native-health expõe NativeModules.AppleHealthKit (ver index.js do pacote).
    return Boolean(
      NativeModules.AppleHealthKit ??
        (NativeModules as { RCTAppleHealthKit?: unknown }).RCTAppleHealthKit,
    );
  }

  return Boolean(
    NativeModules.HealthConnect ||
      NativeModules.RNHealthConnect ||
      NativeModules.HealthConnectManager,
  );
}
