import { useEffect, useRef } from "react";
import { useTheme, type Theme } from "~/hooks/use-theme";
import { useI18n } from "~/hooks/use-i18n";
import { useOp } from "~/ops";
import { resolvePreferences } from "../lib/preferences";
import { settingsOps } from "../ops";

/** Applies theme + language from the mySettings op (once per distinct value). */
export function SettingsPrefsSync() {
  const settings = useOp(settingsOps, "mySettings");
  const { setTheme } = useTheme();
  const { setLanguage } = useI18n();
  const prefs = settings.kind === "query" ? settings.data : undefined;
  const appliedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prefs) return;
    const resolved = resolvePreferences(prefs);
    const key = `${resolved.theme.theme}|${resolved.language}`;
    if (appliedKeyRef.current === key) return;
    appliedKeyRef.current = key;
    setTheme(resolved.theme.theme as Theme);
    setLanguage(resolved.language);
  }, [prefs, setLanguage, setTheme]);

  return null;
}
