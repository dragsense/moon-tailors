/**
 * Deploy target for the SPA (build-time via Vite).
 * Production → no UI cue. Everything else → visible environment strip.
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
  // Vite `pnpm dev` with no VITE_APP_ENV → development; prod builds → production
  return isDevBuild ? "development" : "production";
}

export function getAppEnvironment(): AppEnvironment {
  return resolveAppEnvironment(
    import.meta.env.VITE_APP_ENV,
    Boolean(import.meta.env.DEV),
  );
}

/** True when we must show a UI cue (never for production). */
export function isNonProductionEnvironment(
  env: AppEnvironment = getAppEnvironment(),
): env is Exclude<AppEnvironment, "production"> {
  return env !== "production";
}
