import {
  formatDate as formatDateBase,
  formatDateTime as formatDateTimeBase,
  formatTime as formatTimeBase,
  type FormatDateOptions,
  type TUserPreferences,
} from "@template/contracts";
import { LOCALE_CATALOG } from "~/locales";
import { resolvePreferences } from "./preferences";
import { resolveTimezone } from "./timezone";

export function toFormatOptions(
  prefs: TUserPreferences,
  intlLocale?: string,
): FormatDateOptions {
  return {
    locale: intlLocale ?? LOCALE_CATALOG[prefs.language].intl,
    dateFormat: prefs.time.dateFormat,
    timeFormat: prefs.time.timeFormat,
    timeZone: resolveTimezone(prefs),
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
