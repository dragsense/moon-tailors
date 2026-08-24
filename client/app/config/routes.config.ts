import {
  EPermissionAction,
  EResource,
  EUserLevel,
  type IAuthUser,
} from "@moon-tailors/contracts";
// Relative on purpose: routes.ts is loaded by vite-node, which does not apply
// the `~` alias, so an aliased import here crashes the dev server at startup.
import { hasPermission } from "../lib/permissions";

/**
 * Single source of truth for URLs.
 * Never hardcode a path in a component — import from here.
 */

export const ROOT_ROUTE = "/" as const;

/** Reachable without a session. Login lives at `/` (`/login` redirects there). */
export const PUBLIC_ROUTES = {
  LOGIN: ROOT_ROUTE,
  /** Leftover URL — redirects to login. */
  VERIFY_OTP: "/verify-otp",
  /** Leftover URL — redirects to login. */
  FORGOT_PASSWORD: "/forgot-password",
  /** Leftover URL — redirects to login. */
  RESET_PASSWORD: "/reset-password",
} as const;
export type PublicRoute = (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES];

/** Behind the app shell (session required). */
export const APP_ROUTES = {
  DASHBOARD: "/dashboard",
  CUSTOMERS: "/customers",
  ORDERS: "/orders",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;
export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

export function customerPath(id: string) {
  return `${APP_ROUTES.CUSTOMERS}/${id}`;
}

export function customerNewOrderPath(customerId: string) {
  return `${APP_ROUTES.CUSTOMERS}/${customerId}/orders/new`;
}

export function orderPath(id: string) {
  return `${APP_ROUTES.ORDERS}/${id}`;
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
  [APP_ROUTES.PROFILE]: "Profile",
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
  [APP_ROUTES.ORDERS]: {
    resource: EResource.ORDERS,
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

  const permission = ROUTE_PERMISSIONS[pathname];
  if (!permission) return true;
  return hasPermission(user, permission.resource, [
    permission.action,
    EPermissionAction.MANAGE,
  ]);
}
