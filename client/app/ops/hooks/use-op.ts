import type { IAuthUser } from "@moon-tailors/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";
import { authKeys } from "~/features/auth/query-keys";
import { canRunOpConfig } from "~/lib/permissions";
import {
  resolveOpQueryKey,
  type MutationOpHandle,
  type OpsBag,
  type OpsStore,
  type QueryOpConfig,
  type QueryOpHandle,
} from "../create-ops";

/** Reactive session user for op permission checks (avoids hooks ↔ useOp cycle). */
function useCachedAuthUser(): IAuthUser | null {
  const qc = useQueryClient();
  return useSyncExternalStore(
    (onChange) =>
      qc.getQueryCache().subscribe((event) => {
        const key = event?.query?.queryKey;
        if (key?.[0] === authKeys.all[0]) onChange();
      }),
    () => qc.getQueryData<IAuthUser | null>(authKeys.session()) ?? null,
    () => null,
  );
}

/** Full ops bag from the Zustand store (stable controllers). */
export function useOps(store: OpsStore): OpsBag {
  return store((s) => s.ops);
}

type QueryOpView = {
  kind: "query";
  allowed: boolean;
  data: unknown;
  error: Error | null;
  isPending: boolean;
  isError: boolean;
  params: Record<string, unknown>;
  setParams: (patch: Record<string, unknown>) => void;
  refetch: () => Promise<unknown>;
  isOpen: boolean;
  payload: unknown;
  open: (payload?: unknown, params?: Record<string, unknown>) => void;
  close: () => void;
};

type MutationOpView = {
  kind: "mutation";
  allowed: boolean;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  isOpen: boolean;
  payload: unknown;
  open: (payload?: unknown) => void;
  close: () => void;
  run: MutationOpHandle["run"];
  /** Alias of run for form submit. */
  submit: MutationOpHandle["run"];
};

export type OpView = QueryOpView | MutationOpView;

/**
 * Live state for one op. Throws if the name is not on this pack.
 * Query data comes from React Query (same key as OpsProvider) — not Zustand.
 * For optional siblings (e.g. Edit on view modal), use `useMaybeOp`.
 */
export function useOp(store: OpsStore, name: string): OpView {
  const def = store.config.ops[name];
  if (!def) {
    throw new Error(`Unknown op "${name}" on ops pack "${store.id}"`);
  }

  const user = useCachedAuthUser();
  const allowed = canRunOpConfig(user, def);

  const params = store(
    useShallow((s) => s.params[name] ?? {}),
  );
  const mutationUi = store(
    useShallow((s) => ({
      handle: s.ops[name],
      mPending: s.mutation[name]?.isPending ?? false,
      mIsError: s.mutation[name]?.isError ?? false,
      mError: s.mutation[name]?.error ?? null,
      isOpen: s.ui.open === name,
      payload: s.ui.open === name ? s.ui.payload : null,
    })),
  );

  const queryKey =
    def.kind === "query"
      ? resolveOpQueryKey(
          store.id,
          name,
          def,
          params,
          mutationUi.isOpen ? mutationUi.payload : undefined,
        )
      : (["ops", store.id, name, "mutation-placeholder"] as const);

  // Shared cache with OpsProvider QueryBridge — enabled:false = observe only.
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (def.kind !== "query") return null;
      return (def as QueryOpConfig).fetch(
        params,
        mutationUi.isOpen ? mutationUi.payload : undefined,
      );
    },
    enabled: false,
  });

  if (def.kind === "query") {
    const q = mutationUi.handle as QueryOpHandle | undefined;
    return {
      kind: "query",
      allowed,
      data: query.data,
      error: query.error instanceof Error ? query.error : null,
      isPending: query.isPending,
      isError: query.isError,
      params,
      setParams: (patch) => store.getState().setParams(name, patch),
      refetch:
        q?.refetch ??
        (async () => {
          /* host not ready */
        }),
      isOpen: mutationUi.isOpen,
      payload: mutationUi.payload,
      open:
        q?.open ??
        ((payload?: unknown, nextParams?: Record<string, unknown>) => {
          if (nextParams && Object.keys(nextParams).length > 0) {
            store.getState().setParams(name, nextParams);
          }
          store.getState().open(name, payload);
        }),
      close: () => {
        if (store.getState().ui.open === name) store.getState().close();
      },
    };
  }

  const m = mutationUi.handle as MutationOpHandle | undefined;
  const run =
    m?.run ??
    (async () => {
      throw new Error(`OpsProvider not mounted for "${name}"`);
    });

  return {
    kind: "mutation",
    allowed,
    isPending: mutationUi.mPending,
    isError: mutationUi.mIsError,
    error: mutationUi.mError,
    isOpen: mutationUi.isOpen,
    payload: mutationUi.payload,
    open: (payload) => store.getState().open(name, payload),
    close: () => {
      if (store.getState().ui.open === name) store.getState().close();
    },
    run,
    submit: run,
  };
}

