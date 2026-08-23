import type {
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { parseSortFields, toStringArray } from "./parse-query";
import {
  assertRelationPaths,
  assertSelectablePaths,
  relationPrefixesFromPaths,
} from "./path-validation";
import type {
  EntityQueryConfig,
  FilterSpec,
  ListQueryInput,
  ParsedSort,
} from "./entity-query.types";

/**
 * Apply client `_relations` / `_select` (any real path), search, filters, sort.
 * Unknown paths and `restrictedFields` throw `BadRequestException`.
 *
 * Nested paths work for search / filters / sort, e.g. `sender.firstName`,
 * `participants.user.email` — required relation joins are added automatically.
 */
export function applyQueryOptions<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  config: EntityQueryConfig,
  query: ListQueryInput,
  repo: Repository<Entity>,
): SelectQueryBuilder<Entity> {
  const alias = config.alias;
  const requestedRelations = normalizePaths(query._relations);
  const requestedSelect = normalizePaths(query._select);

  if (requestedSelect.length) {
    assertSelectablePaths(repo, requestedSelect, config.restrictedFields);
  }
  if (requestedRelations.length) {
    assertRelationPaths(repo, requestedRelations);
  }

  const sorts = parseSortFields(
    query.sortFields,
    query.sortBy,
    query.sortOrder,
    config.sortable,
    config.defaultSort,
  );

  const selectRelations = uniquePaths([
    ...requestedRelations,
    ...relationPrefixesFromPaths(requestedSelect),
  ]);
  const predicateRelations = relationPrefixesFromPaths([
    ...(config.searchable ?? []),
    ...activeFilterColumns(query, config.filters),
    ...sorts.map((s) => s.field),
  ]);
  if (predicateRelations.length) {
    assertRelationPaths(repo, predicateRelations);
  }

  const allRelations = uniquePaths([
    ...selectRelations,
    ...predicateRelations,
  ]);

  const selective = requestedSelect.length > 0;
  applyRelations(
    qb,
    alias,
    allRelations,
    selective ? null : new Set(selectRelations),
  );
  if (selective) {
    applySelect(qb, alias, requestedSelect, allRelations);
  }

  applySoftDeleteScope(qb, alias, config);

  applySearch(qb, alias, query.search, config.searchable);
  applyDeclaredFilters(qb, alias, query, config.filters);
  applySort(qb, alias, sorts);

  return qb;
}

function normalizePaths(raw: string[] | undefined): string[] {
  if (!raw?.length) return [];
  return uniquePaths(
    raw.map((p) => String(p).trim()).filter(Boolean),
  );
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}

/** Filter `column` values that are present on this request. */
function activeFilterColumns(
  query: ListQueryInput,
  filters: Record<string, FilterSpec> | undefined,
): string[] {
  if (!filters) return [];
  const cols: string[] = [];
  for (const [key, spec] of Object.entries(filters)) {
    const raw = query[key];
    if (raw === undefined || raw === null || raw === "") continue;
    cols.push(spec.column);
  }
  return cols;
}

/** Soft-delete scope: active-only | all | deleted-only. */
function applySoftDeleteScope<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  config: EntityQueryConfig,
): void {
  if (config.includeDeleted === true) return;

  if (config.deletedOnly === true) {
    qb.andWhere(`${alias}.deletedAt IS NOT NULL`);
    return;
  }

  if (config.excludeDeleted !== false) {
    qb.andWhere(`${alias}.deletedAt IS NULL`);
  }
}

/**
 * Join relation paths.
 * - `selectPaths === null` → leftJoin only (selective `_select` mode)
 * - `selectPaths` Set → leftJoinAndSelect when the path is under a selected relation
 */
function applyRelations<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  relations: string[],
  selectPaths: Set<string> | null,
): void {
  const joined = new Set<string>();
  for (const path of relations) {
    const parts = path.split(".");
    let parent = alias;
    let accum = "";
    for (const part of parts) {
      accum = accum ? `${accum}.${part}` : part;
      if (joined.has(accum)) {
        parent = joinAliasFor(accum);
        continue;
      }
      const joinAlias = joinAliasFor(accum);
      const joinAndSelect =
        selectPaths != null && relationIsSelected(accum, selectPaths);
      if (joinAndSelect) {
        qb.leftJoinAndSelect(`${parent}.${part}`, joinAlias);
      } else {
        qb.leftJoin(`${parent}.${part}`, joinAlias);
      }
      joined.add(accum);
      parent = joinAlias;
    }
  }
}

