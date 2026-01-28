/**
 * Login Screen
 * 
 * Tela de login do Coach'em.
 * Design minimalista seguindo o estilo suíço.
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { signIn, loading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      await signIn({ email, password });
      // Navegação será feita automaticamente pelo hook useAuth
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Erro ao fazer login', err.message);
    }
  };

  return (
    <View className="flex-1 items-center justify-center px-6" style={themeStyles.bg}>
      <View className="w-full max-w-md">
        {/* Logo/Title */}
        <Text className="text-4xl font-bold mb-2 text-center" style={themeStyles.text}>
          Coach'em
        </Text>
        <Text className="mb-8 text-center" style={themeStyles.textSecondary}>
          Gestão de Performance Esportiva
        </Text>

        {/* Email Input */}
        <TextInput
          className="w-full border rounded-lg px-4 py-3 mb-4"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          }}
          placeholder="Email"
          placeholderTextColor={theme.colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        {/* Password Input */}
        <TextInput
          className="w-full border rounded-lg px-4 py-3 mb-6"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          }}
          placeholder="Senha"
          placeholderTextColor={theme.colors.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {/* Login Button */}
        <TouchableOpacity
          className="w-full rounded-lg py-4 mb-4"
          style={{ backgroundColor: theme.colors.primary }}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-center font-semibold text-base" style={{ color: '#ffffff' }}>
              Entrar
            </Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          disabled={loading}
        >
          <Text className="text-center text-sm" style={{ color: theme.colors.primary }}>
            Não tem uma conta? Registre-se
          </Text>
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <Text className="text-sm mt-4 text-center" style={{ color: '#ef4444' }}>
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}


