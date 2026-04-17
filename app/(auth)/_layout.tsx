/**
 * Auth Layout
 *
 * Layout para rotas de autenticação (login, registro).
 * Usa Stack Navigator para transições entre telas de auth.
 * O fundo usa o tema global (ThemeProvider no root).
 */

import { useTheme } from '@/src/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="blocked" />
    </Stack>
  );
}

