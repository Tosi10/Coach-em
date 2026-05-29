/**
 * Consentimento de saúde (atleta) — scaffold Fase 1 / Dia 8.
 * Explica o que será partilhado; ligação nativa (HealthKit / Health Connect) no Dia 9.
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getHealthIntegration } from '@/src/services/healthFirestore.service';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AthleteHealthConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { user, loading } = useAuthContext();

  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [healthEnabled, setHealthEnabled] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const loadIntegrationStatus = useCallback(async () => {
    if (!user?.id) {
      setHealthEnabled(false);
      setIntegrationLoading(false);
      return;
    }
    setIntegrationLoading(true);
    try {
      const doc = await getHealthIntegration(user.id);
      setHealthEnabled(Boolean(doc?.enabled));
    } catch {
      setHealthEnabled(false);
    } finally {
      setIntegrationLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    if (user.userType !== UserType.ATHLETE) {
      router.replace('/(tabs)/profile');
      return;
    }
    void loadIntegrationStatus();
  }, [user, loading, router, loadIntegrationStatus]);

  const platformHint =
    Platform.OS === 'ios'
      ? t('healthConsent.platformIos')
      : Platform.OS === 'android'
        ? t('healthConsent.platformAndroid')
        : t('healthConsent.platformOther');

  const bullets = [
    t('healthConsent.bulletHeartRate'),
    t('healthConsent.bulletCalories'),
    t('healthConsent.bulletDistance'),
    t('healthConsent.bulletSteps'),
    t('healthConsent.bulletWorkouts'),
  ];

  const handleConnectPress = () => {
    showAlert(t('healthConsent.scaffoldTitle'), t('healthConsent.scaffoldConnectBody'), 'info');
  };

  const handleDisconnectPress = () => {
    showAlert(t('healthConsent.scaffoldTitle'), t('healthConsent.scaffoldDisconnectBody'), 'info');
  };

  return (
    <View className="flex-1" style={themeStyles.bg}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 24),
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-4 self-start"
          activeOpacity={0.7}
        >
          <FontAwesome name="chevron-left" size={14} color={theme.colors.primary} />
          <Text className="ml-2 font-semibold" style={{ color: theme.colors.primary }}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold mb-2" style={themeStyles.text}>
          {t('healthConsent.title')}
        </Text>
        <Text className="text-base mb-4 leading-6" style={themeStyles.textSecondary}>
          {t('healthConsent.subtitle')}
        </Text>

        <View
          className="rounded-xl px-4 py-3 mb-5 border flex-row items-center"
          style={[themeStyles.card, { borderWidth: 1 }]}
        >
          {integrationLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <>
              <FontAwesome
                name={healthEnabled ? 'check-circle' : 'circle-o'}
                size={22}
                color={healthEnabled ? '#10b981' : theme.colors.textTertiary}
                style={{ marginRight: 10 }}
              />
              <View className="flex-1">
                <Text className="font-semibold" style={themeStyles.text}>
                  {healthEnabled
                    ? t('healthConsent.statusConnected')
                    : t('healthConsent.statusDisconnected')}
                </Text>
                <Text className="text-xs mt-0.5" style={themeStyles.textSecondary}>
                  {platformHint}
                </Text>
              </View>
            </>
          )}
        </View>

        <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
          {t('healthConsent.dataTitle')}
        </Text>
        <View className="rounded-xl p-4 mb-4 border" style={[themeStyles.card, { borderWidth: 1 }]}>
          {bullets.map((line, index) => (
            <View
              key={line}
              className="flex-row items-start"
              style={{ marginBottom: index < bullets.length - 1 ? 8 : 0 }}
            >
              <Text style={{ color: theme.colors.primary, marginRight: 8 }}>•</Text>
              <Text className="flex-1 text-sm leading-5" style={themeStyles.textSecondary}>
                {line}
              </Text>
            </View>
          ))}
        </View>

        <Text className="text-sm leading-5 mb-6" style={themeStyles.textSecondary}>
          {t('healthConsent.optionalNote')}
        </Text>
        <Text className="text-xs leading-5 mb-6" style={themeStyles.textTertiary}>
          {t('healthConsent.revokeNote')}
        </Text>

        <TouchableOpacity
          onPress={handleConnectPress}
          activeOpacity={0.85}
          className="rounded-xl py-4 items-center mb-3"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="text-base font-semibold" style={{ color: '#ffffff' }}>
            {t('healthConsent.connectButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDisconnectPress}
          activeOpacity={0.85}
          className="rounded-xl py-3.5 items-center border"
          style={{
            borderColor: theme.colors.border,
            opacity: healthEnabled ? 1 : 0.55,
          }}
          disabled={!healthEnabled}
        >
          <Text className="font-semibold" style={{ color: theme.colors.textSecondary }}>
            {t('healthConsent.disconnectButton')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        confirmText={t('common.ok')}
        onConfirm={() => setAlertVisible(false)}
      />
    </View>
  );
}
