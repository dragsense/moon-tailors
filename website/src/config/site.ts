export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  appUrl: string;
  loginPath: string;
  signupPath: string;
};

/**
 * Public site settings (Astro `PUBLIC_*` env).
 * Mirrors client env-driven config — no hardcoded brand/URLs in pages.
 */
export function getSiteConfig(): SiteConfig {
  const appUrl = (
    import.meta.env.PUBLIC_APP_URL ?? "http://localhost:8088/app"
  ).replace(/\/$/, "");

  return {
    name: import.meta.env.PUBLIC_SITE_NAME ?? "Template",
    tagline:
      import.meta.env.PUBLIC_SITE_TAGLINE ?? "Ship the product, not the plumbing.",
    description:
      import.meta.env.PUBLIC_SITE_DESCRIPTION ??
      "Contracts-first monorepo: NestJS, React Router, Zod schemas, ops packs, RBAC, and deploy tooling.",
    appUrl,
    /** Client `/` and `/login` both render login. */
    loginPath: import.meta.env.PUBLIC_APP_LOGIN_PATH ?? "/",
    signupPath: import.meta.env.PUBLIC_APP_SIGNUP_PATH ?? "/signup",
  };
}

export function appHref(path: string, site = getSiteConfig()): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${site.appUrl}${suffix}`;
}
