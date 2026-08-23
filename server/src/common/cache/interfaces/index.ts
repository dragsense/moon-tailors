import type { CacheOptions } from "../types";

/** Redis-backed cache contract (implemented by CacheService). */
export interface ICacheService {
  isOperational(): boolean;
  get<T = unknown>(key: string, options?: CacheOptions): Promise<T | null>;
  set<T = unknown>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<void>;
  del(key: string, options?: CacheOptions): Promise<boolean>;
  exists(key: string, options?: CacheOptions): Promise<boolean>;
  getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T>;
  clearPrefix(prefix?: string): Promise<number>;
}
