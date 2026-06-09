/**
 * Registo treinador / atleta inline no ecrã de login (sem navegar para outro ficheiro).
 */

import { CustomAlert } from '@/components/CustomAlert';
import { getPrivacyUrlByLanguage, getTermsUrlByLanguage } from '@/src/constants/legalUrls';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import {
  registerAthleteSelf,
  validateCoachInviteCode,
} from '@/src/services/athleteRegistration.service';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const GRADIENT_ORANGE: readonly [string, string] = ['#f97316', '#ea580c'];
const INPUT_BORDER_WIDTH = 1;
const inputBorderColor = (isDark: boolean) =>
  isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.2)';

export type RegisterMode = 'coach' | 'athlete' | null;
type AthletePath = 'solo' | 'coached' | null;

type Props = {
  mode: RegisterMode;
  onClose: () => void;
};

export function AuthRegisterModePicker({
  mode,
  onSelect,
}: {
  mode: RegisterMode;
  onSelect: (m: 'coach' | 'athlete') => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);

  const pill = (target: 'coach' | 'athlete', icon: ComponentProps<typeof FontAwesome>['name']) => {
    const active = mode === target;
    return (
      <TouchableOpacity
        onPress={() => onSelect(target)}
        activeOpacity={0.85}
        className="flex-1 rounded-xl border px-3 py-3.5"
        style={{
          flex: 1,
          borderColor: active ? theme.colors.primary + '99' : theme.colors.border,
          backgroundColor: active ? theme.colors.primary + '18' : theme.colors.background,
        }}
      >
        <View className="items-center">
          <FontAwesome
            name={icon}
            size={18}
            color={active ? theme.colors.primary : theme.colors.textSecondary}
            style={{ marginBottom: 6 }}
          />
          <Text
            className="text-center text-xs font-semibold"
            style={{ color: active ? theme.colors.primary : themeStyles.text.color }}
          >
            {target === 'coach' ? t('login.registerCoachShort') : t('login.registerAthleteShort')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="mt-6">
      <View className="flex-row items-center mb-4">
        <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.border }} />
        <Text className="mx-3 text-xs font-medium" style={{ color: theme.colors.textTertiary }}>
          {t('login.orCreateAccount')}
        </Text>
        <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.border }} />
      </View>
      <View className="flex-row" style={{ gap: 10 }}>
        {pill('coach', 'id-card')}
        {pill('athlete', 'user')}
      </View>
    </View>
  );
}

