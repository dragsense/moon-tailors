import { matchPath } from "react-router";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
  type IAuthUser,
} from "@moon-tailors/contracts";
// Relative on purpose: routes.ts is loaded by vite-node, which does not apply
// the `~` alias, so an aliased import here crashes the dev server at startup.
import { hasPermission, hasWildcardAccess } from "../lib/permissions";

/**
 * Single source of truth for URLs.
 * Never hardcode a path in a component — import from here.
 */

export const ROOT_ROUTE = "/" as const;

/** Reachable without a session. Login lives at `/`. */
export const PUBLIC_ROUTES = {
  LOGIN: ROOT_ROUTE,
} as const;
export type PublicRoute = (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES];

/** Behind the app shell (session required). `:id` patterns are registered in `routes.ts`. */
export const APP_ROUTES = {
  DASHBOARD: "/dashboard",
  CUSTOMERS: "/customers",
  CUSTOMER: "/customers/:id",
  ORDERS: "/orders",
  ORDER: "/orders/:id",
  STAFF: "/staff",
  STAFF_MEMBER: "/staff/:id",
  VENDORS: "/vendors",
  VENDOR: "/vendors/:id",
  PROFILE: "/profile",
  RESET_PASSWORD: "/reset-password",
  SETTINGS: "/settings",
} as const;
export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

function fillPath(pattern: string, params: Record<string, string>) {
  return Object.entries(params).reduce(
    (next, [key, value]) => next.replace(`:${key}`, value),
    pattern,
  );
}

export function customerPath(id: string) {
  return fillPath(APP_ROUTES.CUSTOMER, { id });
}

export function orderPath(id: string) {
  return fillPath(APP_ROUTES.ORDER, { id });
}

export function staffPath(id: string) {
  return fillPath(APP_ROUTES.STAFF_MEMBER, { id });
}

export function vendorPath(id: string) {
  return fillPath(APP_ROUTES.VENDOR, { id });
}

/** Opens the orders list modal on the dashboard. */
export const DASHBOARD_ORDERS_QUERY = "orders";

/** With the orders modal: pre-apply the "Late only" filter. */
export const DASHBOARD_DELAYED_QUERY = "delayed";

export function dashboardOrdersPath(options: { delayed?: boolean } = {}) {
  const query = new URLSearchParams({ [DASHBOARD_ORDERS_QUERY]: "1" });
  if (options.delayed) query.set(DASHBOARD_DELAYED_QUERY, "1");
  return `${APP_ROUTES.DASHBOARD}?${query.toString()}`;
}

export const COMMON_ROUTES = {
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "*",
} as const;

/** Page titles by path — used for document title and shell header. */
export const ROUTE_TITLES: Record<string, string> = {
  [PUBLIC_ROUTES.LOGIN]: "Login",
  [APP_ROUTES.DASHBOARD]: "Home",
  [APP_ROUTES.CUSTOMERS]: "Customers",
  [APP_ROUTES.ORDERS]: "Orders",
  [APP_ROUTES.STAFF]: "Staff",
  [APP_ROUTES.VENDORS]: "Vendors",
  [APP_ROUTES.PROFILE]: "Profile",
  [APP_ROUTES.RESET_PASSWORD]: "Reset password",
  [APP_ROUTES.SETTINGS]: "Settings",
  [COMMON_ROUTES.UNAUTHORIZED]: "Unauthorized",
};

/**
 * Route-level access. Omit a path to allow every signed-in level.
 * Checked by the access guard and op-level `permission` on each op.
 */
export const ROUTE_LEVELS: Partial<Record<string, EUserLevel[]>> = {};

export const ROUTE_PERMISSIONS: Partial<
  Record<string, { resource: EResource; action: EPermissionAction }>
> = {
  [APP_ROUTES.DASHBOARD]: {
    resource: EResource.DASHBOARD,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.CUSTOMERS]: {
    resource: EResource.CUSTOMERS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.CUSTOMER]: {
    resource: EResource.CUSTOMERS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.ORDERS]: {
    resource: EResource.ORDERS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.ORDER]: {
    resource: EResource.ORDERS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.STAFF]: {
    resource: EResource.STAFF,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.STAFF_MEMBER]: {
    resource: EResource.STAFF,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.VENDORS]: {
    resource: EResource.VENDORS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.VENDOR]: {
    resource: EResource.VENDORS,
    action: EPermissionAction.READ,
  },
};

/** Where each level lands after login. */
export const LEVEL_HOME: Record<EUserLevel, string> = {
  [EUserLevel.PLATFORM_OWNER]: APP_ROUTES.DASHBOARD,
  [EUserLevel.STAFF]: APP_ROUTES.DASHBOARD,
  [EUserLevel.CUSTOMER]: APP_ROUTES.DASHBOARD,
};

export function getRouteTitle(pathname: string): string | undefined {
  return ROUTE_TITLES[pathname];
}

/** True when the user may open this path. */
export function canAccessRoute(pathname: string, user?: IAuthUser): boolean {
  const levels = ROUTE_LEVELS[pathname];
  if (levels && (!user || !levels.includes(user.level))) return false;

  if (hasWildcardAccess(user)) return true;

  const permission = matchRoutePermission(pathname);
  if (!permission) return true;
  return hasPermission(user, permission.resource, [
    permission.action,
    EPermissionAction.MANAGE,
  ]);
}

function matchRoutePermission(pathname: string) {
  const exact = ROUTE_PERMISSIONS[pathname];
  if (exact) return exact;

  for (const [pattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pattern.includes(":") && matchPath({ path: pattern, end: true }, pathname)) {
      return permission;
    }
  }
  return undefined;
}
