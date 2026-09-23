import IORedis from "ioredis";

/**
 * Shared Redis client (optional). Set REDIS_URL in production for
 * multi-instance rate limits; without it everything falls back to
 * in-memory single-instance limiters. Never throws — returns null
 * when unconfigured or unreachable.
 */
let client: IORedis | null = null;
let warned = false;

export function redis(): IORedis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!client) {
    client = new IORedis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    client.on("error", () => {
      if (!warned) {
        warned = true;
        console.warn("[redis] unavailable — using in-memory fallbacks");
      }
    });
  }
  return client;
}

/** Test hook — forget the cached client (e.g. between tests). */
export function __resetRedis(): void {
  const c = client;
  client = null;
  warned = false;
  try {
    void c?.quit().catch(() => {});
  } catch {
    /* ignore */
  }
}
