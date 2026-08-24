import type { TUserPreferences } from "@moon-tailors/contracts";
import { AUTH_SESSION_QUERY_KEY } from "~/features/auth/session/session-store";
import type { OpConfig, OpsBag } from "~/ops";
import { refetchOp } from "~/ops";
import { queryClient } from "~/lib/query";
import { userSettingsService } from "../api";
import {
  mergePreferences,
  parsePreferences,
  readCachedPreferences,
  writeCachedPreferences,
} from "../lib/preferences";

export const settingsKeys = {
  my: ["settings", "me"] as const,
};

async function fetchMyPreferences(): Promise<TUserPreferences> {
  // Session query holds IAuthUser | null — guests must not hit /user-settings/me.
  const sessionUser = queryClient.getQueryData<{ id?: string } | null>(
    AUTH_SESSION_QUERY_KEY,
  );
  if (!sessionUser?.id) return readCachedPreferences();

  const res = await userSettingsService.getMine();
  const prefs = parsePreferences(res.settings);
  writeCachedPreferences(prefs);
  return prefs;
}

export const settingsOpsCore = {
  mySettings: {
    kind: "query" as const,
    fetch: fetchMyPreferences,
    queryKey: () => settingsKeys.my,
    invalidateKey: settingsKeys.my,
    queryOptions: {
      staleTime: 5 * 60_000,
      retry: false,
    },
    onSuccess: (result: unknown) => {
      writeCachedPreferences(result as TUserPreferences);
    },
  },
  saveSettings: {
    kind: "mutation" as const,
    mutate: async (vars: unknown) => {
      const patch = vars as Partial<TUserPreferences>;
      const current = readCachedPreferences();
      const next = mergePreferences(current, patch);
      writeCachedPreferences(next);
      const res = await userSettingsService.saveMine(next);
      const saved = parsePreferences(res.settings);
      writeCachedPreferences(saved);
      return saved;
    },
    onSuccess: (_result: unknown, _vars: unknown, ops: OpsBag) => {
      refetchOp(ops, "mySettings");
    },
  },
};
