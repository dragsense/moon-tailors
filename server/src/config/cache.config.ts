import { registerAs } from "@nestjs/config";
import { parseRedisUrl, type RedisConnection } from "./redis.utils";

export type CacheConfig = {
  enabled: boolean;
  /** Redis connection (defaults to REDIS_URL; CACHE_DB can override db). */
  redis: RedisConnection;
  /** Default TTL in seconds. */
  defaultTtl: number;
  /** Key namespace prefix, e.g. template:users:… */
  prefix: string;
};

export default registerAs(
  "cache",
  (): CacheConfig => {
    const redis = parseRedisUrl(process.env.REDIS_URL);
    if (process.env.CACHE_HOST) redis.host = process.env.CACHE_HOST;
    if (process.env.CACHE_PORT) redis.port = Number(process.env.CACHE_PORT);
    if (process.env.CACHE_PASSWORD) redis.password = process.env.CACHE_PASSWORD;
    if (process.env.CACHE_DB !== undefined && process.env.CACHE_DB !== "") {
      redis.db = Number(process.env.CACHE_DB);
    }

    return {
      enabled: process.env.CACHE_ENABLED === "true",
      redis,
      defaultTtl: Number(process.env.CACHE_DEFAULT_TTL || 300),
      prefix: process.env.CACHE_PREFIX || "template",
    };
  },
);
