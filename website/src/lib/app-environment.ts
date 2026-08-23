/**
 * Deploy target for the marketing site (Astro `PUBLIC_ENV` / `PUBLIC_APP_ENV`).
 * Production → no UI cue. Baked in at `astro build` (Docker website image).
 */
export type AppEnvironment =
  | "development"
  | "testing"
  | "staging"
  | "production";

const ALIASES: Record<string, AppEnvironment> = {
  development: "development",
  develop: "development",
  dev: "development",
  local: "development",
  testing: "testing",
  test: "testing",
  staging: "staging",
  stage: "staging",
  production: "production",
  prod: "production",
};

export function resolveAppEnvironment(
  raw?: string | null,
  isDevBuild = false,
): AppEnvironment {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (key && ALIASES[key]) return ALIASES[key];
  return isDevBuild ? "development" : "production";
}

export function getAppEnvironment(): AppEnvironment {
  return resolveAppEnvironment(
    import.meta.env.PUBLIC_APP_ENV || import.meta.env.PUBLIC_ENV,
    Boolean(import.meta.env.DEV),
  );
}

export function isNonProductionEnvironment(
  env: AppEnvironment = getAppEnvironment(),
): env is Exclude<AppEnvironment, "production"> {
  return env !== "production";
}
