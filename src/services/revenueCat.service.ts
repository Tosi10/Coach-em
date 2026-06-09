/**
 * RevenueCat — compras in-app (iOS/Android).
 * Expo Go não inclui o módulo nativo: configure/sync falham silenciosamente em dev.
 * Use development build (EAS profile `development`) em dispositivo físico para testar IAP.
 */

import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';

import {
  COACHEM_ATHLETE_PRO_ANNUAL_PRODUCT_ID,
  COACHEM_ATHLETE_PRO_MONTHLY_PRODUCT_ID,
  COACHEM_PRO_ANNUAL_PRODUCT_ID,
  COACHEM_PRO_MONTHLY_PRODUCT_ID,
  REVENUECAT_ATHLETE_OFFERING_ID,
  REVENUECAT_ENTITLEMENT_PRO,
  REVENUECAT_IOS_DEFAULT_OFFERING_ID,
} from '@/src/constants/subscriptions';

let configured = false;
let lastConfigurationError: string | null = null;

/** Serializa configure: chamadas paralelas (Promise.all / login + ecrã) não podem correr em simultâneo. */
let configurePromise: Promise<boolean> | null = null;

/** Evita spam no Metro quando `ensureRevenueCatConfigured` é chamado várias vezes sem chave. */
let warnedMissingIosKeyDev = false;
let warnedMissingAndroidKeyDev = false;

export type RevenueCatDiagnostics = {
  configured: boolean;
  lastError: string | null;
  canMakePayments: boolean | null;
  currentOfferingId: string | null;
  /** IDs em `offerings.all` (útil quando `current` é null no device). */
  allOfferingIds: string[];
  packagesCount: number | null;
  packageProductIds: string[];
  directProductsCount: number | null;
  directProductIds: string[];
  targetProductId: string;
};

/** Quando o SDK não preenche `offerings.current`, ainda pode haver offering nomeado. */
function resolveOfferingForMonthlyPackage(
  offerings: PurchasesOfferings,
  preferredOfferingId = REVENUECAT_IOS_DEFAULT_OFFERING_ID
): PurchasesOffering | null {
  const all = offerings.all as Record<string, PurchasesOffering> | undefined;
  if (all && typeof all === 'object' && all[preferredOfferingId]) {
    return all[preferredOfferingId];
  }
  if (offerings.current) return offerings.current;
  if (!all || typeof all !== 'object') return null;
  const fallback = all[REVENUECAT_IOS_DEFAULT_OFFERING_ID];
  if (fallback) return fallback;
  const keys = Object.keys(all);
  if (keys.length === 1) return all[keys[0]] ?? null;
  return null;
}

function resolvePackageByProductId(
  offerings: PurchasesOfferings,
  productId: string,
  preferredOfferingId?: string
): PurchasesPackage | null {
  const current = resolveOfferingForMonthlyPackage(offerings, preferredOfferingId);
  if (!current) return null;
  const byProduct = current.availablePackages.find((p) => p.product.identifier === productId);
  return byProduct ?? null;
}

function getIosApiKey(): string | undefined {
  // IMPORTANT: do not use optional chaining directly on `process.env.EXPO_PUBLIC_*`
  // — Metro may fail to inline EXPO_PUBLIC values in release bundles.
  const v = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  const t = typeof v === 'string' ? v.trim() : '';
  return t || undefined;
}

/**
 * Configura o SDK uma vez. Sem chave pública da plataforma no .env, não faz nada.
 */
export async function ensureRevenueCatConfigured(): Promise<boolean> {
  if (Platform.OS === 'web') {
    lastConfigurationError = 'unsupported_platform_web';
    return false;
  }
  if (configured) return true;
  if (configurePromise) {
    return configurePromise;
  }

  /** Atribuir de forma síncrona: evita duas entradas em `configure` antes do microtask da IIFE correr. */
  let releaseConfigureLock!: (value: boolean) => void;
  configurePromise = new Promise<boolean>((resolve) => {
    releaseConfigureLock = resolve;
  });

  const pending = (async (): Promise<boolean> => {
    try {
      if (configured) return true;
      lastConfigurationError = null;

      let apiKey: string | undefined;
      if (Platform.OS === 'ios') {
        apiKey = getIosApiKey();
        if (!apiKey && __DEV__ && !warnedMissingIosKeyDev) {
          warnedMissingIosKeyDev = true;
          console.warn(
            '[RevenueCat] iOS: defina EXPO_PUBLIC_REVENUECAT_IOS_API_KEY no .env (chave pública appl_...).'
          );
        }
      } else if (Platform.OS === 'android') {
        const v = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
        const t = typeof v === 'string' ? v.trim() : '';
        apiKey = t || undefined;
        if (!apiKey && __DEV__ && !warnedMissingAndroidKeyDev) {
          warnedMissingAndroidKeyDev = true;
          console.warn('[RevenueCat] Android: falta EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY');
        }
      } else {
        lastConfigurationError = `unsupported_platform:${Platform.OS}`;
        return false;
      }

      if (!apiKey) {
        lastConfigurationError = 'missing_api_key';
        return false;
      }

      try {
        Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.WARN);
      } catch (logLevelError) {
        console.warn('[RevenueCat] setLogLevel falhou:', logLevelError);
      }
      await Purchases.configure({ apiKey });
      configured = true;
      lastConfigurationError = null;
      return true;
    } catch (e) {
      lastConfigurationError = e instanceof Error ? e.message : 'configure_failed';
      console.warn('[RevenueCat] configure falhou (Expo Go ou módulo indisponível):', e);
      return false;
    } finally {
      // Tem de correr em *todos* os returns (missing key, etc.); senão `configurePromise` fica preso
      // numa promise já resolvida e chamadas seguintes nunca voltam a correr `configure`.
      configurePromise = null;
    }
  })();

  void pending.then(
    (value) => releaseConfigureLock(value),
    (e) => {
      console.warn('[RevenueCat] ensureRevenueCatConfigured: promise interna rejeitou:', e);
      if (!lastConfigurationError) {
        lastConfigurationError = e instanceof Error ? e.message : 'configure_promise_rejected';
      }
      releaseConfigureLock(false);
    }
  );

  return configurePromise;
}

