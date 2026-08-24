import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ILoginResponse } from "@moon-tailors/contracts";
import type { Route } from "./+types/root";
import { AppErrorScreen, AppLoader } from "~/components/layout-ui";
import { TooltipProvider } from "~/components/ui/tooltip";
import {
  applyRefreshedSession,
  clearSession,
} from "~/features/auth/session";
import {
  ensureCsrfToken,
  setApiSessionRefreshHandler,
  setApiUnauthorizedHandler,
} from "~/lib/api";
import { stripAppBasename, withAppBasename } from "~/lib/app-base";
import { queryClient } from "~/lib/query";
import { ThemeProvider, THEME_STORAGE_KEY, I18nProvider } from "~/hooks";
import { LANGUAGE_STORAGE_KEY } from "~/locales";
import {
  BusinessThemeRoot,
  businessThemeOps,
} from "~/features/business-theme";
import { SettingsPrefsSync, settingsOps } from "~/features/settings";
import { OpsProvider } from "~/ops";
import "./app.css";

const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k)||'system';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(r);}catch(e){}})();`;

const localeInitScript = `(function(){try{var k=${JSON.stringify(LANGUAGE_STORAGE_KEY)};var lang=localStorage.getItem(k)||'en';if(lang==='ar'){lang='ur';localStorage.setItem(k,'ur');}var dir=lang==='ur'?'rtl':'ltr';document.documentElement.lang=lang;document.documentElement.dir=dir;document.documentElement.setAttribute('dir',dir);}catch(e){}})();`;

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap",
  },
];

export function HydrateFallback() {
  return <AppLoader />;
}

/** Document shell only — keep React providers in `App` (RR Layout can break context). */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function isLoginResponse(payload: unknown): payload is ILoginResponse {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<ILoginResponse>;
  return (
    typeof candidate.accessToken?.token === "string" &&
    typeof candidate.accessToken.expiresIn === "number" &&
    typeof candidate.user?.id === "string"
  );
}

const PUBLIC_AUTH_PATHS = new Set([
  "/",
  "/login",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
]);

export default function App() {
  useEffect(() => {
    setApiUnauthorizedHandler(() => {
      clearSession();
      const path = stripAppBasename(window.location.pathname);
      if (PUBLIC_AUTH_PATHS.has(path)) return;
      window.location.assign(withAppBasename("/"));
    });
    setApiSessionRefreshHandler((payload) => {
      if (isLoginResponse(payload)) {
        applyRefreshedSession(payload);
      }
    });
    void ensureCsrfToken();
    return () => {
      setApiUnauthorizedHandler(null);
      setApiSessionRefreshHandler(null);
    };
  }, []);

  return (
    <ThemeProvider>
      <I18nProvider>
        <TooltipProvider delayDuration={0}>
          <QueryClientProvider client={queryClient}>
            <OpsProvider store={settingsOps}>
              {() => (
                <OpsProvider store={businessThemeOps}>
                  {() => (
                    <BusinessThemeRoot>
                      <SettingsPrefsSync />
                      <Outlet />
                    </BusinessThemeRoot>
                  )}
                </OpsProvider>
              )}
            </OpsProvider>
          </QueryClientProvider>
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <AppErrorScreen error={error} />;
}
