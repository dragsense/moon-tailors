import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { CacheConfig } from "../../../config";
import type { ICacheService } from "../interfaces";
import type { CacheOptions } from "../types";

/**
 * Redis-backed cache (API).
 * When CACHE_ENABLED=false, get returns null and set/del are no-ops;
 * getOrSet still runs the factory.
 */
@Injectable()
export class CacheService
  implements OnModuleInit, OnModuleDestroy, ICacheService
{
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private enabled = false;
  private prefix = "template";
  private defaultTtl = 300;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const cache = this.config.getOrThrow<CacheConfig>("cache");
    this.enabled = cache.enabled;
    this.prefix = cache.prefix;
    this.defaultTtl = cache.defaultTtl;

    if (!this.enabled) {
      this.logger.warn("Cache disabled (CACHE_ENABLED≠true)");
      return;
    }

    this.client = new Redis({
      host: cache.redis.host,
      port: cache.redis.port,
      password: cache.redis.password,
      db: cache.redis.db,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
    });

    try {
      await this.client.connect();
      this.logger.log(
        `Cache connected redis://${cache.redis.host}:${cache.redis.port}/${cache.redis.db} prefix=${this.prefix}`,
      );
    } catch (error) {
      this.logger.error("Cache Redis connect failed", error);
      this.client.disconnect();
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
      this.client = null;
    }
  }

  isOperational(): boolean {
    return this.enabled && !!this.client;
  }

  private key(key: string, prefix?: string): string {
    return `${prefix || this.prefix}:${key}`;
  }

  async get<T = unknown>(
    key: string,
    options?: CacheOptions,
  ): Promise<T | null> {
    if (!this.isOperational() || !this.client) return null;
    const full = this.key(key, options?.prefix);
    try {
      const raw = await this.client.get(full);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.error(`Cache GET ${full}`, error);
      return null;
    }
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<void> {
    if (!this.isOperational() || !this.client) return;
    const full = this.key(key, options?.prefix);
    const ttl = options?.ttl ?? this.defaultTtl;
    try {
      const payload = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.set(full, payload, "EX", ttl);
      } else {
        await this.client.set(full, payload);
      }
    } catch (error) {
      this.logger.error(`Cache SET ${full}`, error);
    }
  }

  async del(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isOperational() || !this.client) return false;
    const full = this.key(key, options?.prefix);
    try {
      await this.client.del(full);
      return true;
    } catch (error) {
      this.logger.error(`Cache DEL ${full}`, error);
      return false;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const value = await this.get(key, options);
    return value !== null;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    if (!this.isOperational()) {
      return factory();
    }
    const cached = await this.get<T>(key, options);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /** Delete all keys under prefix (SCAN + DEL). Use carefully. */
  async clearPrefix(prefix?: string): Promise<number> {
    if (!this.isOperational() || !this.client) return 0;
    const pattern = `${prefix || this.prefix}:*`;
    let cursor = "0";
    let removed = 0;
    do {
      const [next, keys] = await this.client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = next;
      if (keys.length) {
        removed += await this.client.del(...keys);
      }
    } while (cursor !== "0");
    return removed;
  }
}
