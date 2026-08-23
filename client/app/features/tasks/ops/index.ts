/**
 * Tasks feature ops.
 *
 * ```txt
 * ops/
 *   core.ts    taskOpsCore  — all ops + default UI + default onSuccess
 *   list.ts    tasksListOps — /tasks (full core as-is)
 *   create.ts  taskCreateOps — /tasks/new (patch create UI)
 * ```
 *
 * Foreign pack — use core defaults, override only when needed:
 *
 * ```ts
 * import { createOps, pickOps, refetchOp } from "~/ops";
 * import { taskOpsCore } from "~/features/tasks/ops/core";
 *
 * createOps({
 *   id: "users-page",
 *   ops: {
 *     listUsers: { kind: "query", … },
 *     ...pickOps(taskOpsCore, {
 *       createTask: {
 *         // optional override — default core refreshes listTasks if present
 *         onSuccess: (_r, _v, ops) => refetchOp(ops, "listUsers"),
 *       },
 *       viewTask: true,
 *     }),
 *   },
 * });
 * ```
 */
export { taskOpsCore, type TaskOpsCore, type TaskOpName } from "./core";
export { tasksListOps, tasksOps, type IPaginatedTasks } from "./list";
export { taskCreateOps } from "./create";
