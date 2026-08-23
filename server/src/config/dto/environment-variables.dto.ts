import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

export enum Environment {
  Development = "development",
  Production = "production",
  Staging = "staging",
  Test = "test",
}

const ToBoolean = () =>
  Transform(({ value }) => {
    if (typeof value === "boolean") return value;
    return String(value).toLowerCase() === "true";
  });

/**
 * Validated process.env shape. Required = needed for a healthy app boot
 * (DB, Redis/Bull, JWT, core flags). Integration secrets stay optional.
 */
export class EnvironmentVariables {
  // ─── Core ───────────────────────────────────────────────────────────────

  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsString()
  @MinLength(1)
  SERVICE_NAME!: string;

  @IsString()
  @MinLength(1)
  APP_NAME!: string;

  @IsString()
  @MinLength(1)
  APP_URL!: string;

  @IsString()
  HOST!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  PORT!: number;

  @IsString()
  @MinLength(1)
  CORS_ORIGIN!: string;

  @IsString()
  @MinLength(16)
  COOKIE_SECRET!: string;

  @ToBoolean()
  @IsBoolean()
  API_DOCS_ENABLED!: boolean;

  @ToBoolean()
  @IsBoolean()
  CSRF_ENABLED!: boolean;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  /** Required — Bull queues + schedule always connect to Redis. */
  @IsString()
  @MinLength(1)
  REDIS_URL!: string;

  @ToBoolean()
  @IsBoolean()
  TYPEORM_SYNC!: boolean;

  @IsIn(["single_user", "single_domain_tenant", "multi_domain_tenant"])
  APP_MODE!: string;

  @IsIn(["single", "multi-database"])
  DB_MODE!: string;

  @IsOptional()
  @IsString()
  RESERVED_SUBDOMAINS?: string;

  // ─── Auth / JWT ──────────────────────────────────────────────────────────

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  JWT_ACCESS_TTL_SEC!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  JWT_REFRESH_TTL_SEC!: number;

  @IsString()
  @MinLength(1)
  REFRESH_COOKIE_NAME!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  OTP_TTL_MS!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  OTP_MAX_ATTEMPTS!: number;

  @ToBoolean()
  @IsBoolean()
  AUTH_LOGIN_PASSWORD_OTP!: boolean;

  @ToBoolean()
  @IsBoolean()
  AUTH_LOGIN_EMAIL_OTP!: boolean;

  @IsIn(["otp", "link"])
  AUTH_PASSWORD_RESET_MODE!: "otp" | "link";

  @IsString()
  @MinLength(1)
  AUTH_PASSWORD_RESET_PATH!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  AUTH_PASSWORD_RESET_LINK_TTL_SEC!: number;

  @ToBoolean()
  @IsBoolean()
  AUTH_API_KEY_ENABLED!: boolean;

  @IsString()
  @MinLength(1)
  AUTH_API_KEY_PREFIX!: string;

  // ─── Encryption ──────────────────────────────────────────────────────────

  /** Encrypt API JSON responses (client decrypts with matching key). */
  @ToBoolean()
  @IsBoolean()
  ENCRYPTION_ENABLED!: boolean;