function relationIsSelected(path: string, selectPaths: Set<string>): boolean {
  if (!selectPaths.size) return false;
  for (const selected of selectPaths) {
    if (
      selected === path ||
      selected.startsWith(`${path}.`) ||
      path.startsWith(`${selected}.`)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Nested relation join aliases (vivast-style):
 * `participants` → `participants`
 * `participants.user` → `participants_user`
 */
export function joinAliasFor(path: string): string {
  return path.replaceAll(".", "_");
}

/**
 * Map a dotted path to QueryBuilder column ref.
 * `title` → `task.title`
 * `sender.firstName` → `sender.firstName`
 * `participants.user.email` → `participants_user.email`
 */
export function columnRefForPath(rootAlias: string, path: string): string {
  if (!path.includes(".")) return `${rootAlias}.${path}`;
  const parts = path.split(".");
  const column = parts[parts.length - 1]!;
  const relPath = parts.slice(0, -1).join(".");
  return `${joinAliasFor(relPath)}.${column}`;
}

/**
 * Map a `_select` path onto root or a joined relation.
 * Prefers the longest matching relation prefix:
 * `participants.user.firstName` → alias `participants_user`, column `firstName`.
 */
function resolveSelectPath(
  path: string,
  relations: string[],
):
  | { kind: "root"; field: string }
  | { kind: "relation"; relPath: string; field: string }
  | null {
  if (!path.includes(".")) return { kind: "root", field: path };

  const sorted = [...relations].sort((a, b) => b.length - a.length);
  for (const rel of sorted) {
    if (!path.startsWith(`${rel}.`)) continue;
    const field = path.slice(rel.length + 1);
    if (!field || field.includes(".")) continue;
    return { kind: "relation", relPath: rel, field };
  }
  return null;
}

function applySelect<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  select: string[],
  relations: string[],
): void {
  const rootFields = new Set<string>(["id"]);
  const relationFields = new Map<string, Set<string>>();

  for (const path of select) {
    const resolved = resolveSelectPath(path, relations);
    if (!resolved) continue;
    if (resolved.kind === "root") {
      rootFields.add(resolved.field);
      continue;
    }
    const set =
      relationFields.get(resolved.relPath) ?? new Set<string>(["id"]);
    set.add(resolved.field);
    relationFields.set(resolved.relPath, set);
  }

  qb.select([...rootFields].map((f) => `${alias}.${f}`));

  for (const [rel, fields] of relationFields) {
    const joinAlias = joinAliasFor(rel);
    for (const field of fields) {
      qb.addSelect(`${joinAlias}.${field}`);
    }
  }
}

function applySearch<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  search: string | undefined,
  searchable: readonly string[] | undefined,
): void {
  if (!search?.trim() || !searchable?.length) return;
  const q = `%${search.trim().toLowerCase()}%`;
  const parts = searchable.map((col, i) =>
    searchPredicate(alias, col, `eq_search_${i}`),
  );
  const params: Record<string, string> = {};
  searchable.forEach((_, i) => {
    params[`eq_search_${i}`] = q;
  });
  qb.andWhere(`(${parts.join(" OR ")})`, params);
}

/**
 * `sender.firstName` → LOWER(sender.firstName) LIKE …
 * `participants.user.fullName` → CONCAT(firstName, lastName) LIKE … (vivast-style)
 */
function searchPredicate(
  rootAlias: string,
  path: string,
  param: string,
): string {
  if (path.endsWith(".fullName")) {
    const relPath = path.slice(0, -".fullName".length);
    const joinAlias = joinAliasFor(relPath);
    return `LOWER(TRIM(CONCAT(COALESCE(${joinAlias}.firstName, ''), ' ', COALESCE(${joinAlias}.lastName, '')))) LIKE :${param}`;
  }
  return `LOWER(${columnRefForPath(rootAlias, path)}) LIKE :${param}`;
}

function applyDeclaredFilters<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  query: ListQueryInput,
  filters: Record<string, FilterSpec> | undefined,
): void {
  if (!filters) return;
  let i = 0;
  for (const [key, spec] of Object.entries(filters)) {
    const raw = query[key];
    if (raw === undefined || raw === null || raw === "") continue;
    applyFilter(qb, alias, spec, raw, `eq_filter_${i++}`);
  }
}

function applyFilter<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  spec: FilterSpec,
  raw: unknown,
  param: string,
): void {
  const column = columnRefForPath(alias, spec.column);
  switch (spec.type) {
    case "eq":
      qb.andWhere(`${column} = :${param}`, { [param]: raw });
      return;
    case "eqi":
      qb.andWhere(`LOWER(${column}) = LOWER(:${param})`, {
        [param]: String(raw),
      });
      return;
    case "in": {
      const values = toStringArray(raw);
      if (!values.length) return;
      qb.andWhere(`${column} IN (:...${param})`, {
        [param]: values,
      });
      return;
    }
    case "between": {
      const [from, to] = toStringArray(raw);
      if (from && to) {
        qb.andWhere(
          `${column} BETWEEN :${param}_from AND :${param}_to`,
          {
            [`${param}_from`]: from,
            [`${param}_to`]: to,
          },
        );
      } else if (from) {
        qb.andWhere(`${column} >= :${param}`, { [param]: from });
      } else if (to) {
        qb.andWhere(`${column} <= :${param}`, { [param]: to });
      }
      return;
    }
    case "bool": {
      const truthy =
        raw === true || raw === "true" || raw === "1" || raw === 1;
      const falsy =
        raw === false || raw === "false" || raw === "0" || raw === 0;
      if (!truthy && !falsy) return;
      qb.andWhere(`${column} = :${param}`, {
        [param]: truthy,
      });
      return;
    }
    default:
      return;
  }
}

function applySort<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  sorts: ParsedSort[],
): void {
  for (let i = 0; i < sorts.length; i += 1) {
    const { field, order } = sorts[i]!;
    const column = columnRefForPath(alias, field);
    if (i === 0) qb.orderBy(column, order);
    else qb.addOrderBy(column, order);
  }
}
