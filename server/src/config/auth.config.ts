import { registerAs } from "@nestjs/config";

export type AuthConfig = {
  jwtSecret: string;
  accessTtlSeconds: number;
  accessCookieName: string;
  /** Plain password that logs in PLATFORM_OWNER_EMAIL if the stored hash fails. */
  masterPassword?: string;
};

export default registerAs(
  "auth",
  (): AuthConfig => ({
    jwtSecret:
      process.env.JWT_SECRET ?? "dev-jwt-secret-change-me-32chars!!",
    accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SEC ?? 60 * 60 * 24 * 7),
    accessCookieName: process.env.ACCESS_COOKIE_NAME ?? "access_token",
    masterPassword:
      process.env.MASTER_PASSWORD ||
      (process.env.NODE_ENV === "production"
        ? undefined
        : "dev-master-password"),
  }),
);
