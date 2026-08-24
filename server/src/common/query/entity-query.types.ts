import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import type {
  IPaginatedResponse,
  TListFilterSpec,
} from "@moon-tailors/contracts";

/** Shared list-query fields (from contracts `listQuerySchema`). */
export type ListQueryInput = {
  page: number;
  limit: number;
  search?: string;
  _relations?: string[];
  _select?: string[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  sortFields?: string[];
  [key: string]: unknown;
};

export type SortOrder = "ASC" | "DESC";

export type ParsedSort = { field: string; order: SortOrder };

/**
 * How a query-string filter maps onto a column.
 * Prefer declaring `filter: "eq"` on the list Zod schema and using
 * `filtersFromListSchema` instead of hand-writing these.
 */
export type FilterSpec = TListFilterSpec;

/**
 * Per-entity query config.
 *
 * Clients may request any real column/relation via `_select` / `_relations`.
 * Unknown paths throw `BadRequestException`. Secrets go in `restrictedFields`
 * (exact match or prefix, e.g. `password` blocks `password` and `user.password`).
 */
export type EntityQueryConfig = {
  /** QueryBuilder root alias, e.g. `"user"`. */
  alias: string;
  /**
   * Fields clients must not request via `_select` (and relation prefixes).
   * Example: `["passwordHash", "keyHash"]` or `["user.passwordHash"]`.
   */
  restrictedFields?: readonly string[];
  /**
   * Fields allowed in `sortBy` / `sortFields`.
   * Nested OK: `sender.firstName`, `participants.user.email`.
   */
  sortable?: readonly string[];
  defaultSort?: ParsedSort;
  /**
   * Columns used by `search` (case-insensitive LIKE, OR).
   * Nested OK: `["title", "sender.firstName", "participants.user.email"]`.
   * Virtual: `participants.user.fullName` → CONCAT(firstName, lastName).
   * Relation joins are added automatically.
   */
  searchable?: readonly string[];
  /**
   * Domain filters from the query object (status, assigneeId, …).
   * Prefer `filtersFromListSchema(…)` — set `filterColumn: "sender.firstName"`
   * for nested paths. Joins are automatic when the filter is present.
   */
  filters?: Record<string, FilterSpec>;
  /**
   * Soft-delete scope:
   * - default / `excludeDeleted: true` → `deletedAt IS NULL`
   * - `includeDeleted: true` → no deletedAt filter (active + deleted)
   * - `deletedOnly: true` → `deletedAt IS NOT NULL` (ignored when `includeDeleted`)
   */
  excludeDeleted?: boolean;
  includeDeleted?: boolean;
  deletedOnly?: boolean;
  /**
   * When true, `EntityService.list` returns all matching rows (no skip/take).
   * Still wraps in flat `IPaginatedResponse` (`page=1`, `limit=total`).
   */
  skipPagination?: boolean;
};

/**
 * Row-level access control applied AFTER filters + tenant scope.
 * Compose with arrays (AND). Use `{ type: "or", scopes }` for OR groups.
 *
 * Tenant isolation (`tenantId`) is always applied by `buildEntityQuery` when
 * the column exists — not represented here.
 *
 * Default (when `access` is omitted): STAFF / MEMBER are scoped to `owner`
 * (`createdByUserId`). PLATFORM_OWNER, SUPER_ADMIN, and business ADMIN skip
 * owner (tenantId filter is enough). Pass `access` to replace that.
 */
export type AccessScope =
  | { type: "owner"; column?: string; userId: string }
  | { type: "eq"; column: string; value: unknown; param?: string }
  | { type: "in"; column: string; values: unknown[]; param?: string }
  | { type: "or"; scopes: AccessScope[] }
  | {
      type: "custom";
      apply: <Entity extends ObjectLiteral>(
        qb: SelectQueryBuilder<Entity>,
        alias: string,
      ) => void;
    };

/** Alias of contracts flat `IPaginatedResponse`. */
export type PaginatedRows<Entity> = IPaginatedResponse<Entity>;
