/**
 * Criação de conta — treinador ou atleta (escolha + formulário na mesma página).
 */

import {
  AuthInlineRegister,
  AuthRegisterModePicker,
  type RegisterMode,
} from '@/components/auth/AuthInlineRegister';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { register } = useLocalSearchParams<{ register?: string }>();
  const [mode, setMode] = useState<RegisterMode>(null);

  useEffect(() => {
    if (register === 'coach') setMode('coach');
    else if (register === 'athlete') setMode('athlete');
  }, [register]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={0}
      className="flex-1"
      style={themeStyles.bg}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-12 pb-6 px-6 items-center">
          <Image
            source={require('../../assets/images/Coach-emNovo03.png')}
            style={{ width: 360, height: 150, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text className="text-base text-center max-w-[280px]" style={{ color: theme.colors.textSecondary }}>
            {t('signUp.tagline')}
          </Text>
        </View>

        <View className="flex-1 px-5 pb-8">
          <View
            className="rounded-2xl px-5 py-6"
            style={{
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...(theme.mode === 'light'
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }
                : {}),
            }}
          >
            <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
              {t('signUp.title')}
            </Text>
            <Text className="text-sm mb-5" style={{ color: theme.colors.textSecondary }}>
              {t('signUp.subtitle')}
            </Text>

            <AuthRegisterModePicker mode={mode} onSelect={setMode} showDivider={false} />

            <AuthInlineRegister
              mode={mode}
              onClose={() => router.replace('/(auth)/login')}
              embedded
            />
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            className="mt-6 py-2"
            activeOpacity={0.7}
          >
            <Text className="text-center text-sm" style={{ color: theme.colors.primary }}>
              {t('register.hasAccountPrefix')}
              <Text className="font-semibold">{t('register.loginInline')}</Text>
            </Text>
          </TouchableOpacity>

          <Text className="text-center text-[11px] mt-3" style={themeStyles.textTertiary}>
            {t('login.developedBy')}{' '}
            <Text style={{ color: theme.colors.primary }}>Vision10</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
