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
