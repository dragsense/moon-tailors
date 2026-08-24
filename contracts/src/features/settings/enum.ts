/** Stored value type for a single entity setting row. */
export enum ESettingType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  JSON = "JSON",
  ARRAY = "ARRAY",
}

/** UI theme preference. */
export enum ETheme {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system",
}

export enum EDateFormat {
  MM_DD_YYYY = "MM/DD/YYYY",
  DD_MM_YYYY = "DD/MM/YYYY",
  YYYY_MM_DD = "YYYY-MM-DD",
  DD_MMM_YYYY = "DD MMM YYYY",
  MMM_DD_YYYY = "MMM DD, YYYY",
}

export enum ETimeFormat {
  TWELVE_HOUR = "12h",
  TWENTY_FOUR_HOUR = "24h",
}

/** App UI language codes (BCP 47 primary subtag). */
export enum ELanguage {
  EN = "en",
  UR = "ur",
}
