/**
 * Consentimento de saúde (atleta) — Dias 8–10.
 * Pedido de permissões nativas (Dia 9) e desligar (Dia 10).
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
  canUseNativeHealth,
  getHealthConnectAvailability,
  getHealthService,
  openHealthConnectSettingsScreen,
  openHealthConnectStore,
} from '@/src/services/health.service';
import {
  getHealthIntegration,
  markHealthIntegrationGranted,
  markHealthIntegrationRevoked,
} from '@/src/services/healthFirestore.service';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { getHealthConsentUrlByLanguage } from '@/src/constants/legalUrls';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AthleteHealthConsentScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { user, loading } = useAuthContext();

  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [healthEnabled, setHealthEnabled] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [alertShowCancel, setAlertShowCancel] = useState(false);
  const [alertConfirmText, setAlertConfirmText] = useState<string | undefined>();
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>();

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    options?: {
      confirmText?: string;
      showCancel?: boolean;
      onConfirm?: () => void;
    },
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertShowCancel(Boolean(options?.showCancel));
    setAlertConfirmText(options?.confirmText);
    setAlertOnConfirm(() => options?.onConfirm);
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

  const normalizeHealthErrorReason = (reason?: string): string => {
    if (!reason) return 'unknown';
    const lower = reason.toLowerCase();
    if (lower.includes('expo') && lower.includes('go')) return 'expo_go';
    if (
      lower.includes('denied') ||
      lower.includes('deny') ||
      lower.includes('permission') ||
      lower.includes('authorize') ||
      lower.includes('not authorized')
    ) {
      return 'permission_denied';
    }
    if (lower.includes('healthkit') || lower.includes('health kit') || lower.includes('unavailable')) {
      return 'healthkit_unavailable';
    }
    return reason;
  };

  const resolvePermissionError = (reason?: string) => {
    const key = normalizeHealthErrorReason(reason);
    switch (key) {
      case 'expo_go':
        showAlert(
          t('healthConsent.errorExpoGoTitle'),
          t('healthConsent.errorExpoGoBody'),
          'warning',
        );
        return;
      case 'health_connect_not_installed':
        showAlert(
          t('healthConsent.errorHcNotInstalledTitle'),
          t('healthConsent.errorHcNotInstalledBody'),
          'info',
          {
            showCancel: true,
            confirmText: t('healthConsent.openPlayStore'),
            onConfirm: () => {
              void openHealthConnectStore();
            },
          },
        );
        return;
      case 'health_connect_update_required':
        showAlert(
          t('healthConsent.errorHcUpdateTitle'),
          t('healthConsent.errorHcUpdateBody'),
          'info',
          {
            showCancel: true,
            confirmText: t('healthConsent.openPlayStore'),
            onConfirm: () => {
              void openHealthConnectStore();
            },
          },
        );
        return;
      case 'permission_denied':
        showAlert(
          t('healthConsent.errorPermissionDeniedTitle'),
          t('healthConsent.errorPermissionDeniedBody'),
          'warning',
          canUseNativeHealth()
            ? {
                showCancel: true,
                confirmText: t('healthConsent.openHealthSettings'),
                onConfirm: () => {
                  void openHealthConnectSettingsScreen();
                },
              }
            : undefined,
        );
        return;
      case 'healthkit_unavailable':
        showAlert(
          t('healthConsent.errorHealthKitTitle'),
          t('healthConsent.errorHealthKitBody'),
          'error',
          Platform.OS === 'ios'
            ? {
                showCancel: true,
                confirmText: t('healthConsent.openHealthSettings'),
                onConfirm: () => {
                  void openHealthConnectSettingsScreen();
                },
              }
            : undefined,
        );
        return;
      default:
        showAlert(
          t('healthConsent.errorUnavailableTitle'),
          t('healthConsent.errorUnavailableBody'),
          'error',
        );
    }
  };

  const handleConnectPress = async () => {
    if (!user?.id || actionLoading) return;

    const health = getHealthService();
    setActionLoading(true);
    try {
      if (!canUseNativeHealth()) {
        resolvePermissionError('expo_go');
        return;
      }

      // Android: exige Health Connect instalado antes do pedido de permissões.
      if (Platform.OS === 'android') {
        const available = await health.isAvailable();
        if (!available) {
          const hcStatus = await getHealthConnectAvailability();
          if (hcStatus === 'not_installed') {
            resolvePermissionError('health_connect_not_installed');
            return;
          }
          if (hcStatus === 'update_required') {
            resolvePermissionError('health_connect_update_required');
            return;
          }
          resolvePermissionError('health_connect_not_installed');
          return;
        }
      }

      const result = await health.requestPermissions();
      if (!result.granted) {
        resolvePermissionError(result.reason);
        return;
      }

      await markHealthIntegrationGranted(user.id, health.platform);
      setHealthEnabled(true);
      showAlert(
        t('healthConsent.successConnectedTitle'),
        t('healthConsent.successConnectedBody'),
        'success',
      );
    } catch (err) {
      if (__DEV__) {
        console.warn('[HealthConsent] connect failed:', err);
      }
      resolvePermissionError(
        err instanceof Error ? err.message : 'healthkit_unavailable',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnectPress = async () => {
    if (!user?.id || actionLoading || !healthEnabled) return;

    const health = getHealthService();
    setActionLoading(true);
    try {
      await health.revokePermissions();
      await markHealthIntegrationRevoked(user.id);
      setHealthEnabled(false);

      const body =
        Platform.OS === 'ios'
          ? `${t('healthConsent.successDisconnectedBody')}\n\n${t('healthConsent.iosRevokeHint')}`
          : t('healthConsent.successDisconnectedBody');

      showAlert(t('healthConsent.successDisconnectedTitle'), body, 'success');
    } catch {
      showAlert(
        t('healthConsent.errorUnavailableTitle'),
        t('healthConsent.errorUnavailableBody'),
        'error',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const connectLabel = actionLoading
    ? t('healthConsent.connecting')
    : t('healthConsent.connectButton');
  const disconnectLabel = actionLoading
    ? t('healthConsent.disconnecting')
    : t('healthConsent.disconnectButton');

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
        <Text className="text-xs leading-5 mb-3" style={themeStyles.textTertiary}>
          {t('healthConsent.revokeNote')}
        </Text>

        <TouchableOpacity
          onPress={() => void Linking.openURL(getHealthConsentUrlByLanguage(i18n.language))}
          activeOpacity={0.7}
          className="mb-6"
        >
          <Text className="text-sm underline" style={{ color: theme.colors.primary }}>
            {t('healthConsent.fullConsentLink')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => void handleConnectPress()}
          activeOpacity={0.85}
          disabled={actionLoading}
          className="rounded-xl py-4 items-center mb-3 flex-row justify-center"
          style={{ backgroundColor: theme.colors.primary, opacity: actionLoading ? 0.7 : 1 }}
        >
          {actionLoading ? (
            <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
          ) : null}
          <Text className="text-base font-semibold" style={{ color: '#ffffff' }}>
            {connectLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => void handleDisconnectPress()}
          activeOpacity={0.85}
          disabled={!healthEnabled || actionLoading}
          className="rounded-xl py-3.5 items-center border flex-row justify-center"
          style={{
            borderColor: theme.colors.border,
            opacity: !healthEnabled || actionLoading ? 0.55 : 1,
          }}
        >
          {actionLoading && healthEnabled ? (
            <ActivityIndicator color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
          ) : null}
          <Text className="font-semibold" style={{ color: theme.colors.textSecondary }}>
            {disconnectLabel}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        confirmText={alertConfirmText}
        showCancel={alertShowCancel}
        onConfirm={() => {
          setAlertVisible(false);
          alertOnConfirm?.();
        }}
        onCancel={() => setAlertVisible(false)}
      />
    </View>
  );
}
