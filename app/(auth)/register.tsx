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

export default function RegisterScreen() {
  const router = useRouter();
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
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6 py-12">
        <View className="w-full max-w-md">
          {/* Title */}
          <Text className="text-4xl font-bold text-neutral-900 mb-2 text-center">
            Criar Conta
          </Text>
          <Text className="text-neutral-600 mb-8 text-center">
            Junte-se ao Coach'em
          </Text>

          {/* User Type Selection */}
          <View className="flex-row gap-2 mb-6">
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                userType === UserType.COACH
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 bg-neutral-50'
              }`}
              onPress={() => setUserType(UserType.COACH)}
            >
              <Text
                className={`text-center font-semibold ${
                  userType === UserType.COACH
                    ? 'text-primary-600'
                    : 'text-neutral-600'
                }`}
              >
                Treinador
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                userType === UserType.ATHLETE
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-200 bg-neutral-50'
              }`}
              onPress={() => setUserType(UserType.ATHLETE)}
            >
              <Text
                className={`text-center font-semibold ${
                  userType === UserType.ATHLETE
                    ? 'text-primary-600'
                    : 'text-neutral-600'
                }`}
              >
                Atleta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Display Name */}
          <TextInput
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 mb-4 text-neutral-900"
            placeholder="Nome completo"
            placeholderTextColor="#a3a3a3"
            value={displayName}
            onChangeText={setDisplayName}
          />

          {/* Email */}
          <TextInput
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 mb-4 text-neutral-900"
            placeholder="Email"
            placeholderTextColor="#a3a3a3"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          {/* Password */}
          <TextInput
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 mb-4 text-neutral-900"
            placeholder="Senha"
            placeholderTextColor="#a3a3a3"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* Coach-specific fields */}
          {userType === UserType.COACH && (
            <>
              <TextInput
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 mb-4 text-neutral-900"
                placeholder="Especialização (ex: Futebol, Atletismo)"
                placeholderTextColor="#a3a3a3"
                value={specialization}
                onChangeText={setSpecialization}
              />
              <TextInput
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 mb-4 text-neutral-900"
                placeholder="Biografia (opcional)"
                placeholderTextColor="#a3a3a3"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {/* Register Button */}
          <TouchableOpacity
            className="w-full bg-primary-600 rounded-lg py-4 mb-4"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Criar Conta
              </Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text className="text-primary-600 text-center text-sm">
              Já tem uma conta? Faça login
            </Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error && (
            <Text className="text-red-500 text-sm mt-4 text-center">
              {error}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}


