/**
 * Ops store system — Zustand packs for queries/mutations without prop trees.
 *
 * Per-op `auto` (default false):
 *   auto: true  → OpsProvider always mounts component (modals)
 *   auto: false → place via children({ components })
 *
 * Compose feature catalogs into packs:
 *   pickOps(taskOpsCore, ["createTask", "viewTask"])
 *   pickOps(taskOpsCore, {
 *     createTask: {
 *       onSuccess: composeSuccess(
 *         taskOpsCore.createTask.onSuccess,
 *         (_r, _v, ops) => refetchOp(ops, "listUsers"),
 *       ),
 *     },
 *     viewTask: true,
 *   })
 *
 * Validation schemas live on SchemaForm / contracts — not on ops.
 *
 * Form pickers: mount an op as a control with optional `field`:
 *   <OpsComponent store={store} name="listUsersDropdown" field={{ value, onChange, … }} />
 *
 * @example
 * createTask: { kind: "mutation", component: Modal, auto: true }
 * listTasks:  { kind: "query", component: List }
 *
 * <OpsProvider store={tasksOps}>
 *   {({ components }) => components.listTasks}
 * </OpsProvider>
 */
export {
  createOps,
  queryKey,
  packQueryKey,
  resolveOpQueryKey,
  resolveOpInvalidateKey,
  normalizeConfirmConfig,
  resolveConfirmText,
  type CreateOpsConfig,
  type OpConfig,
  type QueryOpConfig,
  type MutationOpConfig,
  type MutationConfirmConfig,
  type OpConfirmProps,
  type QueryOpComponentProps,
  type MutationOpComponentProps,
  type OpFieldProps,
  type OpsStore,
  type OpsStoreState,
  type OpsBag,
  type QueryOpHandle,
  type MutationOpHandle,
  type OpPermission,
  type QueryOpQueryOptions,
  type MutationOpMutationOptions,
} from "./create-ops";
export { patchOp, pickOps, refetchOp, invalidateQueriesKey, refreshDomain, composeSuccess } from "./compose";
export {
  OpsProvider,
  OpsComponent,
  type OpsProviderProps,
  type OpsRenderCtx,
} from "./provider";
export { DefaultOpConfirm } from "./confirm";
export { useOp, useMaybeOp, useOps, type OpView } from "./hooks";
