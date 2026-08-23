import { createOps } from "~/ops";
import { businessThemeOpsCore } from "./core";

/** Global business theme — mount once in root via OpsProvider. */
export const businessThemeOps = createOps({
  id: "business-theme",
  scope: "global",
  ops: businessThemeOpsCore,
});

export { businessThemeKeys } from "./core";
export type { SaveBusinessThemeVars } from "./core";
