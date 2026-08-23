import type { z } from "zod";
import {
  apiErrorSchema,
  messageResponseSchema,
  paginationMetaSchema,
} from "./schema.js";

/** Response / entity interfaces from common schemas. */
export interface IApiError extends z.infer<typeof apiErrorSchema> {}

export interface IMessageResponse
  extends z.infer<typeof messageResponseSchema> {}

/** Pagination fields (`IPaginationMeta`). */
export interface IPaginationMeta
  extends z.infer<typeof paginationMetaSchema> {}

/**
 * Flat paginated list (`IPaginatedResponse`).
 * `{ data, total, page, limit, lastPage, hasNextPage, hasPrevPage }`
 */
export interface IPaginatedResponse<T> extends IPaginationMeta {
  data: T[];
}
