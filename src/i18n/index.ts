import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en';
import ptBR from './locales/pt-BR';

export function getDeviceLanguage(): 'pt-BR' | 'en' {
  const code = Localization.getLocales()[0]?.languageCode ?? 'pt';
  return code.startsWith('en') ? 'en' : 'pt-BR';
}

void i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'pt-BR',
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false },
});

export default i18n;
