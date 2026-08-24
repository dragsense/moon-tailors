import { EUserLevel } from "@moon-tailors/contracts";
import type {
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { RequestContext } from "../context";
import type { AccessScope } from "./entity-query.types";

function columnNames<Entity extends ObjectLiteral>(
  repo: Repository<Entity>,
): Set<string> {
  return new Set(repo.metadata.columns.map((c) => c.propertyName));
}

/**
 * Levels that see every row in the current tenant (skip default owner ACL).
 * Isolation is still `tenantId` from RequestContext — never cross-tenant.
 *
 * - PLATFORM_OWNER / SUPER_ADMIN — platform operators
 * - ADMIN — business admin who owns/runs the business
 *
 * STAFF / MEMBER stay owner-scoped (`createdByUserId`).
 */
const SKIP_DEFAULT_OWNER_LEVELS: ReadonlySet<EUserLevel> = new Set([
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
]);

/** True when default `createdByUserId` owner ACL should not be applied. */
export function skipsDefaultOwnerAccess(
  level: EUserLevel | undefined | null,
): boolean {
  return level != null && SKIP_DEFAULT_OWNER_LEVELS.has(level);
}

/**
 * Always filter by `tenantId` from RequestContext when the entity has that
 * column. Not an AccessScope — every request is tenant-bound; callers never
 * pass other tenants.
 */
export function applyTenantScope<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  repo: Repository<Entity>,
  alias: string,
): void {
  if (!columnNames(repo).has("tenantId")) return;
  const tenantId = RequestContext.get("tenantId");
  if (!tenantId) return;
  qb.andWhere(`${alias}.tenantId = :__tenantScopeId`, {
    __tenantScopeId: String(tenantId),
  });
}

/**
 * Default row ACL: owner (`createdByUserId`) for STAFF / MEMBER.
 * Platform owner, super admin, and business admin skip owner — they already
 * see only the current tenant via `applyTenantScope`.
 * Tables without `createdByUserId` stay unscoped at the owner layer.
 */
export function resolveDefaultOwnerScope<Entity extends ObjectLiteral>(
  repo: Repository<Entity>,
): AccessScope | undefined {
  if (!columnNames(repo).has("createdByUserId")) return undefined;

  const userId = RequestContext.get("userId");
  if (!userId) return undefined;

  if (skipsDefaultOwnerAccess(RequestContext.get("userLevel"))) {
    return undefined;
  }

  return { type: "owner", userId: String(userId) };
}

/**
 * Row ACL for a query:
 * - If caller passes `access`, that replaces the default owner scope
 *   (e.g. a feature that scopes rows by `recipientId` or `userId`).
 * - Otherwise apply default owner for non-admins.
 */
export function resolveAccessScopes<Entity extends ObjectLiteral>(
  repo: Repository<Entity>,
  access: AccessScope | AccessScope[] | undefined,
): AccessScope[] | undefined {
  if (access !== undefined) {
    const list = Array.isArray(access) ? access : [access];
    return list.length ? list : undefined;
  }
  const owner = resolveDefaultOwnerScope(repo);
  return owner ? [owner] : undefined;
}
