import { registerAs } from "@nestjs/config";

export type AppConfig = {
  environment: string;
  /** Display name used in emails / branding. */
  name: string;
  serviceName: string;
  /** Public app URL (email links, footer). */
  appUrl: string;
  host: string;
  port: number;
  corsOrigins: string[];
  cookieSecret?: string;
  /** Cookie↔header CSRF on /auth/refresh + /auth/logout. */
  csrfEnabled: boolean;
  apiDocsEnabled: boolean;
  clientStaticDir?: string;
  /** Gateway prefix in front of Nest (`/server` → `/server/api`, `/server/api/docs`). */
  publicServerPath: string;
};

export default registerAs(
  "app",
  (): AppConfig => {
    const environment = process.env.NODE_ENV ?? "development";
    const csrfEnabled = process.env.CSRF_ENABLED === "true";
    const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:8088")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    return {
      environment,
      name: process.env.APP_NAME ?? "Template",
      serviceName: process.env.SERVICE_NAME ?? "template-server",
      appUrl: process.env.APP_URL ?? corsOrigins[0] ?? "http://localhost:8088/app",
      host: process.env.HOST ?? "0.0.0.0",
      port: Number(process.env.PORT ?? 3000),
      corsOrigins,
      cookieSecret: process.env.COOKIE_SECRET,
      csrfEnabled,
      apiDocsEnabled:
        process.env.API_DOCS_ENABLED !== undefined
          ? process.env.API_DOCS_ENABLED === "true"
          : environment !== "production",
      clientStaticDir: process.env.CLIENT_STATIC_DIR,
      publicServerPath: (
        process.env.SERVER_PUBLIC_PATH ?? "/server"
      ).replace(/\/$/, "") || "/server",
    };
  },
);
