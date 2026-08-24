export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  appUrl: string;
  apiUrl: string;
  loginPath: string;
  dashboardPath: string;
};

/**
 * Public site settings (Astro `PUBLIC_*` env).
 * Mirrors client env-driven config — no hardcoded brand/URLs in pages.
 */
export function getSiteConfig(): SiteConfig {
  const appUrl = (
    import.meta.env.PUBLIC_APP_URL ?? "http://localhost:8088/app"
  ).replace(/\/$/, "");
  const apiUrl = (
    import.meta.env.PUBLIC_API_URL ?? "http://localhost:8088/server/api"
  ).replace(/\/$/, "");

  return {
    name:
      import.meta.env.PUBLIC_SITE_NAME ?? "Moon Tailors & Matching Center",
    tagline:
      import.meta.env.PUBLIC_SITE_TAGLINE ??
      "Bespoke stitching and matching, made simple.",
    description:
      import.meta.env.PUBLIC_SITE_DESCRIPTION ??
      "Find a customer, take measurements, and follow each order from cutting to delivery.",
    appUrl,
    apiUrl,
    loginPath: import.meta.env.PUBLIC_APP_LOGIN_PATH ?? "/",
    dashboardPath: import.meta.env.PUBLIC_APP_DASHBOARD_PATH ?? "/dashboard",
  };
}

export function appHref(path: string, site = getSiteConfig()): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${site.appUrl}${suffix}`;
}
