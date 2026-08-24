import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { setupMiddleware, setupStaticAssets } from "./common/app-setup";
import { setupApiDocumentation } from "./common/docs";
import { setupCors, setupSecurity } from "./common/security";
import { AppLoggerService } from "./common/logging";
import type { AppConfig, MqttConfig } from "./config";

export async function startApplication(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  const config = app.get(ConfigService);
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  setupCors(app, config);
  setupMiddleware(app);
  setupSecurity(app, config);
  app.setGlobalPrefix("api");
  setupApiDocumentation(app, config, logger);
  setupStaticAssets(app, config, logger);

  const appConfig = config.getOrThrow<AppConfig>("app");
  app.enableShutdownHooks();
  await app.listen(appConfig.port, appConfig.host);
  logger.log(
    `API http://${appConfig.host}:${appConfig.port}/api`,
    "AppSetup",
  );

  const board = config.get<{ enabled: boolean; route: string }>("bullBoard");
  if (board?.enabled) {
    const path = board.route.replace(/^\//, "");
    logger.log(
      `Bull Board http://${appConfig.host}:${appConfig.port}/api/${path}`,
      "AppSetup",
    );
  }
}
