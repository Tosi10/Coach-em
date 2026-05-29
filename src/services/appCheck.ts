import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/**
 * Entry-point cross-platform para App Check.
 * - Native: delega para `appCheck.native.ts`.
 * - Web: no-op (Coach'em não usa web em produção).
 */
export async function initAppCheck(): Promise<void> {
  if (Platform.OS === 'web') return;
  // Fallback de segurança: durante desenvolvimento local, nunca inicializar
  // App Check nativo para evitar quebra em Expo Go/ambientes sem binário RNFB.
  if (__DEV__) return;
  // Expo Go (store client) não possui os binários nativos do RN Firebase.
  const isExpoGo =
    (Constants as any)?.executionEnvironment === 'storeClient' ||
    (Constants as any)?.appOwnership === 'expo';
  if (isExpoGo) return;
  // Expo Go não inclui os módulos nativos do react-native-firebase.
  // Só tentamos inicializar App Check quando o módulo nativo está presente
  // (Dev Client / build nativo).
  if (!NativeModules.RNFBAppModule) return;
  try {
    const nativeModule = await import('./appCheck.native');
    await nativeModule.initAppCheckNative();
  } catch (error) {
    // Em ambiente sem binário nativo correto, não quebrar bootstrap do app.
    console.warn('[AppCheck] native init skipped:', error);
  }
}

