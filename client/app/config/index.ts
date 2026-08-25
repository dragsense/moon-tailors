/**
 * App configuration — URLs and navigation as data.
 *
 * ```txt
 * config/
 *   routes.config.ts  routes, titles, level + permission access
 *   nav.config.ts     account menu items for the header dropdown
 * ```
 *
 * Add a page: route constant → optional account-menu entry → optional access rule.
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
  customerNewOrderPath,
  customerPath,
  getRouteTitle,
  orderPath,
  type AppRoute,
  type PublicRoute,
} from "./routes.config";

export {
  getAccountNavItems,
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
