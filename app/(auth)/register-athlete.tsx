/**
 * Cadastro de atleta — solo ou com código do treinador (P1).
 */

import { CustomAlert } from '@/components/CustomAlert';
import { getPrivacyUrlByLanguage, getTermsUrlByLanguage } from '@/src/constants/legalUrls';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import {
  registerAthleteSelf,
  validateCoachInviteCode,
} from '@/src/services/athleteRegistration.service';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import type { AthleteMode } from '@/src/types/athleteMode';

const GRADIENT_ORANGE: readonly [string, string] = ['#f97316', '#ea580c'];
const INPUT_BORDER_WIDTH = 1;
const inputBorderColor = (isDark: boolean) =>
  isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.2)';

type PathChoice = 'solo' | 'coached' | null;

export default function RegisterAthleteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const isDark = theme.mode === 'dark';
  const fieldBorder = inputBorderColor(isDark);
  const { signUp, loading } = useAuth();

  const [path, setPath] = useState<PathChoice>(null);
  const [coachCode, setCoachCode] = useState('');
  const [coachNamePreview, setCoachNamePreview] = useState<string | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sport, setSport] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    setAlertState({ visible: true, title, message, type });
  };

  const inputStyle = {
    backgroundColor: theme.colors.background,
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: fieldBorder,
    color: theme.colors.text,
  };

  const validateCode = useCallback(async () => {
    const code = coachCode.trim();
    if (code.length < 6) {
      setCodeValid(null);
      setCoachNamePreview(null);
      return;
    }
    setValidatingCode(true);
    try {
      const res = await validateCoachInviteCode(code);
      if (res.valid) {
        setCodeValid(true);
        setCoachNamePreview(res.coachDisplayName);
      } else {
        setCodeValid(false);
        setCoachNamePreview(null);
      }
    } catch (e: unknown) {
      setCodeValid(false);
      setCoachNamePreview(null);
      showAlert(
        t('common.error'),
        e instanceof Error ? e.message : t('registerAthlete.codeValidateError'),
        'error'
      );
    } finally {
      setValidatingCode(false);
    }
  }, [coachCode, t]);

  const handleSubmit = async () => {
    if (!path) {
      showAlert(t('common.error'), t('registerAthlete.choosePath'), 'warning');
      return;
    }
    if (!displayName.trim() || !email.trim() || !password) {
      showAlert(t('common.error'), t('register.fillRequired'), 'warning');
      return;
    }
    if (!acceptedLegal) {
      showAlert(t('common.error'), t('register.acceptWarning'), 'warning');
      return;
    }
    if (path === 'coached') {
      if (!coachCode.trim()) {
        showAlert(t('common.error'), t('registerAthlete.codeRequired'), 'warning');
        return;
      }
      const check = await validateCoachInviteCode(coachCode.trim());
      if (!check.valid) {
        showAlert(t('common.error'), t('registerAthlete.codeInvalid'), 'warning');
        return;
      }
    }

    setSubmitting(true);
    try {
      const athleteMode: AthleteMode = path;
      if (athleteMode === 'solo') {
        await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          userType: (await import('@/src/types')).UserType.ATHLETE,
          athleteMode: 'solo',
          sport: sport.trim() || undefined,
        });
      } else {
        await registerAthleteSelf({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          athleteMode: 'coached',
          coachInviteCode: coachCode.trim(),
          sport: sport.trim() || undefined,
        });
      }
      showAlert(
        t('register.confirmEmailTitle'),
        t('register.confirmEmailBody'),
        'success'
      );
      setTimeout(() => router.replace('/(auth)/login'), 2200);
    } catch (e: unknown) {
      showAlert(
        t('register.createErrorTitle'),
        e instanceof Error ? e.message : t('register.createErrorBody'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="pt-12 pb-4 px-6 items-center">
            <Image
              source={require('../../assets/images/Coach-emNovo03.png')}
              style={{ width: 320, height: 140, marginBottom: 8 }}
              resizeMode="contain"
            />
            <Text className="text-base text-center" style={{ color: theme.colors.textSecondary }}>
              {t('registerAthlete.tagline')}
            </Text>
          </View>

          <View className="flex-1 px-5 pb-8">
            <View
              className="rounded-2xl px-5 py-6"
              style={{
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
                {t('registerAthlete.title')}
              </Text>
              <Text className="text-sm mb-5" style={{ color: theme.colors.textSecondary }}>
                {t('registerAthlete.subtitle')}
              </Text>

              {!path ? (
                <>
                  <TouchableOpacity
                    onPress={() => setPath('solo')}
                    className="rounded-xl p-4 mb-3 border-2"
                    style={{ borderColor: theme.colors.primary }}
                    activeOpacity={0.85}
                  >
                    <Text className="font-semibold text-base" style={{ color: theme.colors.primary }}>
                      {t('registerAthlete.pathSoloTitle')}
                    </Text>
                    <Text className="text-sm mt-1" style={themeStyles.textSecondary}>
                      {t('registerAthlete.pathSoloDesc')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPath('coached')}
                    className="rounded-xl p-4 mb-4 border"
                    style={{ borderColor: theme.colors.border }}
                    activeOpacity={0.85}
                  >
                    <Text className="font-semibold text-base" style={themeStyles.text}>
                      {t('registerAthlete.pathCoachTitle')}
                    </Text>
                    <Text className="text-sm mt-1" style={themeStyles.textSecondary}>
                      {t('registerAthlete.pathCoachDesc')}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={() => setPath(null)} className="mb-4">
                    <Text className="text-sm" style={{ color: theme.colors.primary }}>
                      ← {t('registerAthlete.changePath')}
                    </Text>
                  </TouchableOpacity>

                  {path === 'coached' && (
                    <View className="mb-4">
                      <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                        {t('registerAthlete.coachCode')}
                      </Text>
                      <View className="flex-row gap-2">
                        <TextInput
                          className="flex-1 rounded-xl px-4 py-3.5 text-base"
                          style={inputStyle}
                          placeholder={t('registerAthlete.coachCodePlaceholder')}
                          placeholderTextColor={theme.colors.textTertiary}
                          value={coachCode}
                          onChangeText={(v) => {
                            setCoachCode(v.toUpperCase());
                            setCodeValid(null);
                            setCoachNamePreview(null);
                          }}
                          autoCapitalize="characters"
                        />
                        <TouchableOpacity
                          onPress={validateCode}
                          disabled={validatingCode || !coachCode.trim()}
                          className="rounded-xl px-4 justify-center"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          {validatingCode ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <FontAwesome name="check" size={18} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>
                      {codeValid === true && coachNamePreview ? (
                        <Text className="text-xs mt-2" style={{ color: '#22c55e' }}>
                          {t('registerAthlete.codeOk', { name: coachNamePreview })}
                        </Text>
                      ) : null}
                      {codeValid === false ? (
                        <Text className="text-xs mt-2" style={{ color: '#ef4444' }}>
                          {t('registerAthlete.codeInvalid')}
                        </Text>
                      ) : null}
                    </View>
                  )}

                  <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                    {t('register.fullName')}
                  </Text>
                  <TextInput
                    className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
                    style={inputStyle}
                    placeholder={t('register.namePlaceholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    value={displayName}
                    onChangeText={setDisplayName}
                  />

                  <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                    {t('common.email')}
                  </Text>
                  <TextInput
                    className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
                    style={inputStyle}
                    placeholder={t('login.emailPlaceholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                    {t('common.password')}
                  </Text>
                  <TextInput
                    className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
                    style={inputStyle}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                    {t('registerAthlete.sportOptional')}
                  </Text>
                  <TextInput
                    className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
                    style={inputStyle}
                    placeholder={t('registerAthlete.sportPlaceholder')}
                    placeholderTextColor={theme.colors.textTertiary}
                    value={sport}
                    onChangeText={setSport}
                  />

                  <TouchableOpacity
                    onPress={() => setAcceptedLegal((v) => !v)}
                    className="flex-row items-start mb-5"
                    activeOpacity={0.75}
                  >
                    <View
                      className="mt-0.5 w-6 h-6 rounded-md items-center justify-center border-2 mr-3"
                      style={{
                        borderColor: acceptedLegal ? theme.colors.primary : fieldBorder,
                        backgroundColor: acceptedLegal ? theme.colors.primary : 'transparent',
                      }}
                    >
                      {acceptedLegal ? <FontAwesome name="check" size={12} color="#fff" /> : null}
                    </View>
                    <Text className="flex-1 text-xs leading-5" style={themeStyles.textSecondary}>
                      {t('register.acceptPrefix')}{' '}
                      <Text
                        style={{ color: theme.colors.primary }}
                        onPress={() => Linking.openURL(getTermsUrlByLanguage())}
                      >
                        {t('register.termsLink')}
                      </Text>
                      {t('register.acceptBetween')}
                      <Text
                        style={{ color: theme.colors.primary }}
                        onPress={() => Linking.openURL(getPrivacyUrlByLanguage())}
                      >
                        {t('register.privacyLink')}
                      </Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={busy}
                    activeOpacity={0.85}
                    style={{ overflow: 'hidden', borderRadius: 14 }}
                  >
                    <LinearGradient
                      colors={GRADIENT_ORANGE}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ paddingVertical: 16, alignItems: 'center' }}
                    >
                      {busy ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-base font-semibold" style={{ color: '#ffffff' }}>
                          {t('registerAthlete.submit')}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} className="mt-6 py-2">
              <Text className="text-center text-sm" style={{ color: theme.colors.primary }}>
                {t('register.hasAccountPrefix')}
                <Text className="font-semibold">{t('register.loginInline')}</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="mt-2 py-2">
              <Text className="text-center text-xs" style={themeStyles.textTertiary}>
                {t('registerAthlete.imCoach')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={() => setAlertState((p) => ({ ...p, visible: false }))}
      />
    </>
  );
}
