/** Shared date helpers (ISO strings ↔ display) with optional user prefs. */

import { EDateFormat, ETimeFormat } from "../features/settings/enum.js";

export type FormatDateOptions = {
  locale?: string;
  timeZone?: string;
  dateFormat?: EDateFormat;
  timeFormat?: ETimeFormat;
};

export function toIsoDate(date: Date = new Date()): string {
  return date.toISOString();
}

function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

function hour12FromTimeFormat(timeFormat?: ETimeFormat): boolean | undefined {
  if (timeFormat === ETimeFormat.TWENTY_FOUR_HOUR) return false;
  if (timeFormat === ETimeFormat.TWELVE_HOUR) return true;
  return undefined;
}

function formatWithPattern(
  date: Date,
  pattern: EDateFormat,
  locale: string,
  timeZone?: string,
): string {
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);

  const lookup = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  const y = lookup.year ?? "";
  const m = lookup.month ?? "";
  const d = lookup.day ?? "";

  switch (pattern) {
    case EDateFormat.MM_DD_YYYY:
      return `${m}/${d}/${y}`;
    case EDateFormat.DD_MM_YYYY:
      return `${d}/${m}/${y}`;
    case EDateFormat.YYYY_MM_DD:
      return `${y}-${m}-${d}`;
    case EDateFormat.DD_MMM_YYYY:
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone,
      }).format(date);
    case EDateFormat.MMM_DD_YYYY:
    default:
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone,
      }).format(date);
  }
}

export function formatDate(
  value: string | Date,
  options: FormatDateOptions = {},
): string {
  const date = toDate(value);
  if (!date) return "";
  const locale = options.locale ?? "en-US";
  if (options.dateFormat) {
    return formatWithPattern(
      date,
      options.dateFormat,
      locale,
      options.timeZone,
    );
  }
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: options.timeZone,
  }).format(date);
}

export function formatTime(
  value: string | Date,
  options: FormatDateOptions = {},
): string {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(options.locale ?? "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: hour12FromTimeFormat(options.timeFormat),
    timeZone: options.timeZone,
  }).format(date);
}

export function formatDateTime(
  value: string | Date,
  options: FormatDateOptions = {},
): string {
  const date = toDate(value);
  if (!date) return "";
  const datePart = formatDate(date, options);
  const timePart = formatTime(date, options);
  if (!datePart) return timePart;
  if (!timePart) return datePart;
  return `${datePart} ${timePart}`;
}

export function isExpired(isoDate: string, now: Date = new Date()): boolean {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() < now.getTime();
}

/** Format an HH:mm wall-clock value without applying timezone conversion. */
export function formatTimeOfDay(
  value: string | null | undefined,
  options: FormatDateOptions = {},
): string {
  if (!value) return "";
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return "";

  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat(options.locale ?? "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: hour12FromTimeFormat(options.timeFormat) ?? true,
    timeZone: "UTC",
  }).format(date);
}

export function formatInterval(
  intervalValue?: number,
  intervalUnit = "minutes",
): string {
  if (!intervalValue) return "Once";
  const unit =
    intervalValue === 1 ? intervalUnit.replace(/s$/, "") : intervalUnit;
  return `Every ${intervalValue} ${unit}`;
}

/** Human-readable relative time using the platform's locale rules. */
export function getRelativeTime(
  value: string | Date,
  options: FormatDateOptions = {},
  now: Date = new Date(),
): string {
  const date = toDate(value);
  if (!date) return "";

  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const absolute = Math.abs(seconds);
  const formatter = new Intl.RelativeTimeFormat(options.locale ?? "en-US", {
    numeric: "auto",
  });

  if (absolute < 60) return formatter.format(seconds, "second");
  if (absolute < 3_600) {
    return formatter.format(Math.round(seconds / 60), "minute");
  }
  if (absolute < 86_400) {
    return formatter.format(Math.round(seconds / 3_600), "hour");
  }
  return formatter.format(Math.round(seconds / 86_400), "day");
}

export function formatNextRun(
  nextRunDate: string | Date,
  timeOfDay?: string,
  options: FormatDateOptions = {},
): string {
  const date = formatDate(nextRunDate, options);
  if (!date) return "";
  const time = formatTimeOfDay(timeOfDay, options);
  const relative = getRelativeTime(nextRunDate, options);
  return `${date}${time ? ` at ${time}` : ""}${relative ? ` (${relative})` : ""}`;
}

/** JavaScript day index: Sunday = 0 through Saturday = 6. */
export function getDayOfWeekName(
  day: number,
  locale = "en-US",
): string {
  if (!Number.isInteger(day) || day < 0 || day > 6) return "Unknown";
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, 0, 7 + day)));
}

/** JavaScript month index: January = 0 through December = 11. */
export function getMonthName(month: number, locale = "en-US"): string {
  if (!Number.isInteger(month) || month < 0 || month > 11) return "Unknown";
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, month, 1)));
}

export function formatExecutionStats(
  successCount: number,
  totalCount: number,
): string {
  if (totalCount <= 0) return "0/0 (0%)";
  const percentage = ((successCount / totalCount) * 100).toFixed(1);
  return `${successCount}/${totalCount} (${percentage}%)`;
}
