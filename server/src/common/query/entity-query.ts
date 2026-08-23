import { buildPaginatedResponse, pageOffset } from "@template/contracts";
import type {
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { applyAccessScopes } from "./apply-access";
import { applyQueryOptions } from "./apply-query-options";
import {
  applyTenantScope,
  resolveAccessScopes,
} from "./tenant-scope";
import type {
  AccessScope,
  EntityQueryConfig,
  ListQueryInput,
  PaginatedRows,
} from "./entity-query.types";

export type BuildEntityQueryOptions = {
  /**
   * Row-level ACL. Replaces the default owner scope when set.
   * - omit → default owner (non-admins) + always-on tenant filter
   * - `[]` → tenant only (no owner)
   * - scopes → those scopes instead of owner
   */
  access?: AccessScope | AccessScope[];
  /**
   * Extra QB tweaks after `_select`/`_relations` + access (joins for ACL, etc.).
   * Prefer named scope helpers on the feature service when possible.
   */
  beforeQuery?: <Entity extends ObjectLiteral>(
    qb: SelectQueryBuilder<Entity>,
  ) => void | Promise<void>;
};

/**
 * Single entry point for list/find QueryBuilders.
 *
 * Always applies:
 * 1. Client `_relations` / `_select` (validated; restrictedFields blocked)
 * 2. `tenantId` from RequestContext (when the entity has that column)
 * 3. Default owner scope for non-admins — or caller `access` when provided
 *
 * @example
 * // member: tenant + createdByUserId = me
 * const page = await paginateQuery(
 *   await buildEntityQuery(repo, TASK_QUERY, query),
 *   query.page,
 *   query.limit,
 * );
 *
 * // notifications: tenant + recipientId (replaces owner)
 * await buildEntityQuery(repo, NOTIFICATION_QUERY, query, {
 *   access: { type: "eq", column: "recipientId", value: userId },
 * });
 */
export async function buildEntityQuery<Entity extends ObjectLiteral>(
  repo: Repository<Entity>,
  config: EntityQueryConfig,
  query: ListQueryInput,
  options?: BuildEntityQueryOptions,
): Promise<SelectQueryBuilder<Entity>> {
  const qb = repo.createQueryBuilder(config.alias);
  applyQueryOptions(qb, config, query, repo);

  applyTenantScope(qb, repo, config.alias);
  applyAccessScopes(
    qb,
    config.alias,
    resolveAccessScopes(repo, options?.access),
  );

  if (options?.beforeQuery) {
    await options.beforeQuery(qb);
  }
  return qb;
}

/** Count + page slice + flat `IPaginatedResponse`. */
export async function paginateQuery<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  page: number,
  limit: number,
): Promise<PaginatedRows<Entity>> {
  const total = await qb.getCount();
  const data = await qb.skip(pageOffset(page, limit)).take(limit).getMany();
  return buildPaginatedResponse(data, total, page, limit);
}

/**
 * Lookup key for retrieve / update / delete.
 * - string | number → `id`
 * - object → AND of column equals (e.g. `{ title: "Ship" }`, `{ type: "x" }`)
 */
export type EntityKey = string | number | Record<string, unknown>;

/** Apply EntityKey predicates onto a QueryBuilder (root alias columns only). */
export function applyEntityKey<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  key: EntityKey,
): void {
  if (typeof key === "string" || typeof key === "number") {
    qb.andWhere(`${alias}.id = :__entityKeyId`, { __entityKeyId: key });
    return;
  }

  let i = 0;
  for (const [field, value] of Object.entries(key)) {
    if (value === undefined) continue;
    if (value === null) {
      qb.andWhere(`${alias}.${field} IS NULL`);
      continue;
    }
    const param = `__entityKey_${i++}`;
    qb.andWhere(`${alias}.${field} = :${param}`, { [param]: value });
  }
}

/**
 * Single-row lookup: id or column map + `_relations` / `_select`.
 * Returns null when missing or outside ACL (do not leak existence).
 *
 * @example
 * findOneEntity(repo, TASK_QUERY, id)
 * findOneEntity(repo, USER_QUERY, { email })
 * findOneEntity(repo, TASK_QUERY, { status: ETaskStatus.TODO, assigneeId })
 */
export async function findOneEntity<Entity extends ObjectLiteral>(
  repo: Repository<Entity>,
  config: EntityQueryConfig,
  key: EntityKey,
  query: Pick<ListQueryInput, "_relations" | "_select"> = {},
  options?: BuildEntityQueryOptions,
): Promise<Entity | null> {
  const qb = await buildEntityQuery(
    repo,
    config,
    {
      page: 1,
      limit: 1,
      _relations: query._relations,
      _select: query._select,
    },
    options,
  );
  applyEntityKey(qb, config.alias, key);
  return qb.getOne();
}
