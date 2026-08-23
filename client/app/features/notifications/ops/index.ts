import { createOps } from "~/ops";
import { notificationsOpsCore } from "./core";

/** Global notifications — mount in AppShell via OpsProvider. */
export const notificationsOps = createOps({
  id: "notifications",
  scope: "global",
  ops: notificationsOpsCore,
});

export { notificationKeys, notificationsOpsCore } from "./core";
