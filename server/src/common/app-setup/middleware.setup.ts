import type { INestApplication } from "@nestjs/common";
import { RequestContextMiddleware } from "../context";
import { HttpLoggingMiddleware } from "../logging";
import {
  TenantMiddleware,
} from "../tenant";

/**
 * Register HTTP middleware early, in order:
 * 1. request context (ALS + X-Request-Id)
 * 2. tenantId extraction
 * 3. access logging (uses that context)
 */
export function setupMiddleware(app: INestApplication): void {
  const requestContext = app.get(RequestContextMiddleware);
  const tenant = app.get(TenantMiddleware);
  const httpLogging = app.get(HttpLoggingMiddleware);

  app.use(requestContext.use.bind(requestContext));
  app.use(tenant.use.bind(tenant));
  app.use(httpLogging.use.bind(httpLogging));
}
