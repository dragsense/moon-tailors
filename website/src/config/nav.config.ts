import { getSiteConfig } from "./site.config";
import { SITE_ROUTES } from "./routes.config";

/**
 * Site chrome as data (header mark, cover) — same idea as client nav.config.
 */
export type SiteChrome = {
  brand: string;
  homeHref: string;
  apiUrl: string;
  coverImage: string;
  tagline: string;
  description: string;
};

export function getSiteChrome(site = getSiteConfig()): SiteChrome {
  return {
    brand: site.name,
    homeHref: SITE_ROUTES.HOME,
    apiUrl: site.apiUrl,
    coverImage: site.coverImage,
    tagline: site.tagline,
    description: site.description,
  };
}
