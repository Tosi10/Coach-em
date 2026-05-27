import Constants from 'expo-constants';
import { NativeModules } from 'react-native';

let initialized = false;

export async function initAppCheckNative(): Promise<void> {
  if (initialized) return;
  // Expo Go / ambiente sem binário nativo RN Firebase: sair sem quebrar.
  const isExpoGo =
    (Constants as any)?.executionEnvironment === 'storeClient' ||
    (Constants as any)?.appOwnership === 'expo';
  if (isExpoGo) return;
  if (!NativeModules.RNFBAppModule) return;

  const isPreview = process.env.EXPO_PUBLIC_ENVIRONMENT === 'preview' || __DEV__;
  const androidDebugToken = process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN_ANDROID;
  const iosDebugToken = process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN_IOS;

  // Import dinâmico para não carregar o módulo nativo em Expo Go.
  const { initializeAppCheck } = await import('@react-native-firebase/app-check');

  await initializeAppCheck(undefined, {
    provider: {
      providerOptions: {
        android: {
          provider: isPreview ? 'debug' : 'playIntegrity',
          debugToken: androidDebugToken,
        },
        apple: {
          provider: isPreview ? 'debug' : 'appAttestWithDeviceCheckFallback',
          debugToken: iosDebugToken,
        },
      },
    },
    isTokenAutoRefreshEnabled: true,
  });

  initialized = true;
}