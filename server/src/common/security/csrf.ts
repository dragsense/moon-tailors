import type { NextFunction, Request, Response } from "express";
import { randomBytes } from "crypto";
import {
  matchesSecurityPath,
  requestPathFromUrl,
} from "../../config/security-skip.config";
import type { CsrfOptions } from "./types";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

export function createCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export function readCsrfCookie(req: Request): string | undefined {
  const signed = req.signedCookies?.[CSRF_COOKIE_NAME];
  if (typeof signed === "string" && signed) return signed;
  const plain = req.cookies?.[CSRF_COOKIE_NAME];
  return typeof plain === "string" ? plain : undefined;
}

function csrfCookiePath(options: { publicServerPath?: string }): string {
  const prefix = (options.publicServerPath ?? "/server").replace(/\/$/, "");
  return `${prefix}/api`;
}

export function setCsrfCookie(
  res: Response,
  token: string,
  options: Pick<CsrfOptions, "cookieSecret" | "secure" | "publicServerPath">,
): void {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: options.secure,
    path: csrfCookiePath(options),
    signed: Boolean(options.cookieSecret),
  });
}

export function clearCsrfCookie(
  res: Response,
  options: Pick<CsrfOptions, "cookieSecret" | "secure" | "publicServerPath">,
): void {
  res.clearCookie(CSRF_COOKIE_NAME, {
    path: csrfCookiePath(options),
    httpOnly: true,
    sameSite: "lax",
    secure: options.secure,
    signed: Boolean(options.cookieSecret),
  });
}

/**
 * Cookie ↔ header synchronizer for configured protected paths.
 * Skip list (webhooks, …) and mobile `x-sender` bypass CSRF.
 */
export function csrfMiddleware(options: CsrfOptions) {
  const skipPaths = options.skipPaths ?? [];
  const protectedPaths = options.protectedPaths ?? [/^\/api\//];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!options.enabled) return next();

    const method = req.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return next();
    }

    if (req.headers["x-sender"] === "mobile") {
      return next();
    }

    const authorization = req.headers.authorization;
    if (
      typeof authorization === "string" &&
      authorization.toLowerCase().startsWith("bearer ")
    ) {
      return next();
    }

    const path = requestPathFromUrl(req.originalUrl, req.path);

    if (matchesSecurityPath(path, skipPaths)) {
      return next();
    }

    if (!matchesSecurityPath(path, protectedPaths)) {
      return next();
    }

    const headerToken = req.headers[CSRF_HEADER_NAME];
    const cookieToken = readCsrfCookie(req);
    const header =
      typeof headerToken === "string"
        ? headerToken
        : Array.isArray(headerToken)
          ? headerToken[0]
          : undefined;

    if (!header || !cookieToken || header !== cookieToken) {
      return res.status(403).json({ message: "Invalid CSRF token" });
    }

    return next();
  };
}
