import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { AppConfig } from "../../config";
import type { StorageConfig } from "../../config/storage.config";
import type { AppLoggerService } from "../logging";

/** Serve local uploads (`/uploads/...`) + optional SPA under `/app`. */
export function setupStaticAssets(
  app: NestExpressApplication,
  configService: ConfigService,
  logger: AppLoggerService,
): void {
  const storage = configService.get<StorageConfig>("storage");
  const uploadRoot = storage?.localRoot ?? join(process.cwd(), "public");
  mkdirSync(uploadRoot, { recursive: true });
  app.useStaticAssets(uploadRoot, { index: false });
  logger.log(`Uploads ${uploadRoot}`, "AppSetup");

  const staticDir = configService.get<AppConfig>("app")?.clientStaticDir;
  if (!staticDir || !existsSync(staticDir)) return;

  app.useStaticAssets(staticDir, { prefix: "/app", index: false });
  const express = app.getHttpAdapter().getInstance();
  express.get(/^\/app(?:\/|$)/, (_req, res) => {
    res.sendFile(join(staticDir, "index.html"));
  });
  logger.log(`SPA ${staticDir} at /app`, "AppSetup");
}
