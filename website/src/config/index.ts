/**
 * Website configuration — URLs and chrome as data.
 *
 * ```txt
 * config/
 *   site.config.ts    PUBLIC_* brand + app/api origins
 *   routes.config.ts  site + client app paths (login `/`, dashboard `/dashboard`)
 *   nav.config.ts     header/hero chrome
 * ```
 */
export {
  getSiteConfig,
  appHref,
  type SiteConfig,
} from "./site.config";

export {
  SITE_ROUTES,
  APP_ROUTES,
  getLoginUrl,
  getDashboardUrl,
  type SiteRoute,
  type AppRoute,
} from "./routes.config";

export { getSiteChrome, type SiteChrome } from "./nav.config";
