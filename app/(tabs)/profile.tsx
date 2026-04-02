/**
 * Aba Perfil – configurações e conta
 *
 * Treinador e atleta: dados do usuário, tema, logout.
 * Espaço para futuras opções (deletar conta, financeiro, etc.).
 */

import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      await AsyncStorage.removeItem('userType');
      await AsyncStorage.removeItem('currentAthleteId');
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Erro ao sair:', e);
      setLoggingOut(false);
    }
  };

  const isCoach = user?.userType === UserType.COACH;

  return (
    <ScrollView className="flex-1" style={themeStyles.bg}>
      <View className="px-6 pt-14 pb-20">
        <Text className="text-2xl font-bold mb-1" style={themeStyles.text}>
          Perfil
        </Text>
        <Text className="mb-6 text-sm" style={themeStyles.textSecondary}>
          Configurações da sua conta
        </Text>

        {/* Card: dados do usuário */}
        <View
          className="rounded-2xl p-5 mb-6 border"
          style={[themeStyles.card, { borderWidth: 1 }]}
        >
          <View className="flex-row items-center mb-4">
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.colors.primary + '25' }}
            >
              {isCoach ? (
                <FontAwesome name="user" size={26} color={theme.colors.primary} />
              ) : (
                <Image
                  source={require('../../assets/images/Coracao.png')}
                  style={{ width: 38, height: 38 }}
                  resizeMode="contain"
                />
              )}
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold" style={themeStyles.text}>
                {user?.displayName ?? 'Usuário'}
              </Text>
              <Text className="text-sm" style={themeStyles.textSecondary}>
                {user?.email}
              </Text>
              <View className="mt-1.5 self-start rounded-lg px-2.5 py-1" style={{ backgroundColor: theme.colors.primary + '20' }}>
                <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
                  {isCoach ? 'Treinador' : 'Atleta'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Aparência */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
            Aparência
          </Text>
          <View className="rounded-2xl border p-4" style={[themeStyles.card, { borderWidth: 1 }]}>
            <ThemeToggle />
          </View>
        </View>

        {/* Conta */}
        <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
          Conta
        </Text>
        <View className="rounded-2xl border overflow-hidden" style={{ borderColor: theme.colors.border, borderWidth: 1 }}>
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4 border-b"
            style={{ backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border, borderBottomWidth: 1 }}
            onPress={handleLogout}
            disabled={loading || loggingOut}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <FontAwesome name="sign-out" size={20} color={theme.colors.error} style={{ marginRight: 12 }} />
              <Text className="font-semibold" style={{ color: theme.colors.error }}>
                Sair da conta
              </Text>
            </View>
            {(loading || loggingOut) ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
            )}
          </TouchableOpacity>

          {/* Deletar conta – placeholder para depois */}
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4"
            style={{ backgroundColor: theme.colors.card }}
            disabled
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <FontAwesome name="trash-o" size={20} color={theme.colors.textTertiary} style={{ marginRight: 12 }} />
              <Text className="font-medium" style={themeStyles.textTertiary}>
                Deletar conta
              </Text>
            </View>
            <Text className="text-xs" style={themeStyles.textTertiary}>
              Em breve
            </Text>
          </TouchableOpacity>
        </View>

        {/* Espaço para futuro: financeiro, notificações, etc. */}
        <View className="mt-8 rounded-xl py-3 px-4" style={{ backgroundColor: theme.colors.backgroundSecondary }}>
          <Text className="text-xs text-center" style={themeStyles.textTertiary}>
            Em breve: mais opções de configuração e preferências.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
