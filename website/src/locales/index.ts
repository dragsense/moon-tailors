import { en, type WebsiteDict } from "./en";
import type { Language } from "../lib/prefs";
import { ur } from "./ur";

export type { WebsiteDict };

type NestedKey<G extends keyof WebsiteDict> =
  `${G & string}.${keyof WebsiteDict[G] & string}`;

export type TranslationKey =
  | NestedKey<"hero">
  | NestedKey<"prefs">
  | NestedKey<"a11y">
  | NestedKey<"footer">
  | NestedKey<"notFound">;

export const LOCALE_CATALOG: Record<
  Language,
  { dict: WebsiteDict; dir: "ltr" | "rtl"; nativeLabel: string }
> = {
  en: { dict: en, dir: "ltr", nativeLabel: "English" },
  ur: { dict: ur, dir: "rtl", nativeLabel: "اردو" },
};

export const DEFAULT_LANGUAGE: Language = "en";

export function resolveTranslation(
  dict: WebsiteDict,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const [group, leaf] = key.split(".") as [keyof WebsiteDict, string];
  const section = dict[group] as Record<string, string> | undefined;
  let value = section?.[leaf] ?? key;
  if (params) {
    for (const [name, next] of Object.entries(params)) {
      value = value.replaceAll(`{{${name}}}`, String(next));
    }
  }
  return value;
}
