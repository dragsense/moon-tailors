import {
  DEFAULT_USER_PREFERENCES,
  userPreferencesSchema,
  type TUserPreferences,
} from "@moon-tailors/contracts";

export const USER_PREFS_STORAGE_KEY = "app.userPreferences";

export function parsePreferences(raw: unknown): TUserPreferences {
  const parsed = userPreferencesSchema.safeParse({
    ...DEFAULT_USER_PREFERENCES,
    ...(raw && typeof raw === "object" ? raw : {}),
  });
  return parsed.success ? parsed.data : DEFAULT_USER_PREFERENCES;
}

export function readCachedPreferences(): TUserPreferences {
  if (typeof window === "undefined") return DEFAULT_USER_PREFERENCES;
  try {
    const raw = localStorage.getItem(USER_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;
    return parsePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function writeCachedPreferences(prefs: TUserPreferences): void {
  localStorage.setItem(USER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

export function resolvePreferences(data: unknown): TUserPreferences {
  if (!data) return readCachedPreferences();
  return parsePreferences(data);
}

export function mergePreferences(
  current: TUserPreferences,
  patch: Partial<TUserPreferences>,
): TUserPreferences {
  return parsePreferences({
    ...current,
    ...patch,
    theme: { ...current.theme, ...patch.theme },
    time: { ...current.time, ...patch.time },
  });
}