/**
 * Like `useOp`, but `null` when the op is not on this pack.
 * Safe for foreign packs that only pick a subset of another core.
 */
export function useMaybeOp(store: OpsStore, name: string): OpView | null {
  const def = store.config.ops[name];
  const user = useCachedAuthUser();
  const allowed = def ? canRunOpConfig(user, def) : false;

  const params = store(
    useShallow((s) => s.params[name] ?? {}),
  );
  const mutationUi = store(
    useShallow((s) => ({
      handle: s.ops[name],
      mPending: s.mutation[name]?.isPending ?? false,
      mIsError: s.mutation[name]?.isError ?? false,
      mError: s.mutation[name]?.error ?? null,
      isOpen: s.ui.open === name,
      payload: s.ui.open === name ? s.ui.payload : null,
    })),
  );

  const queryKey =
    def?.kind === "query"
      ? resolveOpQueryKey(
          store.id,
          name,
          def,
          params,
          mutationUi.isOpen ? mutationUi.payload : undefined,
        )
      : (["ops", store.id, name, "mutation-placeholder"] as const);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!def || def.kind !== "query") return null;
      return def.fetch(
        params,
        mutationUi.isOpen ? mutationUi.payload : undefined,
      );
    },
    enabled: false,
  });

  if (!def) return null;

  if (def.kind === "query") {
    const q = mutationUi.handle as QueryOpHandle | undefined;
    return {
      kind: "query",
      allowed,
      data: query.data,
      error: query.error instanceof Error ? query.error : null,
      isPending: query.isPending,
      isError: query.isError,
      params,
      setParams: (patch) => store.getState().setParams(name, patch),
      refetch:
        q?.refetch ??
        (async () => {
          /* host not ready */
        }),
      isOpen: mutationUi.isOpen,
      payload: mutationUi.payload,
      open:
        q?.open ??
        ((payload?: unknown, nextParams?: Record<string, unknown>) => {
          if (nextParams && Object.keys(nextParams).length > 0) {
            store.getState().setParams(name, nextParams);
          }
          store.getState().open(name, payload);
        }),
      close: () => {
        if (store.getState().ui.open === name) store.getState().close();
      },
    };
  }

  const m = mutationUi.handle as MutationOpHandle | undefined;
  const run =
    m?.run ??
    (async () => {
      throw new Error(`OpsProvider not mounted for "${name}"`);
    });

  return {
    kind: "mutation",
    allowed,
    isPending: mutationUi.mPending,
    isError: mutationUi.mIsError,
    error: mutationUi.mError,
    isOpen: mutationUi.isOpen,
    payload: mutationUi.payload,
    open: (payload) => store.getState().open(name, payload),
    close: () => {
      if (store.getState().ui.open === name) store.getState().close();
    },
    run,
    submit: run,
  };
}
