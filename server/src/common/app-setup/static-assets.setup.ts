import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { AppConfig } from "../../config";
import type { AppLoggerService } from "../logging";

/** Optional SPA under `/app` when Nest serves the built client. */
export function setupStaticAssets(
  app: NestExpressApplication,
  configService: ConfigService,
  logger: AppLoggerService,
): void {
  const staticDir = configService.get<AppConfig>("app")?.clientStaticDir;
  if (!staticDir || !existsSync(staticDir)) return;

  app.useStaticAssets(staticDir, { prefix: "/app", index: false });
  const express = app.getHttpAdapter().getInstance();
  express.get(/^\/app(?:\/|$)/, (_req, res) => {
    res.sendFile(join(staticDir, "index.html"));
  });
  logger.log(`SPA ${staticDir} at /app`, "AppSetup");
}
