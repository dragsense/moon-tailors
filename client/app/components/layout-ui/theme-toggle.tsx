import { ETheme } from "@moon-tailors/contracts";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/features/auth/hooks";
import {
  mergePreferences,
  readCachedPreferences,
  writeCachedPreferences,
} from "~/features/settings/lib/preferences";
import { settingsOps } from "~/features/settings/ops";
import { useTheme, type Theme } from "~/hooks/use-theme";
import { useOp } from "~/ops";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const session = useSession();
  const saveSettings = useOp(settingsOps, "saveSettings");

  const icon =
    theme === "light" ? (
      <Sun className="size-4" />
    ) : theme === "dark" ? (
      <Moon className="size-4" />
    ) : (
      <Monitor className="size-4" />
    );

  const selectTheme = (next: Theme) => {
    setTheme(next);
    const nextTheme = next as ETheme;
    writeCachedPreferences(
      mergePreferences(readCachedPreferences(), { theme: { theme: nextTheme } }),
    );
    if (session?.user && saveSettings.kind === "mutation") {
      void saveSettings.run({ theme: { theme: nextTheme } });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="size-9">
          {icon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => selectTheme("light")}>
          <Sun className="size-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => selectTheme("dark")}>
          <Moon className="size-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => selectTheme("system")}>
          <Monitor className="size-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
