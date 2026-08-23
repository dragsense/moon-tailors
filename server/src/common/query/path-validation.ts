import { BadRequestException } from "@nestjs/common";
import type { EntityMetadata, ObjectLiteral, Repository } from "typeorm";

/**
 * Exact / prefix / nested suffix match.
 * `passwordHash` blocks `passwordHash`, `user.passwordHash`, `a.b.passwordHash`.
 */
export function isRestrictedField(
  path: string,
  restricted: readonly string[] | undefined,
): boolean {
  if (!restricted?.length) return false;
  return restricted.some((blocked) => {
    if (path === blocked || path.startsWith(`${blocked}.`)) return true;
    if (path.endsWith(`.${blocked}`)) return true;
    return path.includes(`.${blocked}.`);
  });
}

/**
 * Walk TypeORM metadata for `a.b.c` — each segment except the last must be a
 * relation; the last may be a column or relation.
 */
export function pathExistsOnEntity<Entity extends ObjectLiteral>(
  repo: Repository<Entity>,
  path: string,
  kind: "select" | "relation",
): boolean {
  const parts = path.split(".").filter(Boolean);
  if (!parts.length) return false;

  let meta: EntityMetadata = repo.metadata;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]!;
    const isLast = i === parts.length - 1;

    if (isLast) {
      if (kind === "relation") {
        return meta.findRelationWithPropertyPath(part) != null;
      }
      return (
        meta.findColumnWithPropertyName(part) != null ||
        meta.findRelationWithPropertyPath(part) != null
      );
    }

    const rel = meta.findRelationWithPropertyPath(part);
    if (!rel) return false;
    meta = rel.inverseEntityMetadata;
  }
  return false;
}

export function assertSelectablePaths<Entity extends ObjectLiteral>(
  repo: Repository<Entity>,
  paths: string[],
  restricted: readonly string[] | undefined,
): void {
  for (const path of paths) {
    if (isRestrictedField(path, restricted)) {
      throw new BadRequestException(`Field "${path}" is restricted`);
    }
    if (!pathExistsOnEntity(repo, path, "select")) {
      throw new BadRequestException(`Unknown field "${path}"`);
    }
  }
}

export function assertRelationPaths<Entity extends ObjectLiteral>(
  repo: Repository<Entity>,
  paths: string[],
): void {
  for (const path of paths) {
    if (!pathExistsOnEntity(repo, path, "relation")) {
      throw new BadRequestException(`Unknown relation "${path}"`);
    }
  }
}

/**
 * Relation prefixes implied by dotted column paths.
 * `sender.firstName` → `sender`
 * `participants.user.email` → `participants`, `participants.user`
 *
 * Used for `_select`, searchable, filter columns, and sort fields.
 */
export function relationPrefixesFromPaths(
  paths: readonly string[] | undefined,
): string[] {
  if (!paths?.length) return [];
  const out = new Set<string>();
  for (const path of paths) {
    if (!path.includes(".")) continue;
    const parts = path.split(".");
    // Drop the trailing column segment; keep nested relation path.
    const relParts = parts.slice(0, -1);
    for (let i = 1; i <= relParts.length; i += 1) {
      out.add(relParts.slice(0, i).join("."));
    }
  }
  return [...out];
}

/** @deprecated Prefer `relationPrefixesFromPaths`. */
export function relationPrefixesFromSelect(select: string[]): string[] {
  return relationPrefixesFromPaths(select);
}
