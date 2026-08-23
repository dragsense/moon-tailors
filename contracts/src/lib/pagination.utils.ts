import type {
  IPaginatedResponse,
  IPaginationMeta,
} from "../common/interface.js";

/** Shared pagination helpers for API and UI. */

export interface IPageParams {
  page: number;
  limit: number;
}

export function normalizePageParams(
  page?: number,
  limit?: number,
  maxLimit = 100,
): IPageParams {
  const safePage =
    Number.isFinite(page) && (page as number) > 0
      ? Math.floor(page as number)
      : 1;
  const rawLimit =
    Number.isFinite(limit) && (limit as number) > 0
      ? Math.floor(limit as number)
      : 10;
  return {
    page: safePage,
    limit: Math.min(rawLimit, maxLimit),
  };
}

/** Build `IPaginationMeta` / list pagination fields. */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): IPaginationMeta {
  const safeLimit = Math.max(limit, 1);
  const lastPage = Math.max(1, Math.ceil(total / safeLimit));
  return {
    total,
    page,
    limit,
    lastPage,
    hasNextPage: page < lastPage,
    hasPrevPage: page > 1,
  };
}

/** Flat `IPaginatedResponse` envelope. */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): IPaginatedResponse<T> {
  return {
    data,
    ...buildPaginationMeta(total, page, limit),
  };
}

export function pageOffset(page: number, limit: number): number {
  return (Math.max(page, 1) - 1) * Math.max(limit, 1);
}
