import { sameOriginGatewayUrl } from "../lib/public-url";

/**
 * Public site settings (Astro `PUBLIC_*` env).
 * Brand and origins live here — app paths live in `routes.config.ts`.
 */
export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  coverImage: string;
  appUrl: string;
  apiUrl: string;
};

export function getSiteConfig(): SiteConfig {
  return {
    name:
      import.meta.env.PUBLIC_SITE_NAME ?? "Moon Tailors & Matching Center",
    tagline:
      import.meta.env.PUBLIC_SITE_TAGLINE ??
      "Bespoke stitching and matching, made simple.",
    description:
      import.meta.env.PUBLIC_SITE_DESCRIPTION ??
      "Find a customer, take measurements, and follow each order from cutting to delivery.",
    coverImage: import.meta.env.PUBLIC_SITE_COVER ?? "/images/hero-cover.webp",
    appUrl: sameOriginGatewayUrl(import.meta.env.PUBLIC_APP_URL, "/app"),
    apiUrl: sameOriginGatewayUrl(
      import.meta.env.PUBLIC_API_URL,
      "/server/api",
    ),
  };
}

export function appHref(path: string, site = getSiteConfig()): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${site.appUrl}${suffix}`;
}
