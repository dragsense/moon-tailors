import { useShallow } from "zustand/react/shallow";
import { canRunOpConfig } from "~/lib/permissions";
import { useSession } from "~/features/auth/hooks";
import type {
  MutationOpHandle,
  OpsBag,
  OpsStore,
  QueryOpHandle,
} from "../create-ops";

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

function readOpView(store: OpsStore, name: string, allowed: boolean): OpView {
  const def = store.config.ops[name]!;
  const ops = store.getState().ops;
  const handle = ops[name];

  if (def.kind === "query") {
    const slot = store.getState().query[name];
    const params = store.getState().params[name] ?? {};
    const q = handle as QueryOpHandle | undefined;
    return {
      kind: "query",
      allowed,
      data: slot?.data,
      error: slot?.error ?? null,
      isPending: slot?.isPending ?? true,
      isError: slot?.isError ?? false,
      params,
      setParams: (patch) => store.getState().setParams(name, patch),
      refetch:
        q?.refetch ??
        (async () => {
          /* host not ready */
        }),
    };
  }

  const slot = store.getState().mutation[name];
  const ui = store.getState().ui;
  const m = handle as MutationOpHandle | undefined;
  const run =
    m?.run ??
    (async () => {
      throw new Error(`OpsProvider not mounted for "${name}"`);
    });

  return {
    kind: "mutation",
    allowed,
    isPending: slot?.isPending ?? false,
    isError: slot?.isError ?? false,
    error: slot?.error ?? null,
    isOpen: ui.open === name,
    payload: ui.open === name ? ui.payload : null,
    open: (payload) => store.getState().open(name, payload),
    close: () => {
      if (store.getState().ui.open === name) store.getState().close();
    },
    run,
    submit: run,
  };
}

/** One shallow subscription for slices that affect this op’s view. */
function useOpSubscription(store: OpsStore, name: string) {
  store(
    useShallow((s) => {
      const q = s.query[name];
      const m = s.mutation[name];
      return {
        handle: s.ops[name],
        qData: q?.data,
        qError: q?.error,
        qPending: q?.isPending,
        qIsError: q?.isError,
        mPending: m?.isPending,
        mIsError: m?.isError,
        mError: m?.error,
        isOpen: s.ui.open === name,
        payload: s.ui.open === name ? s.ui.payload : null,
        params: s.params[name],
      };
    }),
  );
}

/**
 * Live state for one op. Throws if the name is not on this pack.
 * For optional siblings (e.g. Edit on view modal), use `useMaybeOp`.
 */
export function useOp(store: OpsStore, name: string): OpView {
  const def = store.config.ops[name];
  if (!def) {
    throw new Error(`Unknown op "${name}" on ops pack "${store.id}"`);
  }

  const session = useSession();
  const allowed = canRunOpConfig(session?.user, def);

  useOpSubscription(store, name);
  return readOpView(store, name, allowed);
}

/**
 * Like `useOp`, but `null` when the op is not on this pack.
 * Safe for foreign packs that only pick a subset of another core.
 */
export function useMaybeOp(store: OpsStore, name: string): OpView | null {
  const def = store.config.ops[name];
  const session = useSession();
  const allowed = def ? canRunOpConfig(session?.user, def) : false;

  useOpSubscription(store, name);
  if (!def) return null;
  return readOpView(store, name, allowed);
}
