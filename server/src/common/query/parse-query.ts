import type { ParsedSort, SortOrder } from "./entity-query.types";

export function parseSortFields(
  sortFields: string[] | undefined,
  sortBy: string | undefined,
  sortOrder: SortOrder | undefined,
  allowlist: readonly string[] | undefined,
  fallback?: ParsedSort,
): ParsedSort[] {
  const allowed = allowlist ? new Set(allowlist) : null;
  const fromFields: ParsedSort[] = [];

  for (const raw of sortFields ?? []) {
    const [fieldRaw, orderRaw] = raw.split(":");
    const field = fieldRaw?.trim();
    if (!field) continue;
    if (allowed && !allowed.has(field)) continue;
    const order = (orderRaw?.trim().toUpperCase() === "ASC" ? "ASC" : "DESC") as SortOrder;
    fromFields.push({ field, order });
  }

  if (fromFields.length) return fromFields;

  if (sortBy && (!allowed || allowed.has(sortBy))) {
    return [{ field: sortBy, order: sortOrder ?? "DESC" }];
  }

  return fallback ? [fallback] : [];
}

/** Split comma / array query values into a string[]. */
export function toStringArray(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
