import type { INestApplication } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import type { AppConfig } from "../../config";
import type { ScalarConfig } from "../../config/scalar.config";
import type { AppLoggerService } from "../logging";

/**
 * Mount Scalar OpenAPI UI at `/api/docs` when API_DOCS_ENABLED
 * (same pattern as Vivast: Scalar UI + docs-json + optional swagger UI).
 * Gateway path: `/server/api/docs` (no nginx rewrite).
 */
export function setupApiDocumentation(
  app: INestApplication,
  configService: ConfigService,
  logger: AppLoggerService,
): void {
  if (!configService.get<AppConfig>("app")?.apiDocsEnabled) return;

  const scalar = configService.get<ScalarConfig>("scalar");
  const title = scalar?.title || "Template API";
  const description =
    scalar?.description || "Backend template with shared Zod contracts";
  const port = configService.get<AppConfig>("app")?.port ?? 3000;

  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion("0.1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT or API key",
        description:
          "Session JWT, or user API key (`tk_…`). Prefer X-Api-Key for machine clients.",
        in: "header",
      },
      "access-token",
    )
    .addApiKey(
      {
        type: "apiKey",
        name: "X-Api-Key",
        in: "header",
        description: "User API key (alternative to Bearer)",
      },
      "api-key",
    )
    .addServer("/api", "API")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    "/api/docs",
    apiReference({
      content: document,
      routePrefix: "/api",
      title,
      meta: {
        description,
      },
    }),
  );

  // Keep Swagger UI available for tools that expect it
  SwaggerModule.setup("api/swagger-docs", app, document);

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