export function getRevenueCatConfigurationError(): string | null {
  return lastConfigurationError;
}

/**
 * Associa compras ao utilizador Firebase (recomendado: mesmo UID que `users/{uid}`).
 */
export async function syncRevenueCatWithFirebaseUser(firebaseUid: string | null): Promise<void> {
  if (Platform.OS === 'web') return;

  const ok = await ensureRevenueCatConfigured();
  if (!ok) return;

  try {
    if (!firebaseUid) {
      await Purchases.logOut();
      return;
    }
    await Purchases.logIn(firebaseUid);
  } catch (e) {
    console.warn('[RevenueCat] logIn/logOut falhou:', e);
  }
}

export function isProEntitlementActive(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return Boolean(info.entitlements.active[REVENUECAT_ENTITLEMENT_PRO]);
}

/**
 * Package mensal ligado ao produto App Store `coachem_pro_monthly` (offering **Current** na RC → `offerings.current`).
 */
export async function getCoachProMonthlyPackage(): Promise<PurchasesPackage | null> {
  const ok = await ensureRevenueCatConfigured();
  if (!ok) return null;
  const offerings = await Purchases.getOfferings();
  const fromProduct = resolvePackageByProductId(offerings, COACHEM_PRO_MONTHLY_PRODUCT_ID);
  if (fromProduct) return fromProduct;
  const current = resolveOfferingForMonthlyPackage(offerings);
  return current?.monthly ?? current?.availablePackages[0] ?? null;
}

export async function getCoachProAnnualPackage(): Promise<PurchasesPackage | null> {
  const ok = await ensureRevenueCatConfigured();
  if (!ok) return null;
  const offerings = await Purchases.getOfferings();
  const fromProduct = resolvePackageByProductId(offerings, COACHEM_PRO_ANNUAL_PRODUCT_ID);
  if (fromProduct) return fromProduct;
  const current = resolveOfferingForMonthlyPackage(offerings);
  return current?.annual ?? null;
}

export async function getAthleteProMonthlyPackage(): Promise<PurchasesPackage | null> {
  const ok = await ensureRevenueCatConfigured();
  if (!ok) return null;
  const offerings = await Purchases.getOfferings();
  const fromProduct = resolvePackageByProductId(
    offerings,
    COACHEM_ATHLETE_PRO_MONTHLY_PRODUCT_ID,
    REVENUECAT_ATHLETE_OFFERING_ID
  );
  if (fromProduct) return fromProduct;
  const current = resolveOfferingForMonthlyPackage(offerings, REVENUECAT_ATHLETE_OFFERING_ID);
  return current?.monthly ?? current?.availablePackages[0] ?? null;
}

export async function getAthleteProAnnualPackage(): Promise<PurchasesPackage | null> {
  const ok = await ensureRevenueCatConfigured();
  if (!ok) return null;
  const offerings = await Purchases.getOfferings();
  const fromProduct = resolvePackageByProductId(
    offerings,
    COACHEM_ATHLETE_PRO_ANNUAL_PRODUCT_ID,
    REVENUECAT_ATHLETE_OFFERING_ID
  );
  if (fromProduct) return fromProduct;
  const current = resolveOfferingForMonthlyPackage(offerings, REVENUECAT_ATHLETE_OFFERING_ID);
  return current?.annual ?? null;
}

/**
 * Fallback quando `offerings.current` não devolve package:
 * tenta buscar o produto direto pelo Product ID configurado na App Store.
 */
export async function getCoachProMonthlyStoreProduct(): Promise<PurchasesStoreProduct | null> {
  const ok = await ensureRevenueCatConfigured();
  if (!ok) return null;
  try {
    const products = await Purchases.getProducts([COACHEM_PRO_MONTHLY_PRODUCT_ID]);
    return products[0] ?? null;
  } catch (e) {
    lastConfigurationError = e instanceof Error ? e.message : 'products_fetch_failed';
    console.warn('[RevenueCat] getProducts falhou:', e);
    return null;
  }
}

