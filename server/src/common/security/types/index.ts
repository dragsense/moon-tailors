/** Options for cookie ↔ header CSRF middleware. */
export type CsrfOptions = {
  enabled: boolean;
  /** When set, cookie-parser signed cookies are used. */
  cookieSecret?: string;
  secure: boolean;
  /** From `securitySkip` config — skip + protected path patterns. */
  skipPaths?: RegExp[];
  protectedPaths?: RegExp[];
  /** Gateway prefix for cookies (`/server` → Path=/server/api). */
  publicServerPath?: string;
};
