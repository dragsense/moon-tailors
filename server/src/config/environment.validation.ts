import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import {
  Environment,
  EnvironmentVariables,
} from "./dto/environment-variables.dto";

/** Dev-safe defaults merged under `input` so partial env still validates. */
function buildDefaults(
  nodeEnv: string,
  isProduction: boolean,
): Record<string, unknown> {
  return {
    NODE_ENV: nodeEnv,
    SERVICE_NAME: "moon-tailors-server",
    APP_NAME: "Moon Tailors",
    APP_URL: "http://localhost:8088/app",
    HOST: "0.0.0.0",
    PORT: 3000,
    CORS_ORIGIN: "http://localhost:8088",
    COOKIE_SECRET: "dev-cookie-secret-change-me",
    API_DOCS_ENABLED: !isProduction,
    CSRF_ENABLED: isProduction,
    DATABASE_URL: "postgres://postgres:postgres@localhost:5433/moon_tailors_db",
    REDIS_URL: "redis://localhost:6379",
    TYPEORM_SYNC: !isProduction,
    APP_MODE: "single_user",
    DB_MODE: "single",
    JWT_SECRET: isProduction
      ? undefined
      : "dev-jwt-secret-change-me-32chars!!",
    JWT_ACCESS_TTL_SEC: 604800,
    ACCESS_COOKIE_NAME: "access_token",
    CLUSTER_ENABLED: false,
    ACTIVITY_LOGS_ENABLED: false,
    EVENTS_ENABLED: false,
    CACHE_ENABLED: false,
    CACHE_PREFIX: "moon-tailors",
    CACHE_DEFAULT_TTL: 300,
    STORAGE_DRIVER: "local",
   
  };
}

export function validateEnvironment(
  input: Record<string, unknown>,
): EnvironmentVariables {
  const nodeEnv = String(input.NODE_ENV ?? Environment.Development);
  const isProduction = nodeEnv === Environment.Production;

  const values = {
    ...buildDefaults(nodeEnv, isProduction),
    ...input,
  };

  const environment = plainToInstance(EnvironmentVariables, values, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(environment, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return environment;
}
