import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LanguageCode, LanguageInfo, languageInfo } from '../i18n/languages';
import { Translations, TRANSLATIONS } from '../i18n/translations';

const STORAGE_KEY = 'vacation-expenses:language:v1';

interface LanguageContextValue {
  languageCode: LanguageCode;
  language: LanguageInfo;
  t: Translations;
  isRTL: boolean;
  loading: boolean;
  setLanguage: (code: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [languageCode, setLanguageCode] = useState<LanguageCode>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && raw in TRANSLATIONS) setLanguageCode(raw as LanguageCode);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageCode(code);
    AsyncStorage.setItem(STORAGE_KEY, code);
  }, []);

  const value = useMemo(() => {
    const language = languageInfo(languageCode);
    return {
      languageCode,
      language,
      t: TRANSLATIONS[languageCode],
      isRTL: language.rtl,
      loading,
      setLanguage,
    };
  }, [languageCode, loading, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
