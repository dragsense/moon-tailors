/**
 * App configuration — URLs and navigation as data.
 *
 * ```txt
 * config/
 *   routes.config.ts  routes, titles, level + permission access
 *   nav.config.ts     grouped NavItems filtered by level + permission
 * ```
 *
 * Add a page: route constant → nav entry → optional access rule.
 */
export {
  APP_ROUTES,
  COMMON_ROUTES,
  PUBLIC_ROUTES,
  LEVEL_HOME,
  ROOT_ROUTE,
  ROUTE_LEVELS,
  ROUTE_PERMISSIONS,
  ROUTE_TITLES,
  canAccessRoute,
  getRouteTitle,
  type AppRoute,
  type PublicRoute,
} from "./routes.config";

export {
  getNavItems,
  navItemsByLevel,
  type NavItem,
  type NavItemGroup,
} from "./nav.config";

export {
  buildBreadcrumbs,
  shouldShowBreadcrumbs,
  type BreadcrumbItem,
} from "./breadcrumb.config";
