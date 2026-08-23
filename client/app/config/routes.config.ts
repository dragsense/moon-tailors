import {
  EPermissionAction,
  EResource,
  EUserLevel,
  type IAuthUser,
} from "@template/contracts";
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
  SIGNUP: "/signup",
  VERIFY_OTP: "/verify-otp",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  EMAIL_LOGIN: "/email-login",
} as const;
export type PublicRoute = (typeof PUBLIC_ROUTES)[keyof typeof PUBLIC_ROUTES];

/** Behind the app shell (session required). */
export const APP_ROUTES = {
  DASHBOARD: "/dashboard",
  TASKS: "/tasks",
  TASK_CREATE: "/tasks/new",
  USERS: "/users",
  CHAT: "/chat",
  SMS: "/sms",
  EMAIL: "/email",
  AVAILABILITY: "/availability",
  BILLINGS: "/billings",
  PAYMENTS: "/payments",
  AI: "/ai",
  API_KEYS: "/api-keys",
  FILES: "/files",
  CAMERAS: "/cameras",
  SETTINGS: "/settings",
  CUSTOMIZE: "/customize",
} as const;
export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

export const COMMON_ROUTES = {
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "*",
} as const;

/** Page titles by path — used for document title and shell header. */
export const ROUTE_TITLES: Record<string, string> = {
  [PUBLIC_ROUTES.LOGIN]: "Login",
  [PUBLIC_ROUTES.SIGNUP]: "Sign up",
  [PUBLIC_ROUTES.VERIFY_OTP]: "Verify OTP",
  [PUBLIC_ROUTES.FORGOT_PASSWORD]: "Forgot password",
  [PUBLIC_ROUTES.RESET_PASSWORD]: "Reset password",
  [PUBLIC_ROUTES.EMAIL_LOGIN]: "Email login",
  [APP_ROUTES.DASHBOARD]: "Dashboard",
  [APP_ROUTES.TASKS]: "Tasks",
  [APP_ROUTES.TASK_CREATE]: "New task",
  [APP_ROUTES.USERS]: "Users",
  [APP_ROUTES.CHAT]: "Chat",
  [APP_ROUTES.SMS]: "SMS",
  [APP_ROUTES.EMAIL]: "Email",
  [APP_ROUTES.AVAILABILITY]: "Availability",
  [APP_ROUTES.BILLINGS]: "Billings",
  [APP_ROUTES.PAYMENTS]: "Payments",
  [APP_ROUTES.AI]: "AI",
  [APP_ROUTES.API_KEYS]: "API keys",
  [APP_ROUTES.FILES]: "Files",
  [APP_ROUTES.CAMERAS]: "Cameras",
  [APP_ROUTES.SETTINGS]: "Settings",
  [APP_ROUTES.CUSTOMIZE]: "Customize",
  [COMMON_ROUTES.UNAUTHORIZED]: "Unauthorized",
};

/**
 * Route-level access. Omit a path to allow every signed-in level.
 * Checked by the access guard and op-level `permission` on each op.
 */
export const ROUTE_LEVELS: Partial<Record<string, EUserLevel[]>> = {
  [APP_ROUTES.USERS]: [
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  ],
  [APP_ROUTES.TASK_CREATE]: [
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  ],
  [APP_ROUTES.CUSTOMIZE]: [
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  ],
  [APP_ROUTES.AI]: [
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  ],
  [APP_ROUTES.SMS]: [
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  ],
  [APP_ROUTES.EMAIL]: [
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  ],
};

export const ROUTE_PERMISSIONS: Partial<
  Record<string, { resource: EResource; action: EPermissionAction }>
> = {
  [APP_ROUTES.DASHBOARD]: {
    resource: EResource.DASHBOARD,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.USERS]: {
    resource: EResource.USERS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.TASK_CREATE]: {
    resource: EResource.TASKS,
    action: EPermissionAction.CREATE,
  },
  [APP_ROUTES.CHAT]: {
    resource: EResource.CHAT,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.SMS]: {
    resource: EResource.SMS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.EMAIL]: {
    resource: EResource.EMAIL,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.AVAILABILITY]: {
    resource: EResource.USER_AVAILABILITY,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.BILLINGS]: {
    resource: EResource.BILLINGS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.PAYMENTS]: {
    resource: EResource.PAYMENTS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.AI]: {
    resource: EResource.AI,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.API_KEYS]: {
    resource: EResource.API_KEYS,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.FILES]: {
    resource: EResource.FILES,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.CAMERAS]: {
    resource: EResource.VIDEO_STREAM,
    action: EPermissionAction.READ,
  },
  [APP_ROUTES.CUSTOMIZE]: {
    resource: EResource.BUSINESSES,
    action: EPermissionAction.UPDATE,
  },
};

/** Where each level lands after login. */
export const LEVEL_HOME: Record<EUserLevel, string> = {
  [EUserLevel.PLATFORM_OWNER]: APP_ROUTES.DASHBOARD,
  [EUserLevel.SUPER_ADMIN]: APP_ROUTES.DASHBOARD,
  [EUserLevel.ADMIN]: APP_ROUTES.DASHBOARD,
  [EUserLevel.STAFF]: APP_ROUTES.DASHBOARD,
  [EUserLevel.MEMBER]: APP_ROUTES.DASHBOARD,
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
