/** Documentos legais Coach'em no Firebase Hosting. */
export const TREINA_TERMS_URL_PT = 'https://futeba-96395.web.app/terms/coachem';
export const TREINA_PRIVACY_URL_PT = 'https://futeba-96395.web.app/privacy/coachem';
export const TREINA_TERMS_URL_EN = 'https://futeba-96395.web.app/terms/coachem-en';
export const TREINA_PRIVACY_URL_EN = 'https://futeba-96395.web.app/privacy/coachem-en';

/** Compatibilidade com código legado que ainda importa estes nomes. */
export const TREINA_TERMS_URL = TREINA_TERMS_URL_PT;
export const TREINA_PRIVACY_URL = TREINA_PRIVACY_URL_PT;

function isEnglish(lang?: string | null): boolean {
  return typeof lang === 'string' && lang.toLowerCase().startsWith('en');
}

export function getTermsUrlByLanguage(lang?: string | null): string {
  return isEnglish(lang) ? TREINA_TERMS_URL_EN : TREINA_TERMS_URL_PT;
}

export function getPrivacyUrlByLanguage(lang?: string | null): string {
  return isEnglish(lang) ? TREINA_PRIVACY_URL_EN : TREINA_PRIVACY_URL_PT;
}

/** AsyncStorage: atleta aceitou Termos + Privacidade no primeiro acesso (uma vez por instalação). */
export const ATHLETE_LEGAL_ACCEPTANCE_KEY = 'coachem_athlete_legal_accept_v1';
