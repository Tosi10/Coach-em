import { Platform } from 'react-native';

/**
 * Entry-point seguro para inicializar App Check sem quebrar Expo Go.
 * Importa a implementação nativa apenas quando necessário.
 */
export async function initAppCheck(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (__DEV__) return;

  try {
    const nativeModule = await import('./appCheck.native');
    await nativeModule.initAppCheckNative();
  } catch (error) {
    console.warn('[AppCheck] native init skipped:', error);
  }
}

