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
    SERVICE_NAME: "template-server",
    APP_NAME: "Template",
    APP_URL: "http://localhost:8088/app",
    HOST: "0.0.0.0",
    PORT: 3000,
    CORS_ORIGIN: "http://localhost:8088",
    COOKIE_SECRET: "dev-cookie-secret-change-me",
    API_DOCS_ENABLED: !isProduction,
    CSRF_ENABLED: isProduction,
    DATABASE_URL: "postgres://postgres:postgres@localhost:5433/template_db",
    REDIS_URL: "redis://localhost:6379",
    TYPEORM_SYNC: !isProduction,
    APP_MODE: "single_user",
    DB_MODE: "single",
    JWT_SECRET: isProduction
      ? undefined
      : "dev-jwt-secret-change-me-32chars!!",
    JWT_ACCESS_TTL_SEC: 900,
    JWT_REFRESH_TTL_SEC: 604800,
    REFRESH_COOKIE_NAME: "refresh_token",
    OTP_TTL_MS: 300000,
    OTP_MAX_ATTEMPTS: 5,
    AUTH_LOGIN_PASSWORD_OTP: true,
    AUTH_LOGIN_EMAIL_OTP: true,
    AUTH_PASSWORD_RESET_MODE: "otp",
    AUTH_PASSWORD_RESET_PATH: "reset-password",
    AUTH_PASSWORD_RESET_LINK_TTL_SEC: 900,
    AUTH_API_KEY_ENABLED: true,
    AUTH_API_KEY_PREFIX: "tk_",
    ENCRYPTION_ENABLED: false,
    DB_ENCRYPTION_ENABLED: false,
    ENCRYPTION_ALGORITHM: "aes-256-gcm",
    ENCRYPTION_AAD: "WEB-API",
    ENCRYPTION_ITERATIONS: 100000,
    CLUSTER_ENABLED: false,
    ACTIVITY_LOGS_ENABLED: false,
    EVENTS_ENABLED: false,
    CACHE_ENABLED: false,
    CACHE_PREFIX: "template",
    CACHE_DEFAULT_TTL: 300,
    BULL_BOARD_ENABLED: !isProduction,
    BULL_BOARD_ROUTE: "queues",
    MQTT_ENABLED: false,
    MAIL_ENABLED: false,
    STORAGE_DRIVER: "local",
    DEFAULT_PAYMENT_PROCESSOR: "stripe",
    DEFAULT_AI_PROCESSOR: "openai",
    STRIPE_ENABLED: false,
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
