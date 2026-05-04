/**
 * Tela para cadastrar um novo atleta (treinador).
 * Cria conta de login para o atleta: nome, email e senha provisória.
 * O atleta fica vinculado ao treinador e pode fazer login com esse email e senha.
 */

import { CustomAlert } from '@/components/CustomAlert';
import { FirstTimeTip } from '@/components/FirstTimeTip';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { createAthleteWithLogin } from '@/src/services/athletes.service';
import { FreePlanLimitError, assertCanCreateResource } from '@/src/services/planLimits.service';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddAthleteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [sport, setSport] = useState('');
  const [saving, setSaving] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>();
  const [alertOnCancel, setAlertOnCancel] = useState<(() => void) | null>(null);
  const [alertShowCancel, setAlertShowCancel] = useState(false);
  const [alertConfirmText, setAlertConfirmText] = useState<string | undefined>(undefined);
  const [alertCancelText, setAlertCancelText] = useState<string | undefined>(undefined);

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    onConfirm?: () => void,
    options?: {
      showCancel?: boolean;
      onCancel?: () => void;
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOnConfirm(onConfirm ? () => setTimeout(onConfirm, 0) : undefined);
    setAlertOnCancel(() => options?.onCancel ?? null);
    setAlertShowCancel(options?.showCancel ?? false);
    setAlertConfirmText(options?.confirmText);
    setAlertCancelText(options?.cancelText);
    setAlertVisible(true);
  };

  const handleSave = async () => {
    const nameTrim = name.trim();
    const emailTrim = email.trim().toLowerCase();

    if (!nameTrim) {
      showAlert(t('common.error'), t('addAthlete.errNameRequired'), 'error');
      return;
    }
    if (!emailTrim) {
      showAlert(t('common.error'), t('addAthlete.errEmailRequired'), 'error');
      return;
    }
    if (!temporaryPassword) {
      showAlert(t('common.error'), t('addAthlete.errPasswordRequired'), 'error');
      return;
    }
    if (temporaryPassword.length < 6) {
      showAlert(t('common.error'), t('addAthlete.errPasswordMin'), 'error');
      return;
    }
    if (!user?.id) {
      showAlert(t('common.error'), t('addAthlete.errNeedLogin'), 'error');
      return;
    }

    setSaving(true);
    try {
      await assertCanCreateResource(user.id, 'athletes');
      await createAthleteWithLogin({
        displayName: nameTrim,
        email: emailTrim,
        temporaryPassword,
        sport: sport.trim() || undefined,
      });
      showAlert(
        t('addAthlete.successTitle'),
        t('addAthlete.successBody', { name: nameTrim, email: emailTrim }),
        'success',
        () => router.back()
      );
    } catch (e) {
      if (e instanceof FreePlanLimitError) {
        showAlert(
          t('addAthlete.planLimitTitle'),
          e.message,
          'warning',
          () => router.push('/subscription'),
          {
            showCancel: true,
            confirmText: t('addAthlete.viewPlans'),
            cancelText: t('common.close'),
          }
        );
        return;
      }
      const msg = e instanceof Error ? e.message : t('addAthlete.errGeneric');
      showAlert(t('common.error'), msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundTertiary,
    color: theme.colors.text,
  };

  return (
    <>
      <ScrollView className="flex-1" style={themeStyles.bg}>
        <View className="px-6 pt-20 pb-20">
          <FirstTimeTip
            storageKey="tutorial_add_athlete_v1"
            title={t('addAthlete.tipTitle')}
            description={t('addAthlete.tipDescription')}
          />

          <TouchableOpacity
            className="mb-6 flex-row items-center"
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View
              className="rounded-full w-10 h-10 items-center justify-center mr-3 border"
              style={themeStyles.cardSecondary}
            >
              <FontAwesome name="arrow-left" size={18} color={theme.colors.primary} />
            </View>
            <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>
              {t('common.back')}
            </Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold mb-2" style={themeStyles.text}>
            {t('addAthlete.title')}
          </Text>
          <Text className="mb-6" style={themeStyles.textSecondary}>
            {t('addAthlete.subtitle')}
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              {t('addAthlete.nameLabel')}
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
              placeholder={t('addAthlete.namePlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={name}
              onChangeText={setName}
              editable={!saving}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              {t('addAthlete.emailLabel')}
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
              placeholder={t('addAthlete.emailPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!saving}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              {t('addAthlete.tempPasswordLabel')}
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
              placeholder={t('addAthlete.tempPasswordPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={temporaryPassword}
              onChangeText={setTemporaryPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!saving}
            />
            <Text className="text-xs mt-1" style={themeStyles.textTertiary}>
              {t('addAthlete.tempPasswordHint')}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              {t('addAthlete.sportLabel')}
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
              placeholder={t('addAthlete.sportPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={sport}
              onChangeText={setSport}
              editable={!saving}
            />
          </View>

          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleSave}
            disabled={saving}
          >
            <Text className="font-bold text-base" style={{ color: '#fff' }}>
              {saving ? t('addAthlete.saving') : t('addAthlete.submit')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        confirmText={alertConfirmText ?? t('common.ok')}
        cancelText={alertCancelText ?? t('common.cancel')}
        showCancel={alertShowCancel}
        onConfirm={() => {
          if (alertOnConfirm) alertOnConfirm();
          setAlertVisible(false);
        }}
        onCancel={() => {
          setAlertVisible(false);
          alertOnCancel?.();
        }}
      />
    </>
  );
}
