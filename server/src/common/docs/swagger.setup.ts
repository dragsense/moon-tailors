import type { INestApplication } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import type { AppConfig } from "../../config";
import type { ScalarConfig } from "../../config/scalar.config";
import type { AppLoggerService } from "../logging";

/**
 * Mount Scalar OpenAPI UI at `/api/docs`.
 * Gateway: `/server/api/docs`. Nest already uses global prefix `api`, so the
 * OpenAPI server is `/server/api` and paths stay `/health` (not `/api/health`).
 */
export function setupApiDocumentation(
  app: INestApplication,
  configService: ConfigService,
  logger: AppLoggerService,
): void {
  const appConfig = configService.get<AppConfig>("app");
  if (!appConfig?.apiDocsEnabled) return;

  const scalar = configService.get<ScalarConfig>("scalar");
  const title = scalar?.title || "Moon Tailors API";
  const description =
    scalar?.description || "Moon Tailors API with shared Zod contracts";
  const port = appConfig.port ?? 3000;
  const publicApiPath = `${appConfig.publicServerPath}/api`;

  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion("0.1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Session JWT (cookie or Authorization: Bearer).",
        in: "header",
      },
      "access-token",
    )
    .addServer(publicApiPath, "API")
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: true,
  });

  app.use(
    "/api/docs",
    apiReference({
      content: document,
      title,
      meta: {
        description,
      },
    }),
  );

  SwaggerModule.setup("swagger-docs", app, document);

  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === "express") {
    const instance = httpAdapter.getInstance();
    instance.get(
      "/api/docs-json",
      (
        _req: unknown,
        res: {
          setHeader: (k: string, v: string) => void;
          send: (b: unknown) => void;
        },
      ) => {
        res.setHeader("Content-Type", "application/json");
        res.send(document);
      },
    );
  }

  logger.log(
    `Scalar API documentation available at: http://localhost:${port}/api/docs`,
    "Docs",
  );
  logger.log(
    `OpenAPI JSON available at: http://localhost:${port}/api/docs-json`,
    "Docs",
  );
}
