/**
 * List-query keys that are not filter UI (pagination / joins / sort plumbing).
 * Kept separate from Zod schemas to avoid circular imports with `field()`.
 */
export const LIST_QUERY_INTERNAL_KEYS = [
  "page",
  "limit",
  "_relations",
  "_select",
  "sortBy",
  "sortOrder",
  "sortFields",
] as const;

export type TListQueryInternalKey = (typeof LIST_QUERY_INTERNAL_KEYS)[number];
