import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

type ApiFunction<TData, TVariables> = (
  variables: TVariables,
) => Promise<TData>;

/**
 * Thin mutation wrapper.
 * Prefer ops packs for feature mutations; use this for one-off forms.
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: ApiFunction<TData, TVariables>,
  options?: UseMutationOptions<TData, Error, TVariables>,
): UseMutationResult<TData, Error, TVariables> {
  return useMutation({
    mutationFn,
    ...options,
  });
}

/**
 * Mutation with a stable key — used by ops bridges.
 */
export function useApiMutationKeyed<TData = unknown, TVariables = unknown>(
  mutationKey: readonly unknown[],
  mutationFn: ApiFunction<TData, TVariables>,
  options?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    "mutationKey" | "mutationFn"
  >,
): UseMutationResult<TData, Error, TVariables> {
  return useMutation({
    mutationKey,
    mutationFn,
    ...options,
  });
}