  /** Encrypt sensitive DB columns at rest (TypeORM transformer / encryptField). */
  @ToBoolean()
  @IsBoolean()
  DB_ENCRYPTION_ENABLED!: boolean;

  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.ENCRYPTION_ENABLED || env.DB_ENCRYPTION_ENABLED,
  )
  @IsString()
  @MinLength(32)
  ENCRYPTION_KEY?: string;

  @IsString()
  @MinLength(1)
  ENCRYPTION_ALGORITHM!: string;

  @IsString()
  @MinLength(1)
  ENCRYPTION_AAD!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  ENCRYPTION_ITERATIONS!: number;

  // ─── Cluster ─────────────────────────────────────────────────────────────

  @ToBoolean()
  @IsBoolean()
  CLUSTER_ENABLED!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  CLUSTER_WORKERS?: number;

  @IsOptional()
  @IsString()
  CLIENT_STATIC_DIR?: string;

  // ─── Feature flags ───────────────────────────────────────────────────────

  @ToBoolean()
  @IsBoolean()
  ACTIVITY_LOGS_ENABLED!: boolean;

  @ToBoolean()
  @IsBoolean()
  EVENTS_ENABLED!: boolean;

  @ToBoolean()
  @IsBoolean()
  CACHE_ENABLED!: boolean;

  @IsString()
  @MinLength(1)
  CACHE_PREFIX!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  CACHE_DEFAULT_TTL!: number;

  @ToBoolean()
  @IsBoolean()
  BULL_BOARD_ENABLED!: boolean;

  @IsString()
  @MinLength(1)
  BULL_BOARD_ROUTE!: string;

  @IsOptional()
  @IsString()
  BULL_BOARD_USER?: string;

  @IsOptional()
  @IsString()
  BULL_BOARD_PASSWORD?: string;

  // ─── MQTT (required when enabled) ────────────────────────────────────────

  @ToBoolean()
  @IsBoolean()
  MQTT_ENABLED!: boolean;

  @ValidateIf((env: EnvironmentVariables) => env.MQTT_ENABLED)
  @IsString()
  @MinLength(1)
  MQTT_URL?: string;

  @IsOptional()
  @IsString()
  MQTT_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  MQTT_PUBLISHER_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  MQTT_TOPICS?: string;

  // ─── Mail (required when enabled) ────────────────────────────────────────

  @ToBoolean()
  @IsBoolean()
  MAIL_ENABLED!: boolean;

  @ValidateIf((env: EnvironmentVariables) => env.MAIL_ENABLED)
  @IsString()
  @MinLength(1)
  MAIL_HOST?: string;

  @ValidateIf((env: EnvironmentVariables) => env.MAIL_ENABLED)
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  MAIL_PORT?: number;

  @ValidateIf((env: EnvironmentVariables) => env.MAIL_ENABLED)
  @IsString()
  @MinLength(1)
  MAIL_FROM?: string;

  @IsOptional()
  @IsString()
  MAIL_ADMIN_EMAIL?: string;

  // ─── Platform owner seed (UsersModule onModuleInit) ──────────────────────

  @IsOptional()
  @IsString()
  PLATFORM_OWNER_EMAIL?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  PLATFORM_OWNER_PASSWORD?: string;

  @IsOptional()
  @IsString()
  PLATFORM_OWNER_FIRST_NAME?: string;

  @IsOptional()
  @IsString()
  PLATFORM_OWNER_LAST_NAME?: string;

  @IsOptional()
  @IsString()
  MAIL_USER?: string;

  @IsOptional()
  @IsString()
  MAIL_PASS?: string;

  // ─── IMAP receive (optional email inbox) ─────────────────────────────────

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  MAIL_IMAP_ENABLED?: boolean;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  MAIL_IMAP_SYNC_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  MAIL_IMAP_HOST?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  MAIL_IMAP_PORT?: number;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  MAIL_IMAP_SECURE?: boolean;

  @IsOptional()
  @IsString()
  MAIL_IMAP_USER?: string;

  @IsOptional()
  @IsString()
  MAIL_IMAP_PASS?: string;

  @IsOptional()
  @IsString()
  MAIL_IMAP_INBOX_FOLDER?: string;

  // ─── File storage (S3 fields required when STORAGE_DRIVER=s3) ─────────────

  @IsIn(["local", "s3"])
  STORAGE_DRIVER!: "local" | "s3";

  @IsOptional()
  @IsString()
  UPLOAD_PUBLIC_BASE_URL?: string;

  @IsOptional()
  @IsString()
  UPLOAD_LOCAL_ROOT?: string;

  @ValidateIf((env: EnvironmentVariables) => env.STORAGE_DRIVER === "s3")
  @IsString()
  @MinLength(1)
  AWS_ACCESS_KEY_ID?: string;

  @ValidateIf((env: EnvironmentVariables) => env.STORAGE_DRIVER === "s3")
  @IsString()
  @MinLength(1)
  AWS_SECRET_ACCESS_KEY?: string;

  @ValidateIf((env: EnvironmentVariables) => env.STORAGE_DRIVER === "s3")
  @IsString()
  @MinLength(1)
  AWS_REGION?: string;

  @ValidateIf((env: EnvironmentVariables) => env.STORAGE_DRIVER === "s3")
  @IsString()
  @MinLength(1)
  AWS_S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  AWS_S3_PUBLIC_URL?: string;

  @IsOptional()
  @IsString()
  AWS_S3_ENDPOINT?: string;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  AWS_S3_FORCE_PATH_STYLE?: boolean;

  // ─── Processors ──────────────────────────────────────────────────────────

  @IsIn(["stripe", "paysafe", "cash", "other"])
  DEFAULT_PAYMENT_PROCESSOR!: string;

  @IsIn(["openai", "anthropic", "gemini", "other"])
  DEFAULT_AI_PROCESSOR!: string;

  /** When true, Stripe secret + publishable keys are required. */
  @ToBoolean()
  @IsBoolean()
  STRIPE_ENABLED!: boolean;

  @ValidateIf((env: EnvironmentVariables) => env.STRIPE_ENABLED)
  @IsString()
  @MinLength(1)
  STRIPE_SECRET_KEY?: string;

  @ValidateIf((env: EnvironmentVariables) => env.STRIPE_ENABLED)
  @IsString()
  @MinLength(1)
  STRIPE_PUBLISHABLE_KEY?: string;

  @ValidateIf((env: EnvironmentVariables) => env.STRIPE_ENABLED)
  @IsString()
  @MinLength(1)
  STRIPE_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  OPENAI_MODEL?: string;

  @IsOptional()
  @IsString()
  ANTHROPIC_API_KEY?: string;

  @IsOptional()
  @IsString()
  ANTHROPIC_MODEL?: string;

  @IsOptional()
  @IsString()
  GEMINI_API_KEY?: string;

  @IsOptional()
  @IsString()
  GEMINI_MODEL?: string;

  // ─── Twilio SMS (optional) ───────────────────────────────────────────────

  @IsOptional()
  @IsString()
  TWILIO_ACCOUNT_SID?: string;

  @IsOptional()
  @IsString()
  TWILIO_AUTH_TOKEN?: string;

  @IsOptional()
  @IsString()
  TWILIO_PHONE_NUMBER?: string;

  @IsOptional()
  @IsString()
  TWILIO_SMS_WEBHOOK_URL?: string;

  @IsOptional()
  @IsString()
  TWILIO_SMS_WEBHOOK_FALLBACK_URL?: string;

  // ─── Push (optional) ─────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  VAPID_PUBLIC_KEY?: string;

  @IsOptional()
  @IsString()
  VAPID_PRIVATE_KEY?: string;

  @IsOptional()
  @IsString()
  VAPID_EMAIL?: string;

  @IsOptional()
  @IsString()
  FIREBASE_PROJECT_ID?: string;

  @IsOptional()
  @IsString()
  FIREBASE_CLIENT_EMAIL?: string;

  @IsOptional()
  @IsString()
  FIREBASE_PRIVATE_KEY?: string;
}
