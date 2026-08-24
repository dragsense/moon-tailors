/**
 * /users pack — userOpsCore only.
 */
import { createOps } from "~/ops";
import { userOpsCore } from "./core";

export const usersListOps = createOps({
  id: "users-list",
  scope: "page",
  ops: {
    ...userOpsCore,
  },
});
