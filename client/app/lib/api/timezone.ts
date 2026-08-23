/** Browser IANA timezone — default when user prefs.timezone is null. */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Optional override from user prefs (null/undefined → browser).
 * Set from SettingsPrefsSync so `X-Timezone` and formatters stay aligned
 * without `lib/api` importing features.
 */
let preferredTimezone: string | null = null;

export function setPreferredTimezone(timezone: string | null | undefined): void {
  preferredTimezone =
    typeof timezone === "string" && timezone.trim() ? timezone.trim() : null;
}

/** Effective timezone for API headers + display when prefs.timezone is null. */
export function getRequestTimezone(): string {
  return preferredTimezone || getBrowserTimezone();
}
