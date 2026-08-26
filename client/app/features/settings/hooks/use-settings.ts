import type { TUserPreferences } from "@moon-tailors/contracts";
import { useApiQueryKeyed } from "~/hooks";
import { fetchPreferences } from "../ops";
import { resolvePreferences } from "../lib/preferences";
import { settingsKeys } from "../query-keys";

/** Read prefs from React Query (settingsKeys.me). */
export function useSettingsState() {
  const query = useApiQueryKeyed(settingsKeys.me(), fetchPreferences, {
    retry: false,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    preferences: resolvePreferences(query.data),
    data: query.data as TUserPreferences | undefined,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useSettings(): TUserPreferences {
  return useSettingsState().preferences;
}

export { fetchPreferences };
