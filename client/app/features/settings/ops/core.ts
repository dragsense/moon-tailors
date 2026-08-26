import {
  DEFAULT_USER_PREFERENCES,
  type TSaveUserSettingsData,
  type TUserPreferences,
} from "@moon-tailors/contracts";
import { refetchOp, type OpConfig, type OpsBag } from "~/ops";
import { settingsService } from "../api";
import { SettingsForm } from "../form/settings-form";
import { parsePreferences } from "../lib/preferences";
import { settingsKeys } from "../query-keys";

/** GET /user-settings/me — guests resolve to defaults. */
export async function fetchPreferences(): Promise<TUserPreferences> {
  try {
    const res = await settingsService.getMe();
    return parsePreferences(res.settings);
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export const settingsOpsCore = {
  getSettings: {
    kind: "query" as const,
    fetch: fetchPreferences,
    queryKey: () => settingsKeys.me(),
    invalidateKey: settingsKeys.me(),
    component: SettingsForm,
    auto: false,
    queryOptions: {
      staleTime: 5 * 60_000,
      retry: false,
    },
    onError: (error: Error) => {
      console.error("[settings.getSettings]", error.message);
    },
  },
  updateSettings: {
    kind: "mutation" as const,
    mutate: (vars: unknown) =>
      settingsService.updateMe(vars as TSaveUserSettingsData),
    onSuccess: (_result: unknown, _vars: unknown, ops: OpsBag) => {
      refetchOp(ops, "getSettings");
    },
    onError: (error: Error) => {
      console.error("[settings.updateSettings]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type SettingsOpsCore = typeof settingsOpsCore;