export async function getCoachProAnnualStoreProduct(): Promise<PurchasesStoreProduct | null> {
  const ok = await ensureRevenueCatConfigured();
  if (!ok) return null;
  try {
    const products = await Purchases.getProducts([COACHEM_PRO_ANNUAL_PRODUCT_ID]);
    return products[0] ?? null;
  } catch (e) {
    lastConfigurationError = e instanceof Error ? e.message : 'products_fetch_failed';
    console.warn('[RevenueCat] getProducts (annual) falhou:', e);
    return null;
  }
}

export async function collectRevenueCatDiagnostics(): Promise<RevenueCatDiagnostics> {
  const diagnostics: RevenueCatDiagnostics = {
    configured,
    lastError: lastConfigurationError,
    canMakePayments: null,
    currentOfferingId: null,
    allOfferingIds: [],
    packagesCount: null,
    packageProductIds: [],
    directProductsCount: null,
    directProductIds: [],
    targetProductId: COACHEM_PRO_MONTHLY_PRODUCT_ID,
  };

  const ok = await ensureRevenueCatConfigured();
  diagnostics.configured = ok;
  diagnostics.lastError = lastConfigurationError;
  if (!ok) {
    return diagnostics;
  }

  try {
    diagnostics.canMakePayments = await Purchases.canMakePayments();
  } catch (e) {
    diagnostics.lastError = e instanceof Error ? e.message : diagnostics.lastError;
  }

  try {
    const offerings = await Purchases.getOfferings();
    const all = offerings.all as Record<string, PurchasesOffering> | undefined;
    diagnostics.allOfferingIds = all && typeof all === 'object' ? Object.keys(all) : [];
    const current = resolveOfferingForMonthlyPackage(offerings);
    diagnostics.currentOfferingId = current?.identifier ?? offerings.current?.identifier ?? null;
    diagnostics.packagesCount = current?.availablePackages.length ?? 0;
    diagnostics.packageProductIds =
      current?.availablePackages.map((pkg) => pkg.product.identifier).filter(Boolean) ?? [];
  } catch (e) {
    diagnostics.lastError = e instanceof Error ? e.message : diagnostics.lastError;
  }

  try {
    const products = await Purchases.getProducts([COACHEM_PRO_MONTHLY_PRODUCT_ID]);
    diagnostics.directProductsCount = products.length;
    diagnostics.directProductIds = products.map((p) => p.identifier).filter(Boolean);
  } catch (e) {
    diagnostics.lastError = e instanceof Error ? e.message : diagnostics.lastError;
  }

  return diagnostics;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/**
 * Compra mensal com fallback:
 * 1) package (offering) quando disponível
 * 2) store product direto por productId quando offering vier vazio
 */
export async function purchaseCoachProMonthly(pkg: PurchasesPackage | null): Promise<CustomerInfo> {
  if (pkg) {
    return purchasePackage(pkg);
  }

  const product = await getCoachProMonthlyStoreProduct();
  if (!product) {
    throw new Error('offering_and_product_not_found');
  }
  const { customerInfo } = await Purchases.purchaseStoreProduct(product);
  return customerInfo;
}

export async function purchaseCoachProAnnual(pkg: PurchasesPackage | null): Promise<CustomerInfo> {
  if (pkg) {
    return purchasePackage(pkg);
  }

  const product = await getCoachProAnnualStoreProduct();
  if (!product) {
    throw new Error('offering_and_product_not_found');
  }
  const { customerInfo } = await Purchases.purchaseStoreProduct(product);
  return customerInfo;
}

async function purchaseProByProductId(
  pkg: PurchasesPackage | null,
  productId: string
): Promise<CustomerInfo> {
  if (pkg) return purchasePackage(pkg);
  const ok = await ensureRevenueCatConfigured();
  if (!ok) throw new Error('offering_and_product_not_found');
  const products = await Purchases.getProducts([productId]);
  const product = products[0];
  if (!product) throw new Error('offering_and_product_not_found');
  const { customerInfo } = await Purchases.purchaseStoreProduct(product);
  return customerInfo;
}

export async function purchaseAthleteProMonthly(pkg: PurchasesPackage | null): Promise<CustomerInfo> {
  return purchaseProByProductId(pkg, COACHEM_ATHLETE_PRO_MONTHLY_PRODUCT_ID);
}

export async function purchaseAthleteProAnnual(pkg: PurchasesPackage | null): Promise<CustomerInfo> {
  return purchaseProByProductId(pkg, COACHEM_ATHLETE_PRO_ANNUAL_PRODUCT_ID);
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  const ok = await ensureRevenueCatConfigured();
  if (!ok) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function isUserCancelledPurchaseError(e: unknown): boolean {
  if (e && typeof e === 'object' && 'userCancelled' in e && (e as { userCancelled?: boolean }).userCancelled) {
    return true;
  }
  return false;
}
