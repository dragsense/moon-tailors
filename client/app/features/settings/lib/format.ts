import {
  formatDate as formatDateBase,
  formatDateTime as formatDateTimeBase,
  formatTime as formatTimeBase,
  type FormatDateOptions,
  type TUserPreferences,
} from "@moon-tailors/contracts";
import { getBrowserTimezone } from "~/lib/api";
import { LOCALE_CATALOG } from "~/locales";
import { resolvePreferences } from "./preferences";

export function toFormatOptions(
  prefs: TUserPreferences,
  intlLocale?: string,
): FormatDateOptions {
  return {
    locale: intlLocale ?? LOCALE_CATALOG[prefs.language].intl,
    dateFormat: prefs.time.dateFormat,
    timeFormat: prefs.time.timeFormat,
    timeZone: getBrowserTimezone(),
  };
}

export function formatDateWithSettings(
  value: string | Date,
  prefsSource: unknown,
  intlLocale?: string,
): string {
  const prefs = resolvePreferences(prefsSource);
  return formatDateBase(value, toFormatOptions(prefs, intlLocale));
}

export function formatTimeWithSettings(
  value: string | Date,
  prefsSource: unknown,
  intlLocale?: string,
): string {
  const prefs = resolvePreferences(prefsSource);
  return formatTimeBase(value, toFormatOptions(prefs, intlLocale));
}

export function formatDateTimeWithSettings(
  value: string | Date,
  prefsSource: unknown,
  intlLocale?: string,
): string {
  const prefs = resolvePreferences(prefsSource);
  return formatDateTimeBase(value, toFormatOptions(prefs, intlLocale));
}
