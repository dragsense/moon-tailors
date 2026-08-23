import { useQueryClient } from "@tanstack/react-query";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  type ComponentType,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useApiMutationKeyed, useApiQueryKeyed, useConfirm } from "~/hooks";
import type {
  MutationOpComponentProps,
  MutationOpConfig,
  MutationOpHandle,
  OpsBag,
  OpsStore,
  QueryOpComponentProps,
  QueryOpConfig,
  QueryOpHandle,
} from "../create-ops";
import {
  normalizeConfirmConfig,
  resolveOpInvalidateKey,
  resolveOpQueryKey,
  resolveConfirmText,
} from "../create-ops";
import { useOp } from "../hooks";
import { isOpAllowed } from "../op-permission";

type RunHandlers = {
  onSuccess?: (result: unknown, vars: unknown, ops: OpsBag) => void;
  onError?: (error: Error, vars: unknown, ops: OpsBag) => void;
};

type RunFn = (
  vars: unknown,
  params?: unknown,
  handlers?: RunHandlers,
) => Promise<unknown>;

/** Place op UIs freely (two columns, sections, …) — like SchemaForm `fields`. */
export type OpsRenderCtx = {
  /**
   * Op name → node for ops with a `component`.
   * Prefer placing **non-`auto`** ones here; `auto: true` ops are mounted for you.
   */
  components: Record<string, ReactNode>;
  store: OpsStore;
};

export type OpsProviderProps = {
  store: OpsStore;
  /**
   * Custom layout for non-auto op UIs (lists, page blocks).
   * Ops with `auto: true` always mount regardless.
   */
  children?: (ctx: OpsRenderCtx) => ReactNode;
};

/**
 * Wires React Query + confirms into an ops store.
 *
 * Per-op `auto` (default false):
 *   createTask: { component: Modal, auto: true }  // mounts with provider
 *   listTasks:  { component: List }               // place via children
 *
 * @example
 * // list placed here; createTask modal auto-mounted
 * <OpsProvider store={tasksOps}>
 *   {({ components }) => components.listTasks}
 * </OpsProvider>
 *
 * // RQ + auto modals only (page body is yours)
 * <OpsProvider store={tasksOps} />
 * <CreateTask />
 */
