import type { ComponentType } from "react";
import type {
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import type { OpPermission } from "~/lib/permissions";
import { create, type StoreApi, type UseBoundStore } from "zustand";

/** Per-op React Query overrides (queryKey / queryFn are owned by OpsProvider). */
export type QueryOpQueryOptions<TResult = unknown> = Omit<
  UseQueryOptions<TResult, Error, TResult, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

/** Per-op React Query overrides (mutationKey / mutationFn are owned by OpsProvider). */
export type MutationOpMutationOptions<
  TResult = unknown,
  TVars = unknown,
> = Omit<
  UseMutationOptions<TResult, Error, TVars>,
  "mutationKey" | "mutationFn"
>;

export type { OpPermission };

/** Shared bag of op controllers (queries + mutations). */
export type OpsBag = Record<string, QueryOpHandle | MutationOpHandle>;

export type QueryOpHandle = {
  kind: "query";
  data: unknown;
  error: Error | null;
  isPending: boolean;
  isError: boolean;
  params: Record<string, unknown>;
  setParams: (patch: Record<string, unknown>) => void;
  refetch: () => Promise<unknown>;
};

export type MutationOpHandle = {
  kind: "mutation";
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  isOpen: boolean;
  payload: unknown;
  open: (payload?: unknown) => void;
  close: () => void;
  run: (
    vars: unknown,
    params?: unknown,
    handlers?: {
      onSuccess?: (result: unknown, vars: unknown, ops: OpsBag) => void;
      onError?: (error: Error, vars: unknown, ops: OpsBag) => void;
    },
  ) => Promise<unknown>;
};

export type OpConfirmProps = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: "destructive" | "default" | "secondary";
  busy: boolean;
  error: string | null;
  vars: unknown;
  onConfirm: () => void;
  onCancel: () => void;
};

export type MutationConfirmConfig = {
  title?: string | ((vars: unknown) => string);
  description?: string | ((vars: unknown) => string);
  confirmLabel?: string | ((vars: unknown) => string);
  cancelLabel?: string;
  tone?: "destructive" | "default" | "secondary";
  /** Custom confirm UI; omit to use the default Confirm dialog. */
  component?: ComponentType<OpConfirmProps>;
};

/**
 * Optional form binding when an op `component` is used as a field control
 * (e.g. user picker inside SchemaForm via `<OpsComponent field={…} />`).
 * List/modal ops ignore this.
 */
export type OpFieldProps<T = unknown> = {
  name?: string;
  value: T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  /**
   * Current option supplied by the owning record. Keeps a selected value
   * renderable when it is outside the query's current page.
   */
  selectedOption?: {
    value: string;
    label: string;
    description?: string;
  };
};

/**
 * Props OpsProvider injects into a **query** op `component`.
 * Only this op’s live state — other ops via `store` + `useOp(store, name)`.
 */
export type QueryOpComponentProps = {
  store: OpsStore;
  data: unknown;
  error: Error | null;
  isPending: boolean;
  isError: boolean;
  params: Record<string, unknown>;
  setParams: (patch: Record<string, unknown>) => void;
  refetch: () => Promise<unknown>;
  /** Present when mounted as a form control via OpsComponent `field`. */
  field?: OpFieldProps;
};

/**
 * Props OpsProvider injects into a **mutation** op `component`.
 * Only this op’s live state — siblings via `store`.
 */
export type MutationOpComponentProps = {
  store: OpsStore;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  isOpen: boolean;
  payload: unknown;
  open: (payload?: unknown) => void;
  close: () => void;
  run: MutationOpHandle["run"];
  submit: MutationOpHandle["run"];
  /** Present when mounted as a form control via OpsComponent `field`. */
  field?: OpFieldProps;
};

