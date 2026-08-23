import { useEffect } from "react";
import { useTheme, type Theme } from "~/hooks/use-theme";
import { useI18n } from "~/hooks/use-i18n";
import { setPreferredTimezone } from "~/lib/api";
import { useOp } from "~/ops";
import { resolvePreferences } from "../lib/preferences";
import { settingsOps } from "../ops";

/** Applies theme + language + timezone from the mySettings op. */
export function SettingsPrefsSync() {
  const settings = useOp(settingsOps, "mySettings");
  const { setTheme } = useTheme();
  const { setLanguage } = useI18n();
  const prefs = settings.kind === "query" ? settings.data : undefined;

  useEffect(() => {
    if (!prefs) return;
    const resolved = resolvePreferences(prefs);
    setTheme(resolved.theme.theme as Theme);
    setLanguage(resolved.language);
    setPreferredTimezone(resolved.time.timezone);
  }, [prefs, setLanguage, setTheme]);

  return null;
}
