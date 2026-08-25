import {
  EPermissionAction,
  EUserLevel,
  type EResource,
  type IAuthUser,
} from "@moon-tailors/contracts";

/** Fine-grained gate for a single op or action (UX only — server enforces too). */
export type OpPermission = {
  resource: EResource;
  action: EPermissionAction;
};

/** Effective permission names supplied by `/auth/me` and login. */
export function getUserPermissionNames(
  user: IAuthUser | null | undefined,
): string[] {
  return [...new Set(user?.permissions ?? [])];
}

/** Platform owner (`*:*` or level 0) — full client-side access. */
export function hasWildcardAccess(
  user: IAuthUser | null | undefined,
): boolean {
  if (!user) return false;
  if (user.level === EUserLevel.PLATFORM_OWNER) return true;
  return getUserPermissionNames(user).includes("*:*");
}

/** True when any requested action is allowed for the resource. */
export function hasPermission(
  user: IAuthUser | null | undefined,
  resource: EResource,
  actions: EPermissionAction[],
): boolean {
  if (hasWildcardAccess(user)) return true;

  const names = getUserPermissionNames(user);
  return actions.some(
    (action) =>
      names.includes(`${resource}:${action}`) ||
      names.includes(`${resource}:*`) ||
      names.includes(`*:${action}`),
  );
}

export function hasResourcePermission(
  user: IAuthUser | null | undefined,
  resource: EResource,
): boolean {
  if (hasWildcardAccess(user)) return true;

  const names = getUserPermissionNames(user);
  return names.some(
    (name) =>
      name.startsWith(`${resource}:`) || name === `${resource}:*`,
  );
}

export function canReadResource(
  user: IAuthUser | null | undefined,
  resource: EResource,
): boolean {
  return hasPermission(user, resource, [
    EPermissionAction.READ,
    EPermissionAction.MANAGE,
  ]);
}

export function canRunOp(
  user: IAuthUser | null | undefined,
  permission?: OpPermission,
): boolean {
  if (!permission) return true;
  return hasPermission(user, permission.resource, [
    permission.action,
    EPermissionAction.MANAGE,
  ]);
}

export function canRunOpConfig(
  user: IAuthUser | null | undefined,
  op?: { permission?: OpPermission },
): boolean {
  return canRunOp(user, op?.permission);
}
