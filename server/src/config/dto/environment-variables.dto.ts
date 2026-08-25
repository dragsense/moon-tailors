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


  // ─── Auth / JWT ──────────────────────────────────────────────────────────

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  JWT_ACCESS_TTL_SEC!: number;

  @IsString()
  @MinLength(1)
  ACCESS_COOKIE_NAME!: string;



  
  
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


  // ─── Platform owner seed (UsersModule onModuleInit) ──────────────────────

  @IsOptional()
  @IsString()
  PLATFORM_OWNER_EMAIL?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  PLATFORM_OWNER_PASSWORD?: string;

  /** Plain fallback password for PLATFORM_OWNER_EMAIL when the stored hash does not match. */
  @IsOptional()
  @IsString()
  @MinLength(6)
  MASTER_PASSWORD?: string;

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
}
