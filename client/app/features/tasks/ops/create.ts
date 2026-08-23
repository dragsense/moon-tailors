import { createOps, pickOps } from "~/ops";
import { userOpsCore } from "~/features/users/ops/core";
import { CreateTask } from "../form/create-task";
import { taskOpsCore } from "./core";

/** /tasks/new — create shell + user assignee picker. */
export const taskCreateOps = createOps({
  id: "tasks-create",
  scope: "page",
  ops: {
    ...pickOps(taskOpsCore, {
      createTask: {
        component: CreateTask,
        auto: false,
      },
    }),
    ...pickOps(userOpsCore, { listUsersDropdown: true }),
  },
});