export function OpsProvider({ store, children }: OpsProviderProps) {
  const qc = useQueryClient();
  const runFns = useRef<Record<string, RunFn>>({});
  const { confirm, ConfirmDialog } = useConfirm();
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;

  const opsConfig = store.config.ops;
  const opNames = useMemo(() => Object.keys(opsConfig), [opsConfig]);

  const opsBag = useMemo(() => {
    const bag = {} as OpsBag;
    for (const name of opNames) {
      const def = opsConfig[name];
      if (def.kind === "query") {
        bag[name] = {
          kind: "query",
          get data() {
            return store.getState().query[name]?.data;
          },
          get error() {
            return store.getState().query[name]?.error ?? null;
          },
          get isPending() {
            return store.getState().query[name]?.isPending ?? false;
          },
          get isError() {
            return store.getState().query[name]?.isError ?? false;
          },
          get params() {
            return store.getState().params[name] ?? {};
          },
          setParams: (patch) => store.getState().setParams(name, patch),
          refetch: async () => {
            if (!isOpAllowed(qc, def)) return undefined;
            await qc.invalidateQueries({
              queryKey: resolveOpInvalidateKey(store.id, name, def),
            });
          },
        } satisfies QueryOpHandle;
      } else {
        bag[name] = {
          kind: "mutation",
          get isPending() {
            return store.getState().mutation[name]?.isPending ?? false;
          },
          get isError() {
            return store.getState().mutation[name]?.isError ?? false;
          },
          get error() {
            return store.getState().mutation[name]?.error ?? null;
          },
          get isOpen() {
            return store.getState().ui.open === name;
          },
          get payload() {
            return store.getState().ui.open === name
              ? store.getState().ui.payload
              : null;
          },
          open: (payload) => {
            if (!isOpAllowed(qc, def)) return;
            store.getState().open(name, payload);
          },
          close: () => {
            if (store.getState().ui.open === name) store.getState().close();
          },
          run: (vars, params, handlers) => {
            if (!isOpAllowed(qc, def)) {
              return Promise.reject(new Error("Not allowed"));
            }
            const confirmConfig = normalizeConfirmConfig(def.confirm);
            if (confirmConfig) {
              return new Promise((resolve, reject) => {
                confirmRef.current(
                  {
                    title: resolveConfirmText(
                      confirmConfig.title,
                      vars,
                      "Are you sure?",
                    ),
                    description: resolveConfirmText(
                      confirmConfig.description,
                      vars,
                      "This action cannot be undone.",
                    ),
                    confirmLabel: resolveConfirmText(
                      confirmConfig.confirmLabel,
                      vars,
                      "Confirm",
                    ),
                    cancelLabel: confirmConfig.cancelLabel ?? "Cancel",
                    tone: confirmConfig.tone ?? "destructive",
                  },
                  async () => {
                    const fn = runFns.current[name];
                    if (!fn) {
                      throw new Error(
                        `OpsProvider not mounted for mutation "${name}"`,
                      );
                    }
                    resolve(await fn(vars, params, handlers));
                  },
                  () => reject(new Error("Confirm cancelled")),
                );
              });
            }
            const fn = runFns.current[name];
            if (!fn) {
              return Promise.reject(
                new Error(`OpsProvider not mounted for mutation "${name}"`),
              );
            }
            return fn(vars, params, handlers);
          },
        } satisfies MutationOpHandle;
      }
    }
    return bag;
  }, [opNames, opsConfig, store, qc]);

  useEffect(() => {
    store.getState()._setOps(opsBag);
  }, [opsBag, store]);

  /** All op components (for manual layout). */
  const components = useMemo(() => {
    const map: Record<string, ReactNode> = {};
    for (const name of opNames) {
      const def = opsConfig[name];
      if (!def.component) continue;
      map[name] = (
        <OpsComponent
          key={name}
          store={store}
          name={name}
          Component={
            def.component as ComponentType<
              QueryOpComponentProps | MutationOpComponentProps
            >
          }
        />
      );
    }
    return map;
  }, [opNames, opsConfig, store]);

  /** Ops with `auto: true` — always mounted when allowed. */
  const autoNodes = useMemo(() => {
    return opNames
      .filter((name) => {
        const def = opsConfig[name];
        return Boolean(def.component && def.auto && isOpAllowed(qc, def));
      })
      .map((name) => (
        <Fragment key={`auto-${name}`}>{components[name]}</Fragment>
      ));
  }, [opNames, opsConfig, components]);

  const ctx: OpsRenderCtx = { components, store };

  return (
    <>
      {opNames.map((name) => {
        const def = store.config.ops[name];
        if (!isOpAllowed(qc, def)) return null;
        if (def.kind === "query") {
          return (
            <QueryBridge
              key={name}
              store={store}
              name={name}
              op={def}
              opsBag={opsBag}
            />
          );
        }
        return (
          <MutationBridge
            key={name}
            store={store}
            name={name}
            op={def}
            opsBag={opsBag}
            runFns={runFns}
          />
        );
      })}
      {autoNodes}
      {typeof children === "function" ? children(ctx) : null}
      <ConfirmDialog />
    </>
  );
}

/**
 * Mount one op’s `component` with live props.
 * Use when you already know the op name outside a render-map.
 */
export function OpsComponent({
  store,
  name,
  Component: ComponentProp,
  field,
}: {
  store: OpsStore;
  name: string;
  /** Defaults to `store.config.ops[name].component`. */
  Component?: ComponentType<QueryOpComponentProps | MutationOpComponentProps>;
  /** Form binding — passed through as `field` on the op component. */
  field?: QueryOpComponentProps["field"];
}) {
  const def = store.config.ops[name];
  const Component =
    ComponentProp ??
    (def?.component as
      | ComponentType<QueryOpComponentProps | MutationOpComponentProps>
      | undefined);

  if (!Component) return null;

  return (
    <OpComponentHost
      store={store}
      name={name}
      Component={Component}
      field={field}
    />
  );
}

