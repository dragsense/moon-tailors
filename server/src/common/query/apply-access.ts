import { Brackets, type ObjectLiteral, type SelectQueryBuilder } from "typeorm";
import type { AccessScope } from "./entity-query.types";

let scopeParamSeq = 0;

function nextParam(prefix: string): string {
  scopeParamSeq += 1;
  return `${prefix}_${scopeParamSeq}`;
}

/**
 * Apply row-level access scopes (AND between items).
 * Tenant isolation is applied separately via `applyTenantScope` — not here.
 *
 * @example
 * { type: "owner", userId }                    // createdByUserId (default)
 * { type: "eq", column: "recipientId", value: userId }
 * { type: "or", scopes: [
 *     { type: "owner", userId },
 *     { type: "eq", column: "assigneeId", value: userId },
 *   ]}
 */
export function applyAccessScopes<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  scopes: AccessScope | AccessScope[] | undefined,
): SelectQueryBuilder<Entity> {
  if (!scopes) return qb;
  const list = Array.isArray(scopes) ? scopes : [scopes];
  for (const scope of list) {
    applyScopeToQb(qb, alias, scope);
  }
  return qb;
}

function applyScopeToQb<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  scope: AccessScope,
): void {
  if (scope.type === "custom") {
    scope.apply(qb, alias);
    return;
  }

  if (scope.type === "or") {
    if (!scope.scopes.length) return;
    qb.andWhere(
      new Brackets((where) => {
        for (const child of scope.scopes) {
          if (child.type === "custom") {
            child.apply(
              where as unknown as SelectQueryBuilder<Entity>,
              alias,
            );
            continue;
          }
          if (child.type === "or") {
            applyScopeToQb(
              where as unknown as SelectQueryBuilder<Entity>,
              alias,
              child,
            );
            continue;
          }
          const { sql, params } = leafCondition(alias, child);
          where.orWhere(sql, params);
        }
      }),
    );
    return;
  }

  const { sql, params } = leafCondition(alias, scope);
  qb.andWhere(sql, params);
}

function leafCondition(
  alias: string,
  scope: Exclude<AccessScope, { type: "or" } | { type: "custom" }>,
): { sql: string; params: Record<string, unknown> } {
  switch (scope.type) {
    case "owner": {
      const column = scope.column ?? "createdByUserId";
      const param = nextParam("owner");
      return {
        sql: `${alias}.${column} = :${param}`,
        params: { [param]: scope.userId },
      };
    }
    case "eq": {
      const param = scope.param ?? nextParam("eq");
      return {
        sql: `${alias}.${scope.column} = :${param}`,
        params: { [param]: scope.value },
      };
    }
    case "in": {
      const param = scope.param ?? nextParam("in");
      if (!scope.values.length) {
        return { sql: "1 = 0", params: {} };
      }
      return {
        sql: `${alias}.${scope.column} IN (:...${param})`,
        params: { [param]: scope.values },
      };
    }
    default:
      return { sql: "1 = 1", params: {} };
  }
}
