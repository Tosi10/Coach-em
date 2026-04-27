/**
 * Primeiro acesso do atleta: aceite obrigatório de Termos e Privacidade antes das tabs.
 * Não aparece para treinadores. Persistência local (AsyncStorage).
 */

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
  ATHLETE_LEGAL_ACCEPTANCE_KEY,
  TREINA_PRIVACY_URL,
  TREINA_TERMS_URL,
} from '@/src/constants/legalUrls';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';

const INPUT_BORDER_WIDTH = 1;
const inputBorderColor = (isDark: boolean) =>
  isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.2)';

export default function AthleteLegalAcceptanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const isDark = theme.mode === 'dark';
  const fieldBorder = inputBorderColor(isDark);
  const { user, signOut, loading } = useAuthContext();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    if (user.userType !== UserType.ATHLETE) {
      router.replace('/(tabs)');
    }
  }, [user, loading, router]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  const handleContinue = async () => {
    if (!accepted) return;
    try {
      await AsyncStorage.setItem(ATHLETE_LEGAL_ACCEPTANCE_KEY, 'true');
      router.replace('/(tabs)');
    } catch {
      // ainda assim tenta entrar
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={themeStyles.bg}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 24),
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold mb-2" style={themeStyles.text}>
          Bem-vindo ao Treina+
        </Text>
        <Text className="text-base mb-6 leading-6" style={{ color: theme.colors.textSecondary }}>
          Antes de usar o app, confirme que leu e aceita os documentos legais. O seu treinador continua
          responsável pela orientação desportiva.
        </Text>

        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          onPress={() => setAccepted((v) => !v)}
          activeOpacity={0.75}
          className="flex-row items-start mb-8"
        >
          <View
            className="mt-0.5 w-6 h-6 rounded-md items-center justify-center border-2"
            style={{
              borderColor: accepted ? theme.colors.primary : fieldBorder,
              backgroundColor: accepted ? theme.colors.primary : 'transparent',
            }}
          >
            {accepted ? <FontAwesome name="check" size={14} color="#ffffff" /> : null}
          </View>
          <Text className="flex-1 ml-3 text-sm leading-5" style={{ color: theme.colors.textSecondary }}>
            Li e aceito os{' '}
            <Text
              onPress={() => Linking.openURL(TREINA_TERMS_URL)}
              style={{ color: theme.colors.primary, fontWeight: '600' }}
              accessibilityRole="link"
            >
              Termos de Uso
            </Text>
            {' e a '}
            <Text
              onPress={() => Linking.openURL(TREINA_PRIVACY_URL)}
              style={{ color: theme.colors.primary, fontWeight: '600' }}
              accessibilityRole="link"
            >
              Política de Privacidade
            </Text>
            .
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={!accepted}
          activeOpacity={0.85}
          className="rounded-xl py-4 items-center mb-4"
          style={{
            backgroundColor: theme.colors.primary,
            opacity: accepted ? 1 : 0.5,
          }}
        >
          <Text className="text-base font-semibold" style={{ color: '#ffffff' }}>
            Continuar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => signOut()} className="py-3" activeOpacity={0.7}>
          <Text className="text-center text-sm" style={{ color: theme.colors.textTertiary }}>
            Sair da conta
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
