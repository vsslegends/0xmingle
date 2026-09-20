import { randomBytes } from "crypto";

/** Tiny in-memory rate limiter. Swapped for Redis in production deploy. */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
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

export function randomNonce(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}
