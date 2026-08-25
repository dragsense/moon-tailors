import { appHref, getSiteConfig } from "./site.config";

/**
 * Website paths and client-app URLs.
 * Match `client/app/config/routes.config.ts` — do not put these in env.
 */
export const SITE_ROUTES = {
  HOME: "/",
} as const;

export type SiteRoute = (typeof SITE_ROUTES)[keyof typeof SITE_ROUTES];

/** Paths on the client app (under `PUBLIC_APP_URL`). */
export const APP_ROUTES = {
  LOGIN: "/",
  DASHBOARD: "/dashboard",
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

export function getLoginUrl(site = getSiteConfig()): string {
  return appHref(APP_ROUTES.LOGIN, site);
}

export function getDashboardUrl(site = getSiteConfig()): string {
  return appHref(APP_ROUTES.DASHBOARD, site);
}
