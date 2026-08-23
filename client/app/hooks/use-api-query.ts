import { useMemo, useState } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

/** Paginated/list params helper — extend per feature as needed. */
export type QueryParams = Record<string, unknown>;

type KeyedQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

/**
 * TanStack Query wrapper with local params state.
 * Prefer ops packs for feature screens; use this for one-off list queries.
 */
export function useApiQuery<TData>(
  queryKey: string | readonly unknown[],
  queryFn: (params: QueryParams) => Promise<TData>,
  initialParams: QueryParams = {},
  options?: KeyedQueryOptions<TData>,
) {
  const [params, setParams] = useState(initialParams);

  const memoizedQueryKey = useMemo(
    () => [...(Array.isArray(queryKey) ? queryKey : [queryKey]), params] as const,
    [queryKey, params],
  );

  const query = useQuery({
    queryKey: memoizedQueryKey,
    queryFn: () => queryFn(params),
    ...options,
  });

  const setQueryParams = (patch: QueryParams) => {
    setParams((prev) => ({ ...prev, ...patch }));
  };

  return {
    ...query,
    params,
    setParams: setQueryParams,
    setQueryParams,
  };
}

/**
 * Fixed-key query — session, ops bridges, and other non-param fetches.
 */
export function useApiQueryKeyed<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: KeyedQueryOptions<TData>,
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}
