import type { OpConfig, OpsBag } from "./create-ops";
import { queryClient } from "~/lib/query";

type OpSuccess = (result: unknown, vars: unknown, ops: OpsBag) => void;

/** Shallow merge — pack patch wins over catalog defaults. */
export function patchOp<T extends OpConfig>(
  base: T,
  patch: Partial<OpConfig>,
): T {
  return { ...base, ...patch } as T;
}

type PickMap<T extends Record<string, OpConfig>> = {
  [K in keyof T]?: true | Partial<OpConfig>;
};

/**
 * Pick ops from a feature catalog into a pack.
 *
 * @example Array (as-is)
 * pickOps(taskOpsCore, ["createTask", "viewTask"])
 *
 * @example Object with patches (+ composeSuccess so core refresh is kept)
 * pickOps(taskOpsCore, {
 *   createTask: {
 *     onSuccess: composeSuccess(
 *       taskOpsCore.createTask.onSuccess,
 *       (_r, _v, ops) => refetchOp(ops, "listUsers"),
 *     ),
 *   },
 *   viewTask: true,
 * })
 */
export function pickOps<T extends Record<string, OpConfig>>(
  catalog: T,
  selection: readonly (keyof T & string)[] | PickMap<T>,
): Record<string, OpConfig> {
  const result: Record<string, OpConfig> = {};

  if (Array.isArray(selection)) {
    for (const key of selection) {
      const base = catalog[key];
      if (base) result[key] = base;
    }
    return result;
  }

  const map = selection as PickMap<T>;
  for (const key of Object.keys(map) as (keyof T & string)[]) {
    const entry = map[key];
    if (entry === undefined) continue;
    const base = catalog[key];
    if (!base) continue;
    result[key] = entry === true ? base : patchOp(base, entry);
  }

  return result;
}

/** Refetch a sibling query op if present — no-op otherwise. */
export function refetchOp(ops: OpsBag, name: string): void {
  const op = ops[name];
  if (op?.kind === "query") void op.refetch();
}

/**
 * Invalidate all queries under a domain prefix — works across page packs.
 * Use in mutation onSuccess alongside refetchOp for mounted siblings.
 */
export function invalidateQueriesKey(key: readonly unknown[]): void {
  void queryClient.invalidateQueries({ queryKey: key });
}

/** Invalidate domain prefix + refetch sibling op when mounted on this page. */
export function refreshDomain(
  key: readonly unknown[],
  ops: OpsBag,
  opName: string,
): void {
  invalidateQueriesKey(key);
  refetchOp(ops, opName);
}

/**
 * Run several onSuccess handlers in order (skip undefined).
 * Use when a pack patch must keep core refresh **and** add host refresh.
 *
 * Replace entirely (no compose) when the pack should drop core behavior.
 */
export function composeSuccess(
  ...fns: Array<OpSuccess | undefined>
): OpSuccess {
  return (result, vars, ops) => {
    for (const fn of fns) {
      fn?.(result, vars, ops);
    }
  };
}
