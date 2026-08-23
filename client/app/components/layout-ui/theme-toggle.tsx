import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useTheme, type Theme } from "~/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

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
        <DropdownMenuItem onClick={() => selectTheme("light")}>
          <Sun className="size-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectTheme("dark")}>
          <Moon className="size-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectTheme("system")}>
          <Monitor className="size-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
