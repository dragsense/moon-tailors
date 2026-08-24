import {
  EPermissionAction,
  EResource,
  EUserLevel,
} from "@moon-tailors/contracts";

const ALL_ACTIONS = Object.values(EPermissionAction);

/** Every `resource:action` in the catalog (no wildcard). Platform owner / admin only. */
function allResourcePermissions(): string[] {
  return Object.values(EResource).flatMap((resource) =>
    ALL_ACTIONS.map((action) => `${resource}:${action}`),
  );
}

/** Full CRUD+manage for a fixed resource set (no wildcards). */
function permsFor(...resources: EResource[]): string[] {
  return resources.flatMap((resource) =>
    ALL_ACTIONS.map((action) => `${resource}:${action}`),
  );
}



const CUSTOMER_PERMS = [
] as const;

const STAFF_PERMS = [
  `${EResource.DASHBOARD}:${EPermissionAction.READ}`,
  ...permsFor(EResource.CUSTOMERS, EResource.MEASUREMENTS, EResource.ORDERS),
  `${EResource.SETTINGS}:${EPermissionAction.READ}`,
  `${EResource.SETTINGS}:${EPermissionAction.UPDATE}`,
  `${EResource.NOTIFICATIONS}:${EPermissionAction.READ}`,
  `${EResource.NOTIFICATIONS}:${EPermissionAction.UPDATE}`,
] as const;

/**
 * Default permission names for a new account, keyed by user level.
 * Elevated catalog levels get every resource:action individually — never `*:*`.
 * SUPER_ADMIN is an explicit product set, not the full catalog.
 */
export function defaultPermissionsForLevel(level: EUserLevel): string[] {
  switch (level) {
    case EUserLevel.PLATFORM_OWNER:
      return allResourcePermissions();
    case EUserLevel.STAFF:
      return [...STAFF_PERMS];
    case EUserLevel.CUSTOMER:
      return [...CUSTOMER_PERMS];
    default:
      return [...CUSTOMER_PERMS];
  }
}
