import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  LOCALE_CATALOG,
  resolveTranslation,
  type TranslationKey,
} from "@/locales";
import {
  applyLanguage,
  persistLanguage,
  readStoredLanguage,
  type Language,
} from "@/lib/prefs";

type I18nContextValue = {
  language: Language;
  dir: "ltr" | "rtl";
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = readStoredLanguage();
    setLanguageState(stored);
    applyLanguage(stored);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    persistLanguage(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      resolveTranslation(LOCALE_CATALOG[language].dict, key, params),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      dir: LOCALE_CATALOG[language].dir,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
