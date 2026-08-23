import { createOps } from "~/ops";
import { settingsOpsCore } from "./core";

/** Global user settings — mount once in root via OpsProvider. */
export const settingsOps = createOps({
  id: "settings",
  scope: "global",
  ops: settingsOpsCore,
});

export { settingsKeys } from "./core";
