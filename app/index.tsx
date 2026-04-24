/**
 * Tela gate – entrada do app após o layout.
 * Redireciona para (auth)/login se não logado, ou para (tabs) se logado.
 * Sincroniza userType e currentAthleteId no AsyncStorage para o restante do app.
 */

import { useAuthContext } from '@/src/contexts/AuthContext';
import { persistSessionAndNavigateHome } from '@/src/utils/navigateAfterAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';

export default function GateScreen() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);

  useEffect(() => {
    if (loading) return;

    const run = async () => {
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      await persistSessionAndNavigateHome(router.replace, user);
    };

    run();
  }, [user, loading]);

  return (
    <View className="flex-1 items-center justify-center" style={themeStyles.bg}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