export type QueryOpConfig<TResult = unknown, TParams = Record<string, unknown>> =
  {
    kind: "query";
    /** When set, query + component are skipped unless the user has this permission. */
    permission?: OpPermission;
    initialParams?: TParams;
    fetch: (params: TParams) => Promise<TResult>;
    onSuccess?: (
      result: TResult,
      params: TParams,
      ops: OpsBag,
    ) => void;
    onError?: (error: Error, params: TParams, ops: OpsBag) => void;
    /** Per-op TanStack Query options (staleTime, retry, refetchOnWindowFocus, …). */
    queryOptions?: QueryOpQueryOptions<TResult>;
    /**
     * Domain cache key — same API data shares one cache across page packs.
     * Pair with `invalidateKey` (e.g. `taskKeys.list` + `taskKeys.lists()`).
     * Omit for pack-scoped keys `[storeId, opName, params]`.
     */
    queryKey?: (params: TParams) => readonly unknown[];
    /** Prefix for invalidate/refetch — all param variants under this key. */
    invalidateKey?: readonly unknown[];
    /** UI for this query (e.g. list). Gets QueryOpComponentProps. */
    component?: ComponentType<QueryOpComponentProps>;
    /**
     * Auto-mount `component` anywhere OpsProvider is mounted.
     * Default `false` — place via `children({ components })` yourself.
     * Use `true` for global overlays that can open from anywhere on the page.
     */
    auto?: boolean;
  };

export type MutationOpConfig<
  TResult = unknown,
  TVars = unknown,
  TParams = unknown,
> = {
  kind: "mutation";
  /** When set, open/run are blocked unless the user has this permission. */
  permission?: OpPermission;
  mutate: (vars: TVars, params?: TParams) => Promise<TResult>;
  onSuccess?: (
    result: TResult,
    vars: TVars,
    ops: OpsBag,
  ) => void;
  onError?: (error: Error, vars: TVars, ops: OpsBag) => void;
  /** Per-op TanStack Query mutation options (retry, onSettled, meta, …). */
  mutationOptions?: MutationOpMutationOptions<TResult, TVars>;
  /**
   * Optional gate before `mutate` when `run()` is called.
   * - `true` → default Confirm dialog
   * - object → labels (+ optional custom `component`)
   */
  confirm?: boolean | MutationConfirmConfig;
  /** UI for this mutation. Gets MutationOpComponentProps. */
  component?: ComponentType<MutationOpComponentProps>;
  /**
   * Auto-mount `component` with OpsProvider (e.g. modals).
   * Default `false` — place yourself via render map.
   */
  auto?: boolean;
};

export type OpConfig = QueryOpConfig | MutationOpConfig;

export type CreateOpsConfig = {
  id: string;
  /** `page` — host on route; `global` — usable app-wide (host once in layout if needed). */
  scope?: "page" | "global";
  /**
   * Named ops only — UI lives on each op’s `component`
   * (e.g. `listTasks.component = TaskList`).
   */
  ops: Record<string, OpConfig>;
};

export type OpsUiState = {
  open: string | null;
  payload: unknown;
};

export type OpsQuerySlot = {
  data: unknown;
  error: Error | null;
  isPending: boolean;
  isError: boolean;
};

export type OpsMutationSlot = {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
};

export type OpsStoreState = {
  id: string;
  scope: "page" | "global";
  params: Record<string, Record<string, unknown>>;
  ui: OpsUiState;
  query: Record<string, OpsQuerySlot>;
  mutation: Record<string, OpsMutationSlot>;
  ops: OpsBag;
  setParams: (opName: string, patch: Record<string, unknown>) => void;
  open: (opName: string, payload?: unknown) => void;
  close: () => void;
  _patchQuery: (opName: string, slot: Partial<OpsQuerySlot>) => void;
  _patchMutation: (opName: string, slot: Partial<OpsMutationSlot>) => void;
  _setOps: (ops: OpsBag) => void;
};

