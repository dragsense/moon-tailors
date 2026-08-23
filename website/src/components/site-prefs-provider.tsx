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
} from "../locales";
import {
  LANGUAGE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  applyLanguage,
  applyTheme,
  resolveTheme,
  type Language,
  type ResolvedTheme,
  type Theme,
} from "../lib/prefs";

type PrefsContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function readLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "en" || stored === "ar") return stored;
  return DEFAULT_LANGUAGE;
}

export function SitePrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const initialTheme = readTheme();
    const initialLang = readLanguage();
    setThemeState(initialTheme);
    setLanguageState(initialLang);
    const resolved = resolveTheme(initialTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    applyLanguage(initialLang);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = resolveTheme("system");
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    applyLanguage(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey) =>
      resolveTranslation(LOCALE_CATALOG[language].dict, key),
    [language],
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      language,
      setLanguage,
      t,
      dir: LOCALE_CATALOG[language].dir,
    }),
    [theme, setTheme, resolvedTheme, language, setLanguage, t],
  );

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function useSitePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("useSitePrefs must be used within SitePrefsProvider");
  return ctx;
}
