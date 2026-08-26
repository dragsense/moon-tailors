import { ELanguage } from "@moon-tailors/contracts";
import { Languages } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useI18n } from "~/hooks/use-i18n";
import { LOCALE_CATALOG } from "~/locales";

export function LanguageToggle() {
  const { language, setLanguage, t, alignEnd } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="size-9">
          <Languages className="size-4" />
          <span className="sr-only">{t("settings.appearance.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignEnd}>
        <DropdownMenuItem
          onSelect={() => setLanguage(ELanguage.EN)}
          className={language === ELanguage.EN ? "font-medium" : undefined}
        >
          {LOCALE_CATALOG[ELanguage.EN].nativeLabel}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setLanguage(ELanguage.UR)}
          className={language === ELanguage.UR ? "font-medium" : undefined}
        >
          {LOCALE_CATALOG[ELanguage.UR].nativeLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
