import { LOCALE_CATALOG } from "../locales";
import type { Language, Theme } from "../lib/prefs";
import { useSitePrefs } from "./site-prefs-provider";

const THEME_OPTIONS: Theme[] = ["light", "dark", "system"];

export function SiteChrome() {
  const { theme, setTheme, language, setLanguage, t } = useSitePrefs();

  return (
    <div className="site-chrome" role="region" aria-label={t("a11y.prefs")}>
      <label className="site-chrome__field">
        <span className="site-chrome__label">{t("prefs.theme")}</span>
        <select
          className="site-chrome__select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          {THEME_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`prefs.${option}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="site-chrome__field">
        <span className="site-chrome__label">{t("prefs.language")}</span>
        <select
          className="site-chrome__select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          {(Object.keys(LOCALE_CATALOG) as Language[]).map((code) => (
            <option key={code} value={code}>
              {LOCALE_CATALOG[code].nativeLabel}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
