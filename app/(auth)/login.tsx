/**
 * Login Screen
 *
 * Tela de login do Coach'em – design com logo, card e gradiente.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { UserType } from '@/src/types';

const GRADIENT_ORANGE = ['#f97316', '#ea580c'];
const GRADIENT_ORANGE_SOFT = ['rgba(249, 115, 22, 0.15)', 'rgba(234, 88, 12, 0.05)'];

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { signIn, signInDev, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      const user = await signIn({ email, password });
      await AsyncStorage.setItem('userType', user.userType);
      if (user.userType === UserType.ATHLETE) {
        await AsyncStorage.setItem('currentAthleteId', user.id);
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.message ?? 'Erro ao fazer login';
      Alert.alert('Erro ao fazer login', msg);
    }
  };

  const handleDevLogin = async () => {
    if (!signInDev) return;
    signInDev();
    await AsyncStorage.setItem('userType', UserType.COACH);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={themeStyles.bg}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <View className="pt-14 pb-8 px-6 items-center">
          <LinearGradient
            colors={theme.mode === 'dark' ? GRADIENT_ORANGE_SOFT : ['rgba(251, 146, 60, 0.25)', 'rgba(249, 115, 22, 0.08)']}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <FontAwesome name="heartbeat" size={40} color={theme.colors.primary} />
          </LinearGradient>
          <Text className="text-3xl font-bold tracking-tight" style={themeStyles.text}>
            Coach'em
          </Text>
          <Text className="text-base mt-1.5 text-center max-w-[260px]" style={{ color: theme.colors.textSecondary }}>
            Gestão de Performance Esportiva
          </Text>
        </View>

        {/* Form card */}
        <View className="flex-1 px-5 pb-8">
          <View
            className="rounded-2xl px-5 py-6"
            style={{
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...(theme.mode === 'light' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 } : {}),
            }}
          >
            <Text className="text-lg font-semibold mb-5" style={themeStyles.text}>
              Entrar na sua conta
            </Text>

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Email
            </Text>
            <TextInput
              className="w-full border rounded-xl px-4 py-3.5 mb-4 text-base"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
              placeholder="seu@email.com"
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Senha
            </Text>
            <TextInput
              className="w-full border rounded-xl px-4 py-3.5 mb-6 text-base"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {error ? (
              <View className="mb-4 rounded-lg py-3 px-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
                <Text className="text-xs font-medium mb-1" style={{ color: theme.colors.error }}>
                  Erro ao conectar
                </Text>
                <Text className="text-sm" style={{ color: theme.colors.error }}>
                  {error}
                </Text>
                <Text className="text-xs mt-2" style={{ color: theme.colors.textTertiary }}>
                  Confira o .env (EXPO_PUBLIC_FIREBASE_*) e se o projeto está ativo no Firebase Console.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={{ overflow: 'hidden', borderRadius: 14 }}
            >
              <LinearGradient
                colors={GRADIENT_ORANGE}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-base font-semibold" style={{ color: '#ffffff' }}>
                    Entrar
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              disabled={loading}
              className="mt-6 py-2"
              activeOpacity={0.7}
            >
              <Text className="text-center text-sm" style={{ color: theme.colors.primary }}>
                Não tem uma conta? <Text className="font-semibold">Registre-se</Text>
              </Text>
            </TouchableOpacity>

            {signInDev ? (
              <TouchableOpacity
                onPress={handleDevLogin}
                disabled={loading}
                className="mt-6 py-3 rounded-xl border border-dashed"
                style={{ borderColor: theme.colors.border }}
                activeOpacity={0.7}
              >
                <Text className="text-center text-sm" style={{ color: theme.colors.textTertiary }}>
                  Usar app sem login (desenvolvimento)
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
