import i18n from '@/src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const LANGUAGE_STORAGE_KEY = '@coach_em_language';

export type AppLanguage = 'pt-BR' | 'en';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lng: AppLanguage) => Promise<void>;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function normalizeLanguage(code: string | undefined): AppLanguage {
  return code === 'en' ? 'en' : 'pt-BR';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => normalizeLanguage(i18n.language));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (cancelled) return;
        if (saved === 'en' || saved === 'pt-BR') {
          await i18n.changeLanguage(saved);
          setLanguageState(saved);
        }
      } catch {
        // keep device default
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback(async (lng: AppLanguage) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    await i18n.changeLanguage(lng);
    setLanguageState(lng);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      ready,
    }),
    [language, setLanguage, ready]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
