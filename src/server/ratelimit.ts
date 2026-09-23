import { randomBytes } from "crypto";
import { redis } from "@/server/redis";

/**
 * Rate limiter. Uses shared Redis when REDIS_URL is set (multi-instance
 * safe), otherwise an in-memory fallback (single instance). Never throws —
 * a Redis failure degrades to memory rather than blocking traffic.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || cur.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (cur.count >= limit) {
    return { ok: false, retryAfterMs: cur.resetAt - now };
  }
  cur.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterMs: number }> {
  const r = redis();
  if (r) {
    const k = `rl:${key}`;
    try {
      const count = await r.incr(k);
      if (count === 1) await r.pexpire(k, windowMs);
      if (count > limit) {
        const ttl = await r.pttl(k);
        return { ok: false, retryAfterMs: Math.max(0, ttl) };
      }
      return { ok: true, retryAfterMs: 0 };
    } catch {
      // Redis down mid-flight: degrade to memory, don't 500 the request.
      return memoryLimit(key, limit, windowMs);
    }
  }
  return memoryLimit(key, limit, windowMs);
}

export function randomNonce(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Best-effort client key for API rate limits: session address when signed
 * in, else the forwarded IP. Single-instance in-memory; use Redis in prod.
 */
export function clientKey(req: Request, sessionAddress?: string): string {
  if (sessionAddress) return sessionAddress.toLowerCase();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `ip:${ip}`;
}

/** Test hook — clears in-process buckets. */
export function __resetRateLimits(): void {
  hits.clear();
}
