import { createHash, randomBytes } from "crypto";

export function hashAuthSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

/**
 * Generate a user API key: `{prefix}{8hex}_{secret}`.
 * Example: `tk_a1b2c3d4_xK9…`
 */
export function generateApiKey(prefix: string): {
  raw: string;
  keyPrefix: string;
} {
  const normalized = prefix.endsWith("_") ? prefix : `${prefix}_`;
  const idPart = randomBytes(4).toString("hex");
  const secret = randomBytes(32).toString("base64url");
  const keyPrefix = `${normalized}${idPart}`;
  return { raw: `${keyPrefix}_${secret}`, keyPrefix };
}

/** JWT access tokens are three base64url segments separated by dots. */
export function looksLikeJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}
