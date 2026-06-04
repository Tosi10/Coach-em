/**
 * Treinador — convidar atleta por email (P2).
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { sendCoachInviteToAthlete } from '@/src/services/coachInvites.service';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GRADIENT_ORANGE: readonly [string, string] = ['#f97316', '#ea580c'];

export default function InviteAthleteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { user } = useAuthContext();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
  }>({ visible: false, title: '', message: '', type: 'info' });

  if (user?.userType !== UserType.COACH) {
    return (
      <View className="flex-1 justify-center px-6" style={themeStyles.bg}>
        <Text style={themeStyles.text}>{t('inviteAthlete.coachOnly')}</Text>
      </View>
    );
  }

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setAlert({ visible: true, title: t('common.error'), message: t('inviteAthlete.invalidEmail'), type: 'warning' });
      return;
    }
    setBusy(true);
    try {
      await sendCoachInviteToAthlete(trimmed);
      setAlert({
        visible: true,
        title: t('common.success'),
        message: t('inviteAthlete.sent', { email: trimmed }),
        type: 'success',
      });
      setEmail('');
    } catch (e: unknown) {
      setAlert({
        visible: true,
        title: t('common.error'),
        message: e instanceof Error ? e.message : t('inviteAthlete.sendError'),
        type: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        style={themeStyles.bg}
      >
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={() => router.back()} className="mb-4 flex-row items-center">
            <FontAwesome name="chevron-left" size={16} color={theme.colors.primary} />
            <Text className="ml-2" style={{ color: theme.colors.primary }}>
              {t('common.back')}
            </Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold mb-2" style={themeStyles.text}>
            {t('inviteAthlete.title')}
          </Text>
          <Text className="text-sm mb-6" style={themeStyles.textSecondary}>
            {t('inviteAthlete.subtitle')}
          </Text>

          <TextInput
            className="rounded-xl px-4 py-3.5 mb-4 text-base border"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
            placeholder={t('login.emailPlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity onPress={submit} disabled={busy} style={{ borderRadius: 14, overflow: 'hidden' }}>
            <LinearGradient colors={GRADIENT_ORANGE} style={{ paddingVertical: 16, alignItems: 'center' }}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">{t('inviteAthlete.submit')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={() => setAlert((a) => ({ ...a, visible: false }))}
      />
    </>
  );
}
