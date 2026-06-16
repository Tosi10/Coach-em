import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

/**
 * Samsung e outros Android às vezes reportam inset inferior 0 com navegação de 3 botões.
 * Fallback mínimo evita tab bar / conteúdo colado na barra do sistema.
 */
export function getAndroidBottomInset(insets: EdgeInsets, min = 20): number {
  if (Platform.OS !== 'android') {
    return Math.max(insets.bottom, 6);
  }
  return Math.max(insets.bottom, min);
}
