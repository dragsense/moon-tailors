import { useEffect, useRef } from "react";
import { useTheme, type Theme } from "~/hooks/use-theme";
import { useI18n } from "~/hooks/use-i18n";
import { useSettingsState } from "../hooks/use-settings";

/** Applies theme + language from settings RQ cache (once per distinct value). */
export function SettingsPrefsSync() {
  const { preferences, data } = useSettingsState();
  const { setTheme } = useTheme();
  const { setLanguage } = useI18n();
  const appliedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const key = `${preferences.theme.theme}|${preferences.language}`;
    if (appliedKeyRef.current === key) return;
    appliedKeyRef.current = key;
    setTheme(preferences.theme.theme as Theme);
    setLanguage(preferences.language);
  }, [data, preferences, setLanguage, setTheme]);

  return null;
}
