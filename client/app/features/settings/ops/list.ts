import { createOps, pickOps } from "~/ops";
import { settingsOpsCore } from "./core";

/** App-wide prefs load (nav sync). No update — toggles are local only. */
export const settingsOps = createOps({
  id: "settings",
  scope: "global",
  ops: pickOps(settingsOpsCore, {
    getSettings: { component: undefined, auto: true },
  }),
});

/** `/settings` — form get + update. */
export const settingsPageOps = createOps({
  id: "settings-page",
  scope: "page",
  ops: pickOps(settingsOpsCore, {
    getSettings: { auto: true },
    updateSettings: true,
  }),
});
