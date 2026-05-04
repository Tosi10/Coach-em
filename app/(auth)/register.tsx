/**
 * Register Screen
 *
 * Cadastro exclusivo para treinador (conta própria no app).
 * Atletas são criados pelo treinador em "Adicionar atleta".
 */

import { CustomAlert } from '@/components/CustomAlert';
import { TREINA_PRIVACY_URL, TREINA_TERMS_URL } from '@/src/constants/legalUrls';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const GRADIENT_ORANGE: readonly [string, string] = ['#f97316', '#ea580c'];
const INPUT_BORDER_WIDTH = 1;
const inputBorderColor = (isDark: boolean) =>
  isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.2)';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const isDark = theme.mode === 'dark';
  const fieldBorder = inputBorderColor(isDark);
  const { signUp, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    onConfirm?: () => void
  ) => {
    setAlertState({ visible: true, title, message, type, onConfirm });
  };

  const inputStyle = {
    backgroundColor: theme.colors.background,
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: fieldBorder,
    color: theme.colors.text,
  };
  const singleLineInputStyle = {
    ...inputStyle,
    height: 56,
    paddingVertical: 0,
    textAlignVertical: 'center' as const,
  };

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      showAlert(t('common.error'), t('register.fillRequired'), 'warning');
      return;
    }
    if (!acceptedLegal) {
      showAlert(
        t('common.warning'),
        t('register.acceptWarning'),
        'warning'
      );
      return;
    }

    try {
      await signUp({
        email,
        password,
        displayName,
        userType: UserType.COACH,
        bio: bio.trim() || undefined,
        specialization: specialization.trim() || undefined,
      });
      showAlert(
        t('register.confirmEmailTitle'),
        t('register.confirmEmailBody'),
        'success',
        () => router.replace('/(auth)/login')
      );
    } catch (err: any) {
      showAlert(t('register.createErrorTitle'), err?.message ?? t('register.createErrorBody'), 'error');
    }
  };

  return (
    <>
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
        <View className="pt-14 pb-8 px-6 items-center">
          <Image
            source={require('../../assets/images/Coach-emNovo03.png')}
            style={{ width: 420, height: 180, marginTop: 50, marginBottom: 90 }}
            resizeMode="contain"
          />
          <Text
            className="text-base text-center max-w-[260px]"
            style={{ color: theme.colors.textSecondary, marginTop: -80 }}
          >
            {t('register.tagline')}
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
                ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }
                : {}),
            }}
          >
            <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
              {t('register.title')}
            </Text>
            <Text className="text-sm mb-5" style={{ color: theme.colors.textSecondary }}>
              {t('register.subtitle')}
            </Text>

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              {t('register.fullName')}
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={singleLineInputStyle}
              placeholder={t('register.namePlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              {t('common.email')}
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={singleLineInputStyle}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              {t('common.password')}
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={singleLineInputStyle}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              {t('register.specializationOptional')}
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={singleLineInputStyle}
              placeholder={t('register.specializationPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={specialization}
              onChangeText={setSpecialization}
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              {t('register.bioOptional')}
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={{ ...inputStyle, minHeight: 80, textAlignVertical: 'top' }}
              placeholder={t('register.bioPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedLegal }}
              onPress={() => setAcceptedLegal((v) => !v)}
              activeOpacity={0.75}
              className="flex-row items-start mb-5"
            >
              <View
                className="mt-0.5 w-6 h-6 rounded-md items-center justify-center border-2"
                style={{
                  borderColor: acceptedLegal ? theme.colors.primary : fieldBorder,
                  backgroundColor: acceptedLegal ? theme.colors.primary : 'transparent',
                }}
              >
                {acceptedLegal ? (
                  <FontAwesome name="check" size={14} color="#ffffff" />
                ) : null}
              </View>
              <Text className="flex-1 ml-3 text-sm leading-5" style={{ color: theme.colors.textSecondary }}>
                {t('register.acceptPrefix')}{' '}
                <Text
                  onPress={() => Linking.openURL(TREINA_TERMS_URL)}
                  style={{ color: theme.colors.primary, fontWeight: '600' }}
                  accessibilityRole="link"
                >
                  {t('register.termsLink')}
                </Text>
                {t('register.acceptBetween')}
                <Text
                  onPress={() => Linking.openURL(TREINA_PRIVACY_URL)}
                  style={{ color: theme.colors.primary, fontWeight: '600' }}
                  accessibilityRole="link"
                >
                  {t('register.privacyLink')}
                </Text>
                .
              </Text>
            </TouchableOpacity>

            {error ? (
              <View className="mb-4 rounded-lg py-2.5 px-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
                <Text className="text-sm text-center" style={{ color: theme.colors.error }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading || !acceptedLegal}
              activeOpacity={0.85}
              style={{ overflow: 'hidden', borderRadius: 14, opacity: !acceptedLegal && !loading ? 0.55 : 1 }}
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
                    {t('register.submit')}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              className="mt-6 py-2"
              activeOpacity={0.7}
            >
              <Text className="text-center text-sm" style={{ color: theme.colors.primary }}>
                {t('register.hasAccountPrefix')}
                <Text className="font-semibold">{t('register.loginInline')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    <CustomAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      onConfirm={() => {
        const onConfirm = alertState.onConfirm;
        setAlertState((prev) => ({ ...prev, visible: false, onConfirm: undefined }));
        onConfirm?.();
      }}
    />
    </>
  );
}
