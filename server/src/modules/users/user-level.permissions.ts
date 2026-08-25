import {
  EPermissionAction,
  EResource,
  EUserLevel,
} from "@moon-tailors/contracts";

const ALL_ACTIONS = Object.values(EPermissionAction);

/** Full CRUD+manage for a fixed resource set (no wildcards). */
function permsFor(...resources: EResource[]): string[] {
  return resources.flatMap((resource) =>
    ALL_ACTIONS.map((action) => `${resource}:${action}`),
  );
}

const CUSTOMER_PERMS = [] as const;

const STAFF_PERMS = [
  `${EResource.DASHBOARD}:${EPermissionAction.READ}`,
  ...permsFor(
    EResource.CUSTOMERS,
    EResource.MEASUREMENTS,
    EResource.ORDERS,
    EResource.GARMENT_TYPES,
  ),
  `${EResource.SETTINGS}:${EPermissionAction.READ}`,
  `${EResource.SETTINGS}:${EPermissionAction.UPDATE}`,
] as const;

/**
 * Default permission names for a new account, keyed by user level.
 * Platform owner is a wildcard — not a catalog of every resource:action.
 */
export function defaultPermissionsForLevel(level: EUserLevel): string[] {
  switch (level) {
    case EUserLevel.PLATFORM_OWNER:
      return ["*:*"];
    case EUserLevel.STAFF:
      return [...STAFF_PERMS];
    case EUserLevel.CUSTOMER:
      return [...CUSTOMER_PERMS];
    default:
      return [...CUSTOMER_PERMS];
  }
}
