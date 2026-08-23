import { z } from "zod";
import { field } from "../lib/field-meta.js";

export { LIST_QUERY_INTERNAL_KEYS } from "../lib/list-query.constants.js";
export type { TListQueryInternalKey } from "../lib/list-query.constants.js";

/** API error body. */
export const apiErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number().optional(),
  errors: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});

/** Simple `{ message }` result (delete, etc.). */
export const messageResponseSchema = z.object({
  message: z.string(),
});

/**
 * Pagination meta — mirrors Nest PaginationMetaDto.
 * Built by `buildPaginationMeta()`.
 */
export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  lastPage: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

/**
 * Comma-separated or repeated query params → string[].
 * `?_relations=a,b` or `?_relations=a&_relations=b`
 */
export const queryStringArraySchema = z.preprocess((value) => {
  if (value == null || value === "") return undefined;
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}, z.array(z.string()).optional());

/**
 * Shared list query base (page / limit / search / sort / FE-driven joins).
 * Filterable fields use `field()` so the client can auto-build filter bars.
 * Internal keys are `hidden` so they never appear unless explicitly requested.
 *
 * Frontend:
 *   ?page=1&limit=20&search=foo
 *   &_relations=assignee,project
 *   &_select=id,title,assignee.email
 *   &sortBy=createdAt&sortOrder=DESC
 */
export const listQuerySchema = z.object({
  page: field(z.coerce.number().int().min(1).default(1), {
    type: "hidden",
    order: 900,
  }),
  limit: field(z.coerce.number().int().min(1).max(100).default(10), {
    type: "hidden",
    order: 901,
  }),
  search: field(z.string().optional(), {
    type: "text",
    label: "Search",
    placeholder: "Search…",
    order: 1,
  }),
  _relations: field(queryStringArraySchema, {
    type: "hidden",
    order: 910,
  }),
  _select: field(queryStringArraySchema, {
    type: "hidden",
    order: 911,
  }),
  sortBy: field(z.string().optional(), {
    type: "hidden",
    order: 920,
  }),
  sortOrder: field(
    z
      .enum(["ASC", "DESC"])
      .or(z.enum(["asc", "desc"]))
      .transform((v) => v.toUpperCase() as "ASC" | "DESC")
      .optional(),
    { type: "hidden", order: 921 },
  ),
  sortFields: field(queryStringArraySchema, {
    type: "hidden",
    order: 922,
  }),
});

/** Flat paginated envelope (`IPaginatedResponse`). */
export function createPaginatedSchema<TItem extends z.ZodTypeAny>(
  itemSchema: TItem,
) {
  return paginationMetaSchema.extend({
    data: z.array(itemSchema),
  });
}
