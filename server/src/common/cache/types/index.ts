/** Options for CacheService get/set/del. */
export type CacheOptions = {
  /** TTL in seconds. */
  ttl?: number;
  /** Override global key prefix. */
  prefix?: string;
};

/** `@CacheEvict` metadata payload. */
export type CacheEvictMetadata = {
  keys: string | string[];
  prefix?: string;
};

/** Minimal HTTP request shape used by CacheInterceptor key templates. */
export type CacheHttpRequest = {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  user?: Record<string, unknown>;
};
