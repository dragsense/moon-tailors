import { ELanguage } from "@moon-tailors/contracts";
import { en, type EnDict } from "./en";
import { ur } from "./ur";

export type LocaleDict = EnDict;

export const LOCALE_CATALOG: Record<
  ELanguage,
  {
    dict: LocaleDict;
    intl: string;
    dir: "ltr" | "rtl";
    /** Native endonym — never translate (English, اردو, …). */
    nativeLabel: string;
  }
> = {
  [ELanguage.EN]: {
    dict: en as LocaleDict,
    intl: "en-US",
    dir: "ltr",
    nativeLabel: "English",
  },
  [ELanguage.UR]: {
    dict: ur,
    intl: "ur-PK",
    dir: "rtl",
    nativeLabel: "اردو",
  },
};

export const DEFAULT_LANGUAGE = ELanguage.EN;
export const LANGUAGE_STORAGE_KEY = "app.language";

/** Dotted paths into the nested locale dictionary (from English source). */
export type TranslationKey = LeavePaths<typeof en>;

type LeavePaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? Prefix extends ""
      ? K
      : `${Prefix}.${K}`
    : LeavePaths<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
}[keyof T & string];

export function resolveTranslation(
  dict: LocaleDict,
  key: string,
  params?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let cursor: unknown = dict;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object" || !(part in cursor)) {
      return key;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }
  if (typeof cursor !== "string") return key;
  if (!params) return cursor;
  return cursor.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] != null ? String(params[name]) : `{{${name}}}`,
  );
}

/** Sync translate for ops confirm labels (reads current language from storage). */
export function opT(
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  let lang = DEFAULT_LANGUAGE;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === ELanguage.EN || raw === ELanguage.UR) lang = raw;
  }
  return resolveTranslation(LOCALE_CATALOG[lang].dict, key, params);
}
