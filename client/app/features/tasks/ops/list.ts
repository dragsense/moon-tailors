import type { IPaginatedTasks } from "@template/contracts";
import { createOps, pickOps } from "~/ops";
import { userOpsCore } from "~/features/users/ops/core";
import { taskOpsCore } from "./core";

/** /tasks — full core + user assignee picker. */
export const tasksListOps = createOps({
  id: "tasks-list",
  scope: "page",
  ops: {
    ...taskOpsCore,
    ...pickOps(userOpsCore, { listUsersDropdown: true }),
  },
});

/** @deprecated use tasksListOps */
export const tasksOps = tasksListOps;

export type { IPaginatedTasks };
