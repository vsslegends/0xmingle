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
      // Fail fast per command so callers degrade to in-memory fallbacks
      // instead of hanging; the client reconnects in the background.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      // Reconnect with capped backoff (gateway is long-lived; keep trying).
      // NOTE: previously lazyConnect:true was set here without ever calling
      // connect() — every command threw "Connection is closed" and the app
      // silently ran single-instance even with REDIS_URL set. Eager connect
      // (default) dials in the background; construction never blocks.
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });
    client.on("ready", () => {
      warned = false;
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