/** Subscribe to one op and pass only its live fields (+ store) into the UI. */
function OpComponentHost({
  store,
  name,
  Component,
  field,
}: {
  store: OpsStore;
  name: string;
  Component: ComponentType<QueryOpComponentProps | MutationOpComponentProps>;
  field?: QueryOpComponentProps["field"];
}) {
  const op = useOp(store, name);

  if (!op.allowed) return null;

  if (op.kind === "query") {
    const props: QueryOpComponentProps = {
      store,
      data: op.data,
      error: op.error,
      isPending: op.isPending,
      isError: op.isError,
      params: op.params,
      setParams: op.setParams,
      refetch: op.refetch,
      field,
    };
    return <Component {...props} />;
  }

  const props: MutationOpComponentProps = {
    store,
    isPending: op.isPending,
    isError: op.isError,
    error: op.error,
    isOpen: op.isOpen,
    payload: op.payload,
    open: op.open,
    close: op.close,
    run: op.run,
    submit: op.submit,
    field,
  };
  return <Component {...props} />;
}

function QueryBridge({
  store,
  name,
  op,
  opsBag,
}: {
  store: OpsStore;
  name: string;
  op: QueryOpConfig;
  opsBag: OpsBag;
}) {
  const qc = useQueryClient();
  const params = store((s) => s.params[name] ?? {});
  const successRef = useRef(op.onSuccess);
  const errorRef = useRef(op.onError);
  successRef.current = op.onSuccess;
  errorRef.current = op.onError;
  const opsRef = useRef(opsBag);
  opsRef.current = opsBag;

  const cacheKey = useMemo(
    () => resolveOpQueryKey(store.id, name, op, params),
    [store.id, name, op, params],
  );

  const query = useApiQueryKeyed(
    cacheKey,
    async () => {
      try {
        const result = await op.fetch(params);
        successRef.current?.(result, params, opsRef.current);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errorRef.current?.(error, params, opsRef.current);
        throw error;
      }
    },
    {
      ...op.queryOptions,
      enabled:
        isOpAllowed(qc, op) && (op.queryOptions?.enabled ?? true),
    },
  );

  useEffect(() => {
    store.getState()._patchQuery(name, {
      data: query.data,
      error: query.error instanceof Error ? query.error : null,
      isPending: query.isPending,
      isError: query.isError,
    });
  }, [store, name, query.data, query.error, query.isPending, query.isError]);

  return null;
}

function MutationBridge({
  store,
  name,
  op,
  opsBag,
  runFns,
}: {
  store: OpsStore;
  name: string;
  op: MutationOpConfig;
  opsBag: OpsBag;
  runFns: MutableRefObject<Record<string, RunFn>>;
}) {
  const successRef = useRef(op.onSuccess);
  const errorRef = useRef(op.onError);
  successRef.current = op.onSuccess;
  errorRef.current = op.onError;
  const opsRef = useRef(opsBag);
  opsRef.current = opsBag;

  const mutation = useApiMutationKeyed(
    [store.id, name],
    async ({
      vars,
      params,
    }: {
      vars: unknown;
      params?: unknown;
    }) => op.mutate(vars, params),
    op.mutationOptions,
  );

  useEffect(() => {
    store.getState()._patchMutation(name, {
      isPending: mutation.isPending,
      isError: mutation.isError,
      error: mutation.error instanceof Error ? mutation.error : null,
    });
  }, [store, name, mutation.isPending, mutation.isError, mutation.error]);

  useEffect(() => {
    runFns.current[name] = async (vars, params, handlers) => {
      try {
        const result = await mutation.mutateAsync({ vars, params });
        successRef.current?.(result, vars, opsRef.current);
        handlers?.onSuccess?.(result, vars, opsRef.current);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errorRef.current?.(error, vars, opsRef.current);
        handlers?.onError?.(error, vars, opsRef.current);
        throw error;
      }
    };
    return () => {
      delete runFns.current[name];
    };
  }, [mutation, name, runFns]);

  return null;
}
