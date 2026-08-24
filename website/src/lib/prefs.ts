export const THEME_STORAGE_KEY = "theme";
export const LANGUAGE_STORAGE_KEY = "app.language";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type Language = "en" | "ur";

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export function applyLanguage(lang: Language) {
  const root = document.documentElement;
  const dir = lang === "ur" ? "rtl" : "ltr";
  root.lang = lang;
  root.dir = dir;
  root.setAttribute("dir", dir);
}

/** Inline scripts for Base layout — same keys as the client app. */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k)||'system';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(r);}catch(e){}})();`;

export const localeInitScript = `(function(){try{var k=${JSON.stringify(LANGUAGE_STORAGE_KEY)};var lang=localStorage.getItem(k)||'en';if(lang==='ar'){lang='ur';localStorage.setItem(k,'ur');}var dir=lang==='ur'?'rtl':'ltr';document.documentElement.lang=lang;document.documentElement.dir=dir;document.documentElement.setAttribute('dir',dir);}catch(e){}})();`;
