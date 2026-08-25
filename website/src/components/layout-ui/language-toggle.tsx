import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/use-i18n";
import { LOCALE_CATALOG } from "@/locales";
import type { Language } from "@/lib/prefs";

const overlayTrigger = "site-header__icon-btn size-9";

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className={overlayTrigger}>
          <Globe className="size-4" />
          <span className="sr-only">{t("prefs.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {(Object.keys(LOCALE_CATALOG) as Language[]).map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => setLanguage(code)}
            className={language === code ? "bg-accent" : undefined}
          >
            {LOCALE_CATALOG[code].nativeLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
