import { LanguageToggle, ThemeToggle } from "@/components/layout-ui";
import { I18nProvider } from "@/hooks/use-i18n";
import { ThemeProvider } from "@/hooks/use-theme";
import { en } from "@/locales/en";

/** Theme + language — one idle island so they share providers. */
export function HeaderPrefs() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label={en.a11y.prefs}
        >
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </I18nProvider>
    </ThemeProvider>
  );
}
