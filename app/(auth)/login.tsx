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

export default function LoginScreen() {
  const router = useRouter();
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
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="w-full max-w-md">
        {/* Logo/Title */}
        <Text className="text-4xl font-bold text-neutral-900 mb-2 text-center">
          Coach'em
        </Text>
        <Text className="text-neutral-600 mb-8 text-center">
          Gestão de Performance Esportiva
        </Text>

        {/* Email Input */}
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

        {/* Password Input */}
        <TextInput
          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 mb-6 text-neutral-900"
          placeholder="Senha"
          placeholderTextColor="#a3a3a3"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {/* Login Button */}
        <TouchableOpacity
          className="w-full bg-primary-600 rounded-lg py-4 mb-4"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              Entrar
            </Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          disabled={loading}
        >
          <Text className="text-primary-600 text-center text-sm">
            Não tem uma conta? Registre-se
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
  );
}


