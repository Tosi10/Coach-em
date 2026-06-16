import { useTheme } from '@/src/contexts/ThemeContext';
import { applyAndroidNavigationBar } from '@/src/utils/androidNavigationBar';
import { useEffect } from 'react';

/** Mantém a barra de navegação Android alinhada ao tema (reaplica quando `syncKey` muda). */
export function useAndroidNavigationBarSync(syncKey?: unknown) {
  const { theme } = useTheme();

  useEffect(() => {
    void applyAndroidNavigationBar({
      backgroundColor: theme.colors.background,
      buttonStyle: theme.mode === 'dark' ? 'light' : 'dark',
    });
  }, [theme.colors.background, theme.mode, syncKey]);
}
