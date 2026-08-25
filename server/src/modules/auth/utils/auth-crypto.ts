import { timingSafeEqual } from "crypto";

/** JWT access tokens are three base64url segments separated by dots. */
export function looksLikeJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/** Constant-time string compare. Different lengths always return false. */
export function timingSafeEqualString(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

