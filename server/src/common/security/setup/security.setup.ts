import type { INestApplication } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import type { AppConfig } from "../../../config";
import type { SecuritySkipConfig } from "../../../config/security-skip.config";
import { csrfMiddleware } from "../csrf";

/** Cookie parser + CSRF synchronizer + hide X-Powered-By. */
export function setupSecurity(
  app: INestApplication,
  configService: ConfigService,
): void {
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.set?.("trust proxy", true);

  const appConfig = configService.getOrThrow<AppConfig>("app");
  const skip = configService.getOrThrow<SecuritySkipConfig>("securitySkip");

  app.use(cookieParser(appConfig.cookieSecret || undefined));
  app.use(
    csrfMiddleware({
      enabled: appConfig.csrfEnabled,
      cookieSecret: appConfig.cookieSecret,
      secure: appConfig.environment === "production",
      publicServerPath: appConfig.publicServerPath,
      skipPaths: skip.csrfSkipPaths,
      protectedPaths: skip.csrfProtectedPaths,
    }),
  );
  httpAdapter.disable?.("x-powered-by");
}
