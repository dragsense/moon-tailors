import { createOps, pickOps } from "~/ops";
import { userOpsCore } from "~/features/users/ops/core";

/** Shared ops for billing create/edit pages (recipient user picker). */
export const billingsFormOps = createOps({
  id: "billings-form",
  scope: "page",
  ops: {
    ...pickOps(userOpsCore, { listUsersDropdown: true }),
  },
});
