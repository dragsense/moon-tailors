/**
 * Users feature ops.
 *
 * ```txt
 * ops/
 *   core.ts  userOpsCore — user domain ops (not a store)
 *   list.ts  usersListOps — /users pack (+ picked task ops)
 * ```
 *
 * Foreign task UI on this pack:
 *   pickOps(taskOpsCore, { createTask: { onSuccess: … }, viewTask: true })
 *
 * listUsersDropdown — picker op (UserDropdown + search). Foreign packs pick it:
 *   pickOps(userOpsCore, { listUsersDropdown: true })
 * Form placement: <OpsComponent name="listUsersDropdown" field={…} />
 *
 * Task component siblings (Edit on view) use `useMaybeOp` so missing
 * updateTask does not crash the pack.
 */
export { userOpsCore, type UserOpsCore, type UserOpName } from "./core";
export { usersListOps } from "./list";
