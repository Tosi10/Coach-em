/**
 * Coach — Planos Coach'em (Grátis vs Pro): comparação, compra mensal RevenueCat, restaurar.
 * Entrada: Perfil → "Plano e assinatura", ou alertas de limite → "Ver planos".
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { FREE_PLAN_LIMITS, PRO_PLAN_LIMITS } from '@/src/constants/freePlan';
import { getPrivacyUrlByLanguage, getTermsUrlByLanguage } from '@/src/constants/legalUrls';
import {
  collectRevenueCatDiagnostics,
  ensureRevenueCatConfigured,
  fetchCustomerInfo,
  getCoachProAnnualPackage,
  getRevenueCatConfigurationError,
  getCoachProMonthlyPackage,
  isProEntitlementActive,
  isUserCancelledPurchaseError,
  purchaseCoachProAnnual,
  purchaseCoachProMonthly,
  restorePurchases,
} from '@/src/services/revenueCat.service';
import {
  getCoachFreePlanUsage,
  getCoachSubscriptionTier,
} from '@/src/services/planLimits.service';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
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
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CoachAlertType = 'success' | 'error' | 'info' | 'warning';
type ProPlanOption = 'monthly' | 'annual';

function formatRevenueCatDiagLine(
  diag: Awaited<ReturnType<typeof collectRevenueCatDiagnostics>>
): string {
  const ids = diag.allOfferingIds ?? [];
  return `canPay=${String(diag.canMakePayments)} | current=${diag.currentOfferingId ?? 'null'} | packages=${diag.packagesCount ?? 'null'} | all=[${ids.join(',')}] | directProducts=${diag.directProductsCount ?? 'null'} | target=${diag.targetProductId}${diag.lastError ? ` | lastErr=${diag.lastError}` : ''}`;
}

export default function SubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { user } = useAuthContext();

  const [tier, setTier] = useState<Awaited<ReturnType<typeof getCoachSubscriptionTier>> | null>(null);
  const [usage, setUsage] = useState<{ athletes: number; workoutTemplates: number; exercises: number } | null>(
    null
  );
  const [storePro, setStorePro] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [rcConfigError, setRcConfigError] = useState<string | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ProPlanOption>('annual');
  const [rcDiagLine, setRcDiagLine] = useState<string | null>(null);
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);

  const [coachAlertVisible, setCoachAlertVisible] = useState(false);
  const [coachAlertTitle, setCoachAlertTitle] = useState('');
  const [coachAlertMessage, setCoachAlertMessage] = useState('');
  const [coachAlertType, setCoachAlertType] = useState<CoachAlertType>('info');

  const coachId = user?.id ?? '';
  const isCoach = user?.userType === UserType.COACH;
  const expoGo = Constants.appOwnership === 'expo';

  const dismissCoachAlert = () => setCoachAlertVisible(false);

  const showCoachAlert = (title: string, message: string, type: CoachAlertType = 'info') => {
    setCoachAlertTitle(title);
    setCoachAlertMessage(message);
    setCoachAlertType(type);
    setCoachAlertVisible(true);
  };

  const reload = useCallback(async () => {
    if (!coachId || !isCoach) {
      setLoadingScreen(false);
      return;
    }
    setLoadingScreen(true);
    try {
      const [t, u, rcOk] = await Promise.all([
        getCoachSubscriptionTier(coachId),
        getCoachFreePlanUsage(coachId),
        ensureRevenueCatConfigured(),
      ]);
      const [info, monthlyPkg, annualPkg] = await Promise.all([
        rcOk ? fetchCustomerInfo() : Promise.resolve(null),
        rcOk ? getCoachProMonthlyPackage() : Promise.resolve(null),
        rcOk ? getCoachProAnnualPackage() : Promise.resolve(null),
      ]);
      setTier(t);
      setUsage(u);
      setConfigured(rcOk);
      setRcConfigError(getRevenueCatConfigurationError());
      setStorePro(isProEntitlementActive(info));
      setMonthlyPackage(monthlyPkg);
      setAnnualPackage(annualPkg);
      if (annualPkg) {
        setSelectedPlan('annual');
      } else if (monthlyPkg) {
        setSelectedPlan('monthly');
      }
      // Limpa linha RC só quando não precisamos dela; caso rcOk && !pkg é preenchido pelo useEffect abaixo
      // (evita rcDiagLine=null quando reload falha a meio ou race com async).
      if (!rcOk || monthlyPkg || annualPkg) {
        setRcDiagLine(null);
      }
    } catch (e) {
      console.warn('[subscription] reload', e);
      const msg = e instanceof Error ? e.message : String(e);
      setRcDiagLine((prev) => prev ?? `reload_failed: ${msg}`);
    } finally {
      setLoadingScreen(false);
    }
  }, [coachId, isCoach]);

  /** Diagnóstico RC desacoplado do reload: garante texto técnico sempre que RC ok mas sem package. */
  useEffect(() => {
    if (
      loadingScreen ||
      !coachId ||
      !isCoach ||
      !configured ||
      monthlyPackage !== null ||
      annualPackage !== null
    ) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const diag = await collectRevenueCatDiagnostics();
        if (cancelled) return;
        setRcDiagLine(formatRevenueCatDiagLine(diag));
      } catch (err) {
        if (!cancelled) {
          setRcDiagLine(
            `diag_collect_failed: ${err instanceof Error ? err.message : String(err)} | rcErr=${getRevenueCatConfigurationError() ?? 'none'}`
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadingScreen, configured, monthlyPackage, annualPackage, coachId, isCoach]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const limits = tier === 'pro' ? PRO_PLAN_LIMITS : FREE_PLAN_LIMITS;

  const openSubscriptionManagement = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url).catch(() => {
      showCoachAlert(
        t('subscription.alertSubscription'),
        t('subscription.alertStoreOpenFail'),
        'warning'
      );
    });
  };

  const openLegal = async (url: string) => {
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      showCoachAlert(t('common.warning'), t('subscription.alertLinkFail'), 'warning');
      return;
    }
    await Linking.openURL(url);
  };

  const onPurchase = async () => {
    if (purchaseBusy) return;
    if (expoGo) {
      showCoachAlert(
        t('subscription.expoGoTitle'),
        t('subscription.expoGoPurchase'),
        'info'
      );
      return;
    }
    // Não confiar só no estado do último reload: `configured`/hint podem estar desatualizados ou o utilizador
    // pode interagir antes de `setRcConfigError` refletir o último `ensure`.
    const rcOk = await ensureRevenueCatConfigured();
    const hint = getRevenueCatConfigurationError();
    if (!rcOk) {
      const body =
        hint === 'missing_api_key'
          ? Platform.OS === 'android'
            ? t('subscription.configAndroid')
            : t('subscription.configIos')
          : hint
            ? `${t('subscription.configRcDetail')}\n\n${hint}`
            : t('subscription.configRcUnknown');
      showCoachAlert(t('subscription.configTitle'), body, 'warning');
      setConfigured(false);
      setRcConfigError(hint);
      setRcDiagLine(null);
      return;
    }
    setConfigured(true);
    setRcConfigError(null);

    const targetPlan = selectedPlan === 'annual' ? 'annual' : 'monthly';
    let pkg = targetPlan === 'annual' ? annualPackage : monthlyPackage;
    if (!pkg) {
      pkg =
        targetPlan === 'annual'
          ? await getCoachProAnnualPackage()
          : await getCoachProMonthlyPackage();
    }
    setPurchaseBusy(true);
    try {
      const info =
        targetPlan === 'annual'
          ? await purchaseCoachProAnnual(pkg)
          : await purchaseCoachProMonthly(pkg);
      setStorePro(isProEntitlementActive(info));
      showCoachAlert(
        t('subscription.purchaseDoneTitle'),
        t('subscription.purchaseDoneMsg'),
        'success'
      );
    } catch (e) {
      if (isUserCancelledPurchaseError(e)) return;
      const msg = e instanceof Error ? e.message : t('subscription.purchaseError');
      showCoachAlert(t('subscription.purchaseTitle'), msg, 'error');
      const diag = await collectRevenueCatDiagnostics();
      setRcDiagLine(formatRevenueCatDiagLine(diag));
    } finally {
      setPurchaseBusy(false);
    }
  };

  const onRestore = async () => {
    if (restoreBusy) return;
    if (expoGo) {
      showCoachAlert(
        t('subscription.expoGoTitle'),
        t('subscription.expoGoRestore'),
        'info'
      );
      return;
    }
    const rcOk = await ensureRevenueCatConfigured();
    if (!rcOk) {
      const hint = getRevenueCatConfigurationError();
      const body =
        hint === 'missing_api_key'
          ? Platform.OS === 'android'
            ? t('subscription.configAndroid')
            : t('subscription.configIos')
          : hint
            ? `${t('subscription.configRcDetail')}\n\n${hint}`
            : t('subscription.configRcUnknown');
      showCoachAlert(t('subscription.configTitle'), body, 'warning');
      setConfigured(false);
      setRcConfigError(hint);
      return;
    }
    setConfigured(true);
    setRcConfigError(null);
    setRestoreBusy(true);
    try {
      const info = await restorePurchases();
      setStorePro(isProEntitlementActive(info));
      if (isProEntitlementActive(info)) {
        showCoachAlert(t('subscription.restoreSuccessTitle'), t('subscription.restoreSuccessMsg'), 'success');
      } else {
        showCoachAlert(
          t('subscription.restoreSuccessTitle'),
          t('subscription.restoreNoSub'),
          'info'
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('subscription.restoreFail');
      showCoachAlert(t('subscription.restoreSuccessTitle'), msg, 'error');
    } finally {
      setRestoreBusy(false);
    }
  };

  const coachAlertFooter = (
    <CustomAlert
      visible={coachAlertVisible}
      title={coachAlertTitle}
      message={coachAlertMessage}
      type={coachAlertType}
      confirmText={t('common.ok')}
      onConfirm={dismissCoachAlert}
    />
  );

  if (!isCoach) {
    return (
      <>
        <View style={[{ flex: 1, paddingTop: insets.top + 24 }, themeStyles.bg]} className="px-6">
          <TouchableOpacity className="mb-8 flex-row items-center" onPress={() => router.back()} activeOpacity={0.7}>
            <FontAwesome name="arrow-left" size={20} color={theme.colors.primary} />
            <Text className="ml-2 font-semibold text-lg" style={{ color: theme.colors.primary }}>
              {t('subscription.back')}
            </Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={themeStyles.text}>
            {t('subscription.athleteOnlyTitle')}
          </Text>
          <Text className="mt-3" style={themeStyles.textSecondary}>
            {t('subscription.athleteOnlyBody')}
          </Text>
        </View>
        {coachAlertFooter}
      </>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1"
        style={themeStyles.bg}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, flexGrow: 1 }}
      >
        <View className="px-6" style={{ paddingTop: insets.top + 12 }}>
          <TouchableOpacity className="mb-5 flex-row items-center" onPress={() => router.back()} activeOpacity={0.7}>
            <View className="rounded-full w-10 h-10 items-center justify-center mr-3 border" style={themeStyles.cardSecondary}>
              <FontAwesome name="arrow-left" size={18} color={theme.colors.primary} />
            </View>
            <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>
              {t('subscription.back')}
            </Text>
          </TouchableOpacity>

          <Text className="text-3xl font-bold mb-1" style={themeStyles.text}>
            {t('subscription.title')}
          </Text>
          <Text className="mb-6 text-sm" style={themeStyles.textSecondary}>
            {t('subscription.subtitle')}
          </Text>

          {loadingScreen ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <>
              <View className="rounded-2xl p-5 mb-4 border" style={[themeStyles.card, { borderWidth: 1 }]}>
                <Text className="text-sm font-semibold mb-2" style={themeStyles.textSecondary}>
                  {t('subscription.firebaseState')}
                </Text>
                <Text className="text-lg font-bold" style={themeStyles.text}>
                  {tier === 'pro' ? t('subscription.pro') : t('subscription.free')}
                </Text>
                {usage && (
                  <Text className="text-sm mt-3" style={themeStyles.textSecondary}>
                    {t('subscription.usageLine', {
                      athletes: usage.athletes,
                      maxAthletes: limits.athletes,
                      templates: usage.workoutTemplates,
                      maxTemplates: limits.workoutTemplates,
                      exercises: usage.exercises,
                      maxExercises: limits.exercises,
                    })}
                  </Text>
                )}
              </View>

              <View className="rounded-2xl p-5 mb-4 border" style={[themeStyles.card, { borderWidth: 1 }]}>
                <Text className="text-sm font-semibold mb-2" style={themeStyles.textSecondary}>
                  {t('subscription.storeSection')}
                </Text>
                <Text className="text-base font-semibold" style={themeStyles.text}>
                  {storePro ? t('subscription.storeProYes') : t('subscription.storeProNo')}
                </Text>
                {!configured && (
                  <>
                    <Text className="text-xs mt-2" style={themeStyles.textTertiary}>
                      {t('subscription.rcNotConfigured')}
                    </Text>
                    {rcConfigError ? (
                      <Text className="text-xs mt-1" style={themeStyles.textTertiary}>
                        RC: {rcConfigError}
                      </Text>
                    ) : null}
                  </>
                )}
              </View>

              {tier === 'pro' && (
                <TouchableOpacity
                  className="mb-4 py-3 px-4 rounded-xl border items-center"
                  style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.card }}
                  onPress={openSubscriptionManagement}
                  activeOpacity={0.8}
                >
                  <Text className="font-semibold" style={themeStyles.text}>
                    {t('subscription.manageInStore')}
                  </Text>
                </TouchableOpacity>
              )}

              <Text className="text-sm font-medium mb-2" style={themeStyles.textSecondary}>
                {t('subscription.compare')}
              </Text>
              <View className="rounded-2xl border overflow-hidden mb-6" style={{ borderColor: theme.colors.border }}>
                <View className="flex-row px-3 py-2 border-b" style={{ borderBottomColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }}>
                  <Text className="flex-[1] text-xs font-bold" style={themeStyles.text}>
                    {t('subscription.feature')}
                  </Text>
                  <Text className="flex-[0.85] text-xs font-bold text-center" style={themeStyles.text}>
                    {t('subscription.free')}
                  </Text>
                  <Text className="flex-[0.85] text-xs font-bold text-center" style={{ color: theme.colors.primary }}>
                    Pro
                  </Text>
                </View>
                {(
                  [
                    [t('subscription.athletes'), FREE_PLAN_LIMITS.athletes, PRO_PLAN_LIMITS.athletes],
                    [t('subscription.workoutTemplates'), FREE_PLAN_LIMITS.workoutTemplates, PRO_PLAN_LIMITS.workoutTemplates],
                    [t('subscription.exercises'), FREE_PLAN_LIMITS.exercises, PRO_PLAN_LIMITS.exercises],
                  ] as const
                ).map(([label, freeN, proN]) => (
                  <View
                    key={String(label)}
                    className="flex-row px-3 py-3 border-b"
                    style={{ borderBottomColor: theme.colors.border, backgroundColor: theme.colors.card }}
                  >
                    <Text className="flex-[1] text-sm" style={themeStyles.text}>
                      {label}
                    </Text>
                    <Text className="flex-[0.85] text-sm text-center" style={themeStyles.textSecondary}>
                      {freeN}
                    </Text>
                    <Text className="flex-[0.85] text-sm text-center font-semibold" style={{ color: theme.colors.primary }}>
                      {proN}
                    </Text>
                  </View>
                ))}
              </View>

              {expoGo && (
                <View className="mb-4 rounded-xl p-4" style={{ backgroundColor: theme.colors.primary + '18' }}>
                  <Text className="text-sm" style={themeStyles.text}>
                    {t('subscription.expoGoBanner')}
                  </Text>
                </View>
              )}

              {tier !== 'pro' && (
                <>
                  <View className="rounded-2xl border overflow-hidden mb-3" style={{ borderColor: theme.colors.border }}>
                    <TouchableOpacity
                      className="px-4 py-3 border-b"
                      style={{
                        borderBottomColor: theme.colors.border,
                        backgroundColor:
                          selectedPlan === 'monthly' ? theme.colors.primary + '1f' : theme.colors.card,
                      }}
                      onPress={() => setSelectedPlan('monthly')}
                      activeOpacity={0.85}
                    >
                      <View className="flex-row justify-between items-center">
                        <Text className="font-semibold" style={themeStyles.text}>
                          {t('subscription.planMonthlyTitle')}
                        </Text>
                        <Text className="font-bold" style={{ color: theme.colors.primary }}>
                          {monthlyPackage?.product.priceString ?? t('subscription.planPricePending')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="px-4 py-3"
                      style={{
                        backgroundColor:
                          selectedPlan === 'annual' ? theme.colors.primary + '1f' : theme.colors.card,
                      }}
                      onPress={() => setSelectedPlan('annual')}
                      activeOpacity={0.85}
                    >
                      <View className="flex-row justify-between items-center">
                        <View>
                          <Text className="font-semibold" style={themeStyles.text}>
                            {t('subscription.planAnnualTitle')}
                          </Text>
                          <Text className="text-xs mt-0.5" style={themeStyles.textSecondary}>
                            {t('subscription.planAnnualPromo')}
                          </Text>
                        </View>
                        <Text className="font-bold" style={{ color: theme.colors.primary }}>
                          {annualPackage?.product.priceString ?? t('subscription.planPricePending')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    className="rounded-xl py-4 px-4 mb-3 items-center"
                    style={{
                      backgroundColor: theme.colors.primary,
                      opacity:
                        purchaseBusy
                          ? 0.65
                          : selectedPlan === 'annual'
                            ? annualPackage
                              ? 1
                              : 0.88
                            : monthlyPackage
                              ? 1
                              : 0.88,
                    }}
                    disabled={purchaseBusy}
                    onPress={onPurchase}
                    activeOpacity={0.85}
                  >
                    {purchaseBusy ? (
                      <ActivityIndicator color="#0a0a0a" />
                    ) : (
                      <Text className="font-bold text-base text-black">
                        {selectedPlan === 'annual'
                          ? annualPackage?.product.priceString
                            ? t('subscription.subscribeAnnualWithPrice', {
                                price: annualPackage.product.priceString,
                              })
                            : t('subscription.subscribeAnnual')
                          : monthlyPackage?.product.priceString
                            ? t('subscription.subscribeWithPrice', {
                                price: monthlyPackage.product.priceString,
                              })
                            : t('subscription.subscribeMonthly')}
                      </Text>
                    )}
                  </TouchableOpacity>
                  {!monthlyPackage && !annualPackage && configured && (
                    <>
                      <Text className="text-xs mb-2 text-center" style={themeStyles.textTertiary}>
                        {t('subscription.offeringMissing')}
                      </Text>
                      <Text className="text-[11px] mb-3 text-center leading-4" style={themeStyles.textTertiary}>
                        RC DIAG:{' '}
                        {rcDiagLine ?? t('subscription.rcDiagPending')}
                      </Text>
                    </>
                  )}
                </>
              )}

              <TouchableOpacity
                className="rounded-xl py-3 px-4 mb-6 items-center border"
                style={{ borderColor: theme.colors.border }}
                disabled={restoreBusy}
                onPress={onRestore}
                activeOpacity={0.85}
              >
                {restoreBusy ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <Text className="font-semibold" style={themeStyles.text}>
                    {t('subscription.restore')}
                  </Text>
                )}
              </TouchableOpacity>

              <Text className="text-xs mb-3 leading-5" style={themeStyles.textTertiary}>
                {t('subscription.footerLegal', {
                  store: Platform.OS === 'ios' ? 'Apple' : 'Google',
                })}
              </Text>
              <View className="flex-row flex-wrap gap-x-4 gap-y-2 mb-4">
                <TouchableOpacity onPress={() => void openLegal(getTermsUrlByLanguage(i18n.language))}>
                  <Text className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                    {t('subscription.termsLink')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void openLegal(getPrivacyUrlByLanguage(i18n.language))}>
                  <Text className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                    {t('subscription.privacyLink')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      {coachAlertFooter}
    </>
  );
}
