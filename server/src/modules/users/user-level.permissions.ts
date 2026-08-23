import {
  EPermissionAction,
  EResource,
  EUserLevel,
} from "@template/contracts";

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

const API_KEY_PERMS = [
  `${EResource.API_KEYS}:${EPermissionAction.READ}`,
  `${EResource.API_KEYS}:${EPermissionAction.CREATE}`,
  `${EResource.API_KEYS}:${EPermissionAction.DELETE}`,
] as const;

/**
 * Public signup default level — product modules only.
 * Not the full catalog (no activity_logs / schedules).
 */
const SUPER_ADMIN_PERMS = [
  ...permsFor(
    EResource.DASHBOARD,
    EResource.TASKS,
    EResource.USERS,
    EResource.CHAT,
    EResource.SETTINGS,
    EResource.NOTIFICATIONS,
    EResource.BUSINESSES,
    EResource.USER_AVAILABILITY,
    EResource.BILLINGS,
    EResource.PAYMENTS,
    EResource.FILES,
    EResource.VIDEO_STREAM,
    EResource.AI,
    EResource.SMS,
    EResource.EMAIL,
  ),
  ...API_KEY_PERMS,
] as const;

const MEMBER_PERMS = [
  `${EResource.DASHBOARD}:${EPermissionAction.READ}`,
  `${EResource.TASKS}:${EPermissionAction.READ}`,
  `${EResource.CHAT}:${EPermissionAction.READ}`,
  `${EResource.CHAT}:${EPermissionAction.CREATE}`,
  `${EResource.SETTINGS}:${EPermissionAction.READ}`,
  `${EResource.SETTINGS}:${EPermissionAction.UPDATE}`,
  `${EResource.NOTIFICATIONS}:${EPermissionAction.READ}`,
  `${EResource.NOTIFICATIONS}:${EPermissionAction.UPDATE}`,
  `${EResource.USER_AVAILABILITY}:${EPermissionAction.READ}`,
  `${EResource.USER_AVAILABILITY}:${EPermissionAction.UPDATE}`,
  `${EResource.FILES}:${EPermissionAction.READ}`,
  ...API_KEY_PERMS,
] as const;

const STAFF_PERMS = [
  `${EResource.DASHBOARD}:${EPermissionAction.READ}`,
  `${EResource.TASKS}:${EPermissionAction.READ}`,
  `${EResource.TASKS}:${EPermissionAction.CREATE}`,
  `${EResource.TASKS}:${EPermissionAction.UPDATE}`,
  `${EResource.CHAT}:${EPermissionAction.READ}`,
  `${EResource.CHAT}:${EPermissionAction.CREATE}`,
  `${EResource.SETTINGS}:${EPermissionAction.READ}`,
  `${EResource.SETTINGS}:${EPermissionAction.UPDATE}`,
  `${EResource.NOTIFICATIONS}:${EPermissionAction.READ}`,
  `${EResource.NOTIFICATIONS}:${EPermissionAction.UPDATE}`,
  `${EResource.NOTIFICATIONS}:${EPermissionAction.DELETE}`,
  `${EResource.USER_AVAILABILITY}:${EPermissionAction.READ}`,
  `${EResource.USER_AVAILABILITY}:${EPermissionAction.UPDATE}`,
  `${EResource.FILES}:${EPermissionAction.READ}`,
  `${EResource.FILES}:${EPermissionAction.CREATE}`,
  `${EResource.VIDEO_STREAM}:${EPermissionAction.READ}`,
  ...API_KEY_PERMS,
] as const;

/**
 * Default permission names for a new account, keyed by user level.
 * Elevated catalog levels get every resource:action individually — never `*:*`.
 * SUPER_ADMIN is an explicit product set (signup default), not the full catalog.
 */
export function defaultPermissionsForLevel(level: EUserLevel): string[] {
  switch (level) {
    case EUserLevel.PLATFORM_OWNER:
      return allResourcePermissions();
    case EUserLevel.SUPER_ADMIN:
      return [...SUPER_ADMIN_PERMS];
    case EUserLevel.ADMIN:
      return allResourcePermissions();
    case EUserLevel.STAFF:
      return [...STAFF_PERMS];
    case EUserLevel.MEMBER:
      return [...MEMBER_PERMS];
    default:
      return [...MEMBER_PERMS];
  }
}
