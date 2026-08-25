/**
 * Website locale dictionary — dotted keys via `t("hero.ctaLogin")`.
 */
export const en = {
  hero: {
    title: "Moon Tailors",
    subtitle: "& Matching Center",
    tagline: "Bespoke stitching and matching, made simple.",
    description:
      "Find a customer, take measurements, and follow each order from cutting to delivery.",
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

  a11y: {
    prefs: "Site preferences",
  },

  footer: {
    copyright: "© {{year}} {{name}}. All rights reserved.",
  },

  notFound: {
    code: "404",
    title: "This page could not be found.",
    support: "The link may be outdated, or the page may have moved.",
    back: "Back to website",
    openApp: "Open app",
  },
} as const;

export type WebsiteDict = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};
