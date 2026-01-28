/**
 * Register Screen
 * 
 * Tela de registro do Coach'em.
 * Permite escolher entre COACH e ATHLETE.
 */

import { useAuth } from '@/src/hooks/useAuth';
import { UserType } from '@/src/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';

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
      await signUp({
        email,
        password,
        displayName,
        userType,
        bio: userType === UserType.COACH ? bio : undefined,
        specialization: userType === UserType.COACH ? specialization : undefined,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Erro ao criar conta', err.message);
    }
  };

  return (
    <ScrollView className="flex-1" style={themeStyles.bg}>
      <View className="flex-1 items-center justify-center px-6 py-12">
        <View className="w-full max-w-md">
          {/* Title */}
          <Text className="text-4xl font-bold mb-2 text-center" style={themeStyles.text}>
            Criar Conta
          </Text>
          <Text className="mb-8 text-center" style={themeStyles.textSecondary}>
            Junte-se ao Coach'em
          </Text>

          {/* User Type Selection */}
          <View className="flex-row gap-2 mb-6">
            <TouchableOpacity
              className="flex-1 py-3 px-4 rounded-lg border-2"
              style={{
                borderColor: userType === UserType.COACH
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: userType === UserType.COACH
                  ? (theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20')
                  : theme.colors.card,
              }}
              onPress={() => setUserType(UserType.COACH)}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color: userType === UserType.COACH
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }}
              >
                Treinador
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 px-4 rounded-lg border-2"
              style={{
                borderColor: userType === UserType.ATHLETE
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: userType === UserType.ATHLETE
                  ? (theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20')
                  : theme.colors.card,
              }}
              onPress={() => setUserType(UserType.ATHLETE)}
            >
              <Text
                className="text-center font-semibold"
                style={{
                  color: userType === UserType.ATHLETE
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }}
              >
                Atleta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Display Name */}
          <TextInput
            className="w-full border rounded-lg px-4 py-3 mb-4"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
            placeholder="Nome completo"
            placeholderTextColor={theme.colors.textTertiary}
            value={displayName}
            onChangeText={setDisplayName}
          />

          {/* Email */}
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

          {/* Password */}
          <TextInput
            className="w-full border rounded-lg px-4 py-3 mb-4"
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

          {/* Coach-specific fields */}
          {userType === UserType.COACH && (
            <>
              <TextInput
                className="w-full border rounded-lg px-4 py-3 mb-4"
                style={{
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
                placeholder="Especialização (ex: Futebol, Atletismo)"
                placeholderTextColor={theme.colors.textTertiary}
                value={specialization}
                onChangeText={setSpecialization}
              />
              <TextInput
                className="w-full border rounded-lg px-4 py-3 mb-4"
                style={{
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
                placeholder="Biografia (opcional)"
                placeholderTextColor={theme.colors.textTertiary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {/* Register Button */}
          <TouchableOpacity
            className="w-full rounded-lg py-4 mb-4"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-center font-semibold text-base" style={{ color: '#ffffff' }}>
                Criar Conta
              </Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text className="text-center text-sm" style={{ color: theme.colors.primary }}>
              Já tem uma conta? Faça login
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
    </ScrollView>
  );
}