export function AuthInlineRegister({ mode, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const isDark = theme.mode === 'dark';
  const fieldBorder = inputBorderColor(isDark);
  const { signUp, loading } = useAuth();

  const [athletePath, setAthletePath] = useState<AthletePath>(null);
  const [coachCode, setCoachCode] = useState('');
  const [coachNamePreview, setCoachNamePreview] = useState<string | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sport, setSport] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
    onConfirm: undefined as (() => void) | undefined,
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    onConfirm?: () => void
  ) => setAlertState({ visible: true, title, message, type, onConfirm });

  const inputStyle = {
    backgroundColor: theme.colors.background,
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: fieldBorder,
    color: theme.colors.text,
    height: 52,
    paddingVertical: 0,
    textAlignVertical: 'center' as const,
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
      setCodeValid(res.valid);
      setCoachNamePreview(res.valid ? res.coachDisplayName : null);
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

  const submitCoach = async () => {
    if (!email.trim() || !password || !displayName.trim()) {
      showAlert(t('common.error'), t('register.fillRequired'), 'warning');
      return;
    }
    if (!acceptedLegal) {
      showAlert(t('common.warning'), t('register.acceptWarning'), 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        userType: UserType.COACH,
        bio: bio.trim() || undefined,
        specialization: specialization.trim() || undefined,
      });
      showAlert(t('register.confirmEmailTitle'), t('register.confirmEmailBody'), 'success', onClose);
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

  const submitAthlete = async () => {
    if (!athletePath) {
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
    if (athletePath === 'coached') {
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
      if (athletePath === 'solo') {
        await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          userType: UserType.ATHLETE,
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
      showAlert(t('register.confirmEmailTitle'), t('register.confirmEmailBody'), 'success', onClose);
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

  if (!mode) return null;

  const athletePathPill = (path: 'solo' | 'coached', label: string) => {
    const active = athletePath === path;
    return (
      <TouchableOpacity
        onPress={() => setAthletePath(path)}
        activeOpacity={0.85}
        className="flex-1 rounded-xl border px-2 py-2.5"
        style={{
          flex: 1,
          borderColor: active ? theme.colors.primary + '99' : theme.colors.border,
          backgroundColor: active ? theme.colors.primary + '14' : theme.colors.background,
        }}
      >
        <Text
          className="text-center text-xs font-semibold"
          style={{ color: active ? theme.colors.primary : themeStyles.text.color }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const legalCheckbox = (
    <TouchableOpacity
      onPress={() => setAcceptedLegal((v) => !v)}
      className="flex-row items-start mb-4 mt-1"
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
          onPress={() => Linking.openURL(getTermsUrlByLanguage(i18n.language))}
        >
          {t('register.termsLink')}
        </Text>
        {t('register.acceptBetween')}
        <Text
          style={{ color: theme.colors.primary }}
          onPress={() => Linking.openURL(getPrivacyUrlByLanguage(i18n.language))}
        >
          {t('register.privacyLink')}
        </Text>
      </Text>
    </TouchableOpacity>
  );

  const submitButton = (label: string, onPress: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy || !acceptedLegal}
      activeOpacity={0.85}
      style={{
        overflow: 'hidden',
        borderRadius: 14,
        opacity: !acceptedLegal && !busy ? 0.55 : 1,
      }}
    >
      <LinearGradient
        colors={GRADIENT_ORANGE}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingVertical: 14, alignItems: 'center' }}
      >
        {busy ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-base font-semibold" style={{ color: '#ffffff' }}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <>
      <View
        className="mt-4 pt-4 border-t"
        style={{ borderTopColor: theme.colors.border }}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-base font-semibold" style={themeStyles.text}>
            {mode === 'coach' ? t('register.title') : t('registerAthlete.title')}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-sm" style={{ color: theme.colors.primary }}>
              {t('login.backToSignIn')}
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'athlete' && (
          <>
            <Text className="text-xs mb-2" style={themeStyles.textSecondary}>
              {t('registerAthlete.pathHint')}
            </Text>
            <View className="flex-row mb-4" style={{ gap: 10 }}>
              {athletePathPill('solo', t('registerAthlete.pathSoloShort'))}
              {athletePathPill('coached', t('registerAthlete.pathCoachShort'))}
            </View>
          </>
        )}

        {(mode === 'coach' || athletePath) && (
          <>
            {mode === 'athlete' && athletePath === 'coached' && (
              <View className="mb-3">
                <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                  {t('registerAthlete.coachCode')}
                </Text>
                <View className="flex-row" style={{ gap: 8 }}>
                  <TextInput
                    className="flex-1 rounded-xl px-4 text-base"
                    style={{ ...inputStyle, flex: 1 }}
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
                    style={{ backgroundColor: theme.colors.primary, opacity: validatingCode ? 0.7 : 1 }}
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
              className="w-full rounded-xl px-4 mb-3 text-base"
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
              className="w-full rounded-xl px-4 mb-3 text-base"
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
              className="w-full rounded-xl px-4 mb-3 text-base"
              style={inputStyle}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {mode === 'coach' ? (
              <>
                <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                  {t('register.specializationOptional')}
                </Text>
                <TextInput
                  className="w-full rounded-xl px-4 mb-3 text-base"
                  style={inputStyle}
                  placeholder={t('register.specializationPlaceholder')}
                  placeholderTextColor={theme.colors.textTertiary}
                  value={specialization}
                  onChangeText={setSpecialization}
                />
                <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                  {t('register.bioOptional')}
                </Text>
                <TextInput
                  className="w-full rounded-xl px-4 mb-3 text-base"
                  style={{ ...inputStyle, height: 80, textAlignVertical: 'top', paddingVertical: 12 }}
                  placeholder={t('register.bioPlaceholder')}
                  placeholderTextColor={theme.colors.textTertiary}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                />
              </>
            ) : (
              <>
                <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                  {t('registerAthlete.sportOptional')}
                </Text>
                <TextInput
                  className="w-full rounded-xl px-4 mb-3 text-base"
                  style={inputStyle}
                  placeholder={t('registerAthlete.sportPlaceholder')}
                  placeholderTextColor={theme.colors.textTertiary}
                  value={sport}
                  onChangeText={setSport}
                />
              </>
            )}

            {legalCheckbox}
            {submitButton(
              mode === 'coach' ? t('register.submit') : t('registerAthlete.submit'),
              mode === 'coach' ? submitCoach : submitAthlete
            )}
          </>
        )}
      </View>

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={() => {
          const fn = alertState.onConfirm;
          setAlertState((p) => ({ ...p, visible: false, onConfirm: undefined }));
          fn?.();
        }}
      />
    </>
  );
}
