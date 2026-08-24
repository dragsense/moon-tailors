import { registerAs } from "@nestjs/config";

/**
 * Path patterns that skip CSRF / response encryption.
 * Patterns are matched against `originalUrl` without query string.
 *
 * Env (optional extras, comma-separated):
 * CSRF_SKIP_PATHS=/api/payments/stripe/webhook,/api/webhooks/.+
 */
export type SecuritySkipConfig = {
  /** Always bypass CSRF even when the path is CSRF-protected. */
  csrfSkipPaths: RegExp[];
  /**
 * Cookie-auth mutators that require CSRF (project allowlist model).
 * Bearer APIs are not covered — only these paths.
 */
  csrfProtectedPaths: RegExp[];

};

function compilePatterns(
  patterns: string[],
  flags = "",
): RegExp[] {
  return patterns
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      try {
        return new RegExp(p, flags);
      } catch {
        // Treat as literal path prefix if invalid regex
        return new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
      }
    });
}

function fromEnv(key: string): string[] {
  const raw = process.env[key];
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Defaults — keep in sync with env/server.env.example comments. */
export const DEFAULT_CSRF_SKIP_PATHS = [
  "^/api/health/?$",
  "^/api/docs",
  "^/api/docs-json",
  "^/api/swagger-docs",
  "^/api/auth/login/?$",
];

/** All mutating `/api` routes — cookie JWT is sent automatically by the browser. */
export const DEFAULT_CSRF_PROTECTED_PATHS = ["^/api/"];


export default registerAs(
  "securitySkip",
  (): SecuritySkipConfig => {
    const csrfProtectedEnv = fromEnv("CSRF_PROTECTED_PATHS");
    return {
      csrfSkipPaths: compilePatterns([
        ...DEFAULT_CSRF_SKIP_PATHS,
        ...fromEnv("CSRF_SKIP_PATHS"),
      ]),
      csrfProtectedPaths: compilePatterns(
        csrfProtectedEnv.length
          ? csrfProtectedEnv
          : DEFAULT_CSRF_PROTECTED_PATHS,
      ),
 
    };
  },
);

/** Match request path (no query) against configured patterns. */
export function matchesSecurityPath(
  requestPath: string,
  patterns: RegExp[],
): boolean {
  const path = requestPath.split("?")[0] ?? requestPath;
  return patterns.some((pattern) => pattern.test(path));
}

export function requestPathFromUrl(
  originalUrl: string | undefined,
  path: string,
): string {
  return (
    (typeof originalUrl === "string" ? originalUrl.split("?")[0] : undefined) ??
    path
  );
}
