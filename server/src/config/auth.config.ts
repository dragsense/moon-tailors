import { registerAs } from "@nestjs/config";

export type AuthPasswordResetMode = "otp" | "link";

export type AuthConfig = {
  jwtSecret: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
  refreshCookieName: string;
  otpTtlMs: number;
  otpMaxAttempts: number;
  /**
   * After password login: require email OTP (`true`) or issue session immediately.
   * Env: AUTH_LOGIN_PASSWORD_OTP=true|false (default true).
   */
  loginPasswordOtp: boolean;
  /**
   * Allow passwordless email → OTP login.
   * Env: AUTH_LOGIN_EMAIL_OTP=true|false (default true).
   */
  loginEmailOtp: boolean;
  /**
   * Forgot-password flow: email OTP or magic reset link.
   * Env: AUTH_PASSWORD_RESET_MODE=otp|link (default otp).
   */
  passwordResetMode: AuthPasswordResetMode;
  /** Frontend path for link mode, e.g. reset-password. */
  passwordResetPath: string;
  /** Reset-link JWT TTL (seconds). Default 15m. */
  passwordResetLinkTtlSec: number;
  /**
   * Accept user API keys (`Authorization: Bearer tk_…` or `X-Api-Key`).
   * Env: AUTH_API_KEY_ENABLED=true|false (default true).
   */
  apiKeyEnabled: boolean;
  /** Prefix for generated secrets, e.g. `tk_`. Env: AUTH_API_KEY_PREFIX. */
  apiKeyPrefix: string;
};

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === "true";
}

function parseResetMode(raw: string | undefined): AuthPasswordResetMode {
  return raw?.toLowerCase() === "link" ? "link" : "otp";
}

export default registerAs(
  "auth",
  (): AuthConfig => ({
    jwtSecret:
      process.env.JWT_SECRET ?? "dev-jwt-secret-change-me-32chars!!",
    accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SEC ?? 900),
    refreshTtlSeconds: Number(
      process.env.JWT_REFRESH_TTL_SEC ?? 60 * 60 * 24 * 7,
    ),
    refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? "refresh_token",
    otpTtlMs: Number(process.env.OTP_TTL_MS ?? 5 * 60 * 1000),
    otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
    loginPasswordOtp: parseBool(process.env.AUTH_LOGIN_PASSWORD_OTP, true),
    loginEmailOtp: parseBool(process.env.AUTH_LOGIN_EMAIL_OTP, true),
    passwordResetMode: parseResetMode(process.env.AUTH_PASSWORD_RESET_MODE),
    passwordResetPath: process.env.AUTH_PASSWORD_RESET_PATH ?? "reset-password",
    passwordResetLinkTtlSec: Number(
      process.env.AUTH_PASSWORD_RESET_LINK_TTL_SEC ?? 15 * 60,
    ),
    apiKeyEnabled: parseBool(process.env.AUTH_API_KEY_ENABLED, true),
    apiKeyPrefix: process.env.AUTH_API_KEY_PREFIX ?? "tk_",
  }),
);
