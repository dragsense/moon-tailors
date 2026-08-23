/**
 * /users pack — userOpsCore + task ops from taskOpsCore (no tasksListOps).
 *
 * createTask keeps core listTasks refresh (no-op if absent) **and** refreshes listUsers.
 */
import {
  composeSuccess,
  createOps,
  pickOps,
  refetchOp,
  type OpsBag,
} from "~/ops";
import { taskOpsCore } from "~/features/tasks/ops/core";
import { userOpsCore } from "./core";

const refreshUsers = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listUsers");
};

export const usersListOps = createOps({
  id: "users-list",
  scope: "page",
  ops: {
    ...userOpsCore,
    ...pickOps(taskOpsCore, {
      createTask: {
        onSuccess: composeSuccess(
          taskOpsCore.createTask.onSuccess,
          refreshUsers,
        ),
      },
      viewTask: true,
    }),
  },
});
