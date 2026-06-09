/**
 * IDs alinhados ao App Store Connect e ao dashboard RevenueCat.
 * Ao criar o produto na Apple, use exatamente este Product ID.
 */
export const COACHEM_PRO_MONTHLY_PRODUCT_ID = 'coachem_pro_monthly';
export const COACHEM_PRO_ANNUAL_PRODUCT_ID = 'coachem_pro_annual';

/** Athlete Pro — criar na App Store / Play Console + RevenueCat (offering separado recomendado). */
export const COACHEM_ATHLETE_PRO_MONTHLY_PRODUCT_ID = 'coachem_athlete_pro_monthly';
export const COACHEM_ATHLETE_PRO_ANNUAL_PRODUCT_ID = 'coachem_athlete_pro_annual';

/** Entitlement criada na RevenueCat (ex.: "pro") — coach e atleta no mesmo projeto RC. */
export const REVENUECAT_ENTITLEMENT_PRO = 'pro';

/** Offering iOS coach — fallback quando `offerings.current` vem null no SDK. */
export const REVENUECAT_IOS_DEFAULT_OFFERING_ID = 'ios_default';

/** Offering iOS atleta (opcional; senão usa `current` / ios_default). */
export const REVENUECAT_ATHLETE_OFFERING_ID = 'athlete_default';
