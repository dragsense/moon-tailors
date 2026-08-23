import {
  EBorderRadius,
  EDensity,
  type IBusinessTheme,
} from "@template/contracts";
import type { BusinessThemeDraftPayload } from "./preview";

const LIGHT_FG = "oklch(0.99 0 0)";
const DARK_FG = "oklch(0.21 0.01 285)";

const RADIUS_MAP: Record<string, string> = {
  [EBorderRadius.SM]: "0.375rem",
  [EBorderRadius.MD]: "0.625rem",
  [EBorderRadius.LG]: "0.875rem",
};

const DENSITY_PADDING: Record<string, string> = {
  [EDensity.COMFORTABLE]: "1.5rem",
  [EDensity.COMPACT]: "0.75rem",
};

export const BUSINESS_THEME_CSS_KEYS = [
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--accent",
  "--accent-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-ring",
  "--ring",
  "--radius",
  "--density-padding",
  "--font-sans",
] as const;

type ThemeLike = Partial<IBusinessTheme> | BusinessThemeDraftPayload;

function resolveColor(
  isDark: boolean,
  light?: string | null,
  dark?: string | null,
): string | undefined {
  const value = isDark ? dark || light : light || dark;
  return value || undefined;
}

function contrastForeground(color: string): string {
  if (!color.startsWith("#")) return LIGHT_FG;
  const raw = color.slice(1);
  const hex =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return LIGHT_FG;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? DARK_FG : LIGHT_FG;
}

export function buildBusinessThemeCssVars(
  isDark: boolean,
  theme: ThemeLike,
): Record<string, string> {
  const vars: Record<string, string> = {};
  const primary = resolveColor(
    isDark,
    theme.primaryColorLight,
    theme.primaryColorDark,
  );
  const secondary = resolveColor(
    isDark,
    theme.secondaryColorLight,
    theme.secondaryColorDark,
  );
  const accent = resolveColor(
    isDark,
    theme.accentColorLight,
    theme.accentColorDark,
  );

  if (primary) {
    vars["--primary"] = primary;
    vars["--primary-foreground"] = contrastForeground(primary);
    vars["--sidebar-primary"] = primary;
    vars["--sidebar-primary-foreground"] = contrastForeground(primary);
    vars["--ring"] = primary;
    vars["--sidebar-ring"] = primary;
  }
  if (secondary) vars["--secondary"] = secondary;
  if (accent) {
    vars["--accent"] = accent;
    vars["--accent-foreground"] = contrastForeground(accent);
    vars["--sidebar-accent"] = accent;
  }

  if (theme.borderRadius) {
    vars["--radius"] =
      RADIUS_MAP[theme.borderRadius] ?? RADIUS_MAP[EBorderRadius.MD];
  }
  if (theme.density) {
    vars["--density-padding"] =
      DENSITY_PADDING[theme.density] ?? DENSITY_PADDING[EDensity.COMFORTABLE];
  }
  if (theme.fontFamily) {
    vars["--font-sans"] = `"${theme.fontFamily}", ui-sans-serif, system-ui, sans-serif`;
  }

  return vars;
}

export function applyCssVars(
  element: HTMLElement,
  vars: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value);
  }
}

export function clearBusinessThemeCssVars(element: HTMLElement): void {
  for (const key of BUSINESS_THEME_CSS_KEYS) {
    element.style.removeProperty(key);
  }
}

const FONT_LINK_ID = "business-theme-font";
const FAVICON_LINK_ID = "business-theme-favicon";

export function applyFontLink(fontUrl?: string | null): void {
  if (typeof document === "undefined") return;
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!fontUrl) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== fontUrl) link.href = fontUrl;
}

export function applyFavicon(url?: string | null): void {
  if (typeof document === "undefined") return;
  let link = document.getElementById(FAVICON_LINK_ID) as HTMLLinkElement | null;
  if (!url) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.id = FAVICON_LINK_ID;
    link.rel = "icon";
    document.head.appendChild(link);
  }
  if (link.href !== url) link.href = url;
}

export function applyBusinessThemeToDocument(
  isDark: boolean,
  theme: ThemeLike,
  options?: { setTitle?: boolean; previewAppearance?: "light" | "dark" },
): void {
  const root = document.documentElement;
  if (options?.previewAppearance) {
    root.classList.remove("light", "dark");
    root.classList.add(options.previewAppearance);
  }

  const vars = buildBusinessThemeCssVars(
    options?.previewAppearance
      ? options.previewAppearance === "dark"
      : isDark,
    theme,
  );
  applyCssVars(root, vars);
  applyFontLink(theme.fontUrl);
  if (theme.density) root.dataset.density = theme.density;
  if (theme.sidebarStyle) root.dataset.sidebarStyle = theme.sidebarStyle;

  const faviconUrl =
    "faviconUrl" in theme
      ? theme.faviconUrl
      : (theme as Partial<IBusinessTheme>).favicon?.url;
  applyFavicon(faviconUrl);

  if (options?.setTitle !== false && theme.title) {
    document.title = theme.title;
  }
}
