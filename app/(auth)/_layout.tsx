/**
 * Auth Layout
 * 
 * Layout para rotas de autenticação (login, registro).
 * Usa Stack Navigator para transições entre telas de auth.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#ffffff',
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

