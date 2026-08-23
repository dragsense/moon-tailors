/**
 * Shared Redis URL parsing for Bull queues and CacheModule.
 */
export type RedisConnection = {
  host: string;
  port: number;
  password?: string;
  db: number;
};

export function parseRedisUrl(url?: string): RedisConnection {
  const fallback: RedisConnection = {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
  };
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    const pathDb = parsed.pathname?.replace(/^\//, "");
    return {
      host: parsed.hostname || fallback.host,
      port: parsed.port ? Number(parsed.port) : fallback.port,
      password: parsed.password || fallback.password,
      db: pathDb ? Number(pathDb) || 0 : fallback.db,
    };
  } catch {
    return fallback;
  }
}

export function redisConnectionToUrl(conn: RedisConnection): string {
  const auth = conn.password
    ? `:${encodeURIComponent(conn.password)}@`
    : "";
  return `redis://${auth}${conn.host}:${conn.port}/${conn.db}`;
}
