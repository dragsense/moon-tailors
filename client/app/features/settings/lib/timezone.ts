import { getBrowserTimezone } from "~/lib/api";
import type { TUserPreferences } from "@template/contracts";

/** Resolve display/API timezone: saved IANA or device when null. */
export function resolveTimezone(
  prefs: Pick<TUserPreferences, "time"> | { time: { timezone?: string | null } },
): string {
  const saved = prefs.time?.timezone;
  if (typeof saved === "string" && saved.trim()) return saved.trim();
  return getBrowserTimezone();
}

/** Whether prefs explicitly override the device timezone. */
export function hasExplicitTimezone(
  prefs: Pick<TUserPreferences, "time"> | { time: { timezone?: string | null } },
): boolean {
  const saved = prefs.time?.timezone;
  return typeof saved === "string" && saved.trim().length > 0;
}

/** Curated IANA list; device zone is always injected by the select UI. */
export const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export const DEVICE_TIMEZONE_VALUE = "__device__";

export function listTimezoneOptions(deviceTz = getBrowserTimezone()): string[] {
  const set = new Set<string>([deviceTz, ...COMMON_TIMEZONES]);
  return [...set].sort((a, b) => a.localeCompare(b));
}
