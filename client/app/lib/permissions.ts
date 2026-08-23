import {
  EPermissionAction,
  type EResource,
  type IAuthUser,
} from "@template/contracts";

/** Fine-grained gate for a single op or action (UX only — server enforces too). */
export type OpPermission = {
  resource: EResource;
  action: EPermissionAction;
};

/** Effective permission names supplied by the authentication response. */
export function getUserPermissionNames(
  user: IAuthUser | null | undefined,
): string[] {
  return [...new Set(user?.permissions ?? [])];
}

/** True when any requested action is allowed for the resource. */
export function hasPermission(
  user: IAuthUser | null | undefined,
  resource: EResource,
  actions: EPermissionAction[],
): boolean {
  const names = getUserPermissionNames(user);

  return actions.some(
    (action) =>
      names.includes(`${resource}:${action}`) ||
      names.includes(`${resource}:*`) ||
      names.includes(`*:${action}`) ||
      names.includes("*:*"),
  );
}

export function hasResourcePermission(
  user: IAuthUser | null | undefined,
  resource: EResource,
): boolean {
  const names = getUserPermissionNames(user);
  return names.some(
    (name) =>
      name.startsWith(`${resource}:`) ||
      name === `${resource}:*` ||
      name === "*:*",
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
