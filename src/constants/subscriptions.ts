/**
 * IDs alinhados ao App Store Connect e ao dashboard RevenueCat.
 * Ao criar o produto na Apple, use exatamente este Product ID.
 */
export const COACHEM_PRO_MONTHLY_PRODUCT_ID = 'coachem_pro_monthly';

/** Entitlement criada na RevenueCat (ex.: "pro") — o mesmo nome em todos os packages. */
export const REVENUECAT_ENTITLEMENT_PRO = 'pro';

/** Offering iOS na RevenueCat (tab Offerings); fallback quando `offerings.current` vem null no SDK. */
export const REVENUECAT_IOS_DEFAULT_OFFERING_ID = 'ios_default';
