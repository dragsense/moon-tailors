import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme, type Theme } from "@/hooks/use-theme";

const overlayTrigger = "site-header__icon-btn size-9";

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "light") return <Sun className="size-4" />;
  if (theme === "dark") return <Moon className="size-4" />;
  return <Monitor className="size-4" />;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className={overlayTrigger}>
          <ThemeIcon theme={theme} />
          <span className="sr-only">{t("prefs.theme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem
          onSelect={() => setTheme("light")}
          className={theme === "light" ? "bg-accent" : undefined}
        >
          <Sun className="size-4" />
          {t("prefs.light")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme("dark")}
          className={theme === "dark" ? "bg-accent" : undefined}
        >
          <Moon className="size-4" />
          {t("prefs.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme("system")}
          className={theme === "system" ? "bg-accent" : undefined}
        >
          <Monitor className="size-4" />
          {t("prefs.system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
