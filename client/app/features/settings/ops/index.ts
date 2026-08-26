/**
 * Settings feature ops.
 *
 * ```txt
 * ops/
 *   core.ts  get + update catalog
 *   list.ts  global pack + /settings page pack
 * ```
 */
export {
  fetchPreferences,
  settingsOpsCore,
  type SettingsOpsCore,
} from "./core";
export { settingsOps, settingsPageOps } from "./list";
export { settingsKeys } from "../query-keys";
