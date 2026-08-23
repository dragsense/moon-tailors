import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ELanguage } from "@template/contracts";
import {
  resolveDirectionLayout,
  type DirectionLayout,
  type TextDirection,
} from "~/lib/direction";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LOCALE_CATALOG,
  resolveTranslation,
  type TranslationKey,
} from "~/locales";

type I18nContextValue = DirectionLayout & {
  language: ELanguage;
  intlLocale: string;
  setLanguage: (language: ELanguage) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function readStoredLanguage(): ELanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (raw === ELanguage.EN || raw === ELanguage.AR) return raw;
  return DEFAULT_LANGUAGE;
}

/** Apply lang + dir on <html> and <body> so layout/sidebar flip with the locale. */
export function applyDocumentLocale(language: ELanguage): void {
  if (typeof document === "undefined") return;
  const meta = LOCALE_CATALOG[language];
  document.documentElement.lang = language;
  document.documentElement.setAttribute("dir", meta.dir);
  document.documentElement.dir = meta.dir;
  if (document.body) {
    document.body.setAttribute("dir", meta.dir);
    document.body.dir = meta.dir;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<ELanguage>(readStoredLanguage);

  useEffect(() => {
    applyDocumentLocale(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((next: ELanguage) => {
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      resolveTranslation(LOCALE_CATALOG[language].dict, key, params),
    [language],
  );

  const value = useMemo<I18nContextValue>(() => {
    const meta = LOCALE_CATALOG[language];
    return {
      language,
      intlLocale: meta.intl,
      setLanguage,
      t,
      ...resolveDirectionLayout(meta.dir as TextDirection),
    };
  }, [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
