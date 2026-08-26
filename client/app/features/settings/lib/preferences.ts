import {
  DEFAULT_USER_PREFERENCES,
  userPreferencesSchema,
  type TUserPreferences,
} from "@moon-tailors/contracts";

export function parsePreferences(raw: unknown): TUserPreferences {
  const parsed = userPreferencesSchema.safeParse({
    ...DEFAULT_USER_PREFERENCES,
    ...(raw && typeof raw === "object" ? raw : {}),
  });
  return parsed.success ? parsed.data : DEFAULT_USER_PREFERENCES;
}

export function resolvePreferences(data: unknown): TUserPreferences {
  if (!data) return DEFAULT_USER_PREFERENCES;
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
