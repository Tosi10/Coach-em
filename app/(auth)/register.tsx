/**
 * Register Screen
 *
 * Tela de registro do Coach'em – mesma linguagem visual do login (logo, card, gradiente).
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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';
import { UserType } from '@/src/types';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';

const GRADIENT_ORANGE = ['#f97316', '#ea580c'];
const GRADIENT_ORANGE_SOFT = ['rgba(249, 115, 22, 0.15)', 'rgba(234, 88, 12, 0.05)'];

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { signUp, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState<UserType>(UserType.COACH);
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const user = await signUp({
        email,
        password,
        displayName,
        userType,
        bio: userType === UserType.COACH ? bio : undefined,
        specialization: userType === UserType.COACH ? specialization : undefined,
      });
      await AsyncStorage.setItem('userType', user.userType);
      if (user.userType === UserType.ATHLETE) {
        await AsyncStorage.setItem('currentAthleteId', user.id);
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Erro ao criar conta', err.message);
    }
  };

  const inputStyle = {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={themeStyles.bg}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <View className="pt-12 pb-6 px-6 items-center">
          <LinearGradient
            colors={theme.mode === 'dark' ? GRADIENT_ORANGE_SOFT : ['rgba(251, 146, 60, 0.25)', 'rgba(249, 115, 22, 0.08)']}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <FontAwesome name="heartbeat" size={34} color={theme.colors.primary} />
          </LinearGradient>
          <Text className="text-2xl font-bold tracking-tight" style={themeStyles.text}>
            Criar conta
          </Text>
          <Text className="text-sm mt-1 text-center max-w-[260px]" style={{ color: theme.colors.textSecondary }}>
            Junte-se ao Coach'em
          </Text>
        </View>

        {/* Form card */}
        <View className="px-5">
          <View
            className="rounded-2xl px-5 py-5"
            style={{
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...(theme.mode === 'light' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 } : {}),
            }}
          >
            {/* User type */}
            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Sou
            </Text>
            <View className="flex-row gap-3 mb-5">
              <TouchableOpacity
                className="flex-1 py-3 px-4 rounded-xl border-2"
                style={{
                  borderColor: userType === UserType.COACH ? theme.colors.primary : theme.colors.border,
                  backgroundColor: userType === UserType.COACH
                    ? (theme.mode === 'dark' ? theme.colors.primary + '25' : theme.colors.primary + '12')
                    : theme.colors.background,
                }}
                onPress={() => setUserType(UserType.COACH)}
                activeOpacity={0.8}
              >
                <Text
                  className="text-center font-semibold"
                  style={{
                    color: userType === UserType.COACH ? theme.colors.primary : theme.colors.textSecondary,
                  }}
                >
                  Treinador
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 px-4 rounded-xl border-2"
                style={{
                  borderColor: userType === UserType.ATHLETE ? theme.colors.primary : theme.colors.border,
                  backgroundColor: userType === UserType.ATHLETE
                    ? (theme.mode === 'dark' ? theme.colors.primary + '25' : theme.colors.primary + '12')
                    : theme.colors.background,
                }}
                onPress={() => setUserType(UserType.ATHLETE)}
                activeOpacity={0.8}
              >
                <Text
                  className="text-center font-semibold"
                  style={{
                    color: userType === UserType.ATHLETE ? theme.colors.primary : theme.colors.textSecondary,
                  }}
                >
                  Atleta
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Nome completo
            </Text>
            <TextInput
              className="w-full border rounded-xl px-4 py-3.5 mb-4 text-base"
              style={inputStyle}
              placeholder="Seu nome"
              placeholderTextColor={theme.colors.textTertiary}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Email
            </Text>
            <TextInput
              className="w-full border rounded-xl px-4 py-3.5 mb-4 text-base"
              style={inputStyle}
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
              className="w-full border rounded-xl px-4 py-3.5 mb-4 text-base"
              style={inputStyle}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {userType === UserType.COACH && (
              <>
                <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Especialização (opcional)
                </Text>
                <TextInput
                  className="w-full border rounded-xl px-4 py-3.5 mb-4 text-base"
                  style={inputStyle}
                  placeholder="Ex: Futebol, Atletismo"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={specialization}
                  onChangeText={setSpecialization}
                />
                <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Biografia (opcional)
                </Text>
                <TextInput
                  className="w-full border rounded-xl px-4 py-3.5 mb-4 text-base"
                  style={{ ...inputStyle, minHeight: 80, textAlignVertical: 'top' }}
                  placeholder="Um pouco sobre você..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            {error ? (
              <View className="mb-4 rounded-lg py-2.5 px-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
                <Text className="text-sm text-center" style={{ color: theme.colors.error }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleRegister}
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
                    Criar conta
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              className="mt-5 py-2"
              activeOpacity={0.7}
            >
              <Text className="text-center text-sm" style={{ color: theme.colors.primary }}>
                Já tem uma conta? <Text className="font-semibold">Faça login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
