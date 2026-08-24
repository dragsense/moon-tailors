/**
 * Website locale dictionary — dotted keys via `t("hero.ctaStart")`.
 */
export const en = {
  hero: {
    title: "Moon Tailors",
    subtitle: "& Matching Center",
    tagline: "Bespoke stitching and matching, made simple.",
    description:
      "Find a customer, take measurements, and follow each order from cutting to delivery.",
    ctaStart: "Get started",
    ctaLogin: "Log in",
    ctaDashboard: "Open the shop",
    ctaChecking: "Checking…",
  },


  prefs: {
    theme: "Theme",
    language: "Language",
    light: "Light",
    dark: "Dark",
    system: "System",
  },

  footer: {
    copyright: "© {{year}} {{name}}. All rights reserved.",
  },
} as const;

export type WebsiteDict = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};
