import { ar } from "./ar";
import { en, type WebsiteDict } from "./en";
import type { Language } from "../lib/prefs";

export type { WebsiteDict };

type NestedKey<G extends keyof WebsiteDict> =
  `${G & string}.${keyof WebsiteDict[G] & string}`;

export type TranslationKey =
  | NestedKey<"hero">
  | NestedKey<"features">
  | NestedKey<"stack">
  | NestedKey<"modules">
  | NestedKey<"monorepo">
  | NestedKey<"cta">
  | NestedKey<"prefs">
  | NestedKey<"a11y">;

export const LOCALE_CATALOG: Record<
  Language,
  { dict: WebsiteDict; dir: "ltr" | "rtl"; nativeLabel: string }
> = {
  en: { dict: en, dir: "ltr", nativeLabel: "English" },
  ar: { dict: ar, dir: "rtl", nativeLabel: "العربية" },
};

export const DEFAULT_LANGUAGE: Language = "en";

export function resolveTranslation(
  dict: WebsiteDict,
  key: TranslationKey,
): string {
  const [group, leaf] = key.split(".") as [keyof WebsiteDict, string];
  const section = dict[group] as Record<string, string> | undefined;
  return section?.[leaf] ?? key;
}