export type OpsStore = UseBoundStore<StoreApi<OpsStoreState>> &
  StoreApi<OpsStoreState> & {
    id: string;
    scope: "page" | "global";
    config: CreateOpsConfig;
  };

function emptyQuerySlot(): OpsQuerySlot {
  return {
    data: undefined,
    error: null,
    isPending: true,
    isError: false,
  };
}

function emptyMutationSlot(): OpsMutationSlot {
  return {
    isPending: false,
    isError: false,
    error: null,
  };
}

export function resolveConfirmText(
  value: string | ((vars: unknown) => string) | undefined,
  vars: unknown,
  fallback: string,
): string {
  if (value == null) return fallback;
  return typeof value === "function" ? value(vars) : value;
}

export function normalizeConfirmConfig(
  confirm: boolean | MutationConfirmConfig | undefined,
): MutationConfirmConfig | null {
  if (!confirm) return null;
  if (confirm === true) return {};
  return confirm;
}

/**
 * Create a Zustand-backed ops pack (queries + mutations).
 * Mount `<OpsProvider store={…} />` so React Query stays in sync.
 */
export function createOps(config: CreateOpsConfig): OpsStore {
  const scope = config.scope ?? "page";
  const params: Record<string, Record<string, unknown>> = {};
  const query: Record<string, OpsQuerySlot> = {};
  const mutation: Record<string, OpsMutationSlot> = {};

  for (const [name, op] of Object.entries(config.ops)) {
    if (op.kind === "query") {
      params[name] = {
        ...((op.initialParams as Record<string, unknown> | undefined) ?? {}),
      };
      query[name] = emptyQuerySlot();
    } else {
      mutation[name] = emptyMutationSlot();
    }
  }

  const base = create<OpsStoreState>((set, get) => ({
    id: config.id,
    scope,
    params,
    ui: { open: null, payload: null },
    query,
    mutation,
    ops: {},
    setParams: (opName, patch) => {
      set((s) => {
        const next = { ...s.params[opName], ...patch };
        // `undefined` means "remove this key" so filters can clear under merge semantics.
        for (const key of Object.keys(patch)) {
          if (patch[key] === undefined) delete next[key];
        }
        return {
          params: {
            ...s.params,
            [opName]: next,
          },
        };
      });
    },
    open: (opName, payload = null) => {
      set({ ui: { open: opName, payload } });
    },
    close: () => {
      set({ ui: { open: null, payload: null } });
    },
    _patchQuery: (opName, slot) => {
      set((s) => ({
        query: {
          ...s.query,
          [opName]: {
            ...emptyQuerySlot(),
            ...s.query[opName],
            ...slot,
          },
        },
      }));
    },
    _patchMutation: (opName, slot) => {
      set((s) => ({
        mutation: {
          ...s.mutation,
          [opName]: {
            ...emptyMutationSlot(),
            ...s.mutation[opName],
            ...slot,
          },
        },
      }));
    },
    _setOps: (ops) => set({ ops }),
  }));

  const store = Object.assign(base, {
    id: config.id,
    scope,
    config,
  }) as OpsStore;

  return store;
}

export function queryKey(storeId: string, opName: string, params: unknown) {
  return [storeId, opName, params] as const;
}

/** Pack-scoped key — default when op has no domain `queryKey`. */
export const packQueryKey = queryKey;

/** Resolved React Query cache key for a query op. */
export function resolveOpQueryKey(
  storeId: string,
  opName: string,
  op: QueryOpConfig,
  params: unknown,
): readonly unknown[] {
  if (op.queryKey) {
    return op.queryKey(params as Record<string, unknown>);
  }
  return packQueryKey(storeId, opName, params);
}

/** Prefix for invalidateQueries / refetchOp. */
export function resolveOpInvalidateKey(
  storeId: string,
  opName: string,
  op: QueryOpConfig,
): readonly unknown[] {
  if (op.invalidateKey) return op.invalidateKey;
  return [storeId, opName];
}
