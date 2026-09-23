import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimits, clientKey, rateLimit } from "@/server/ratelimit";

beforeEach(() => __resetRateLimits());

function req(ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rateLimit", () => {
  it("allows up to the limit then rejects with retryAfterMs", async () => {
    expect((await rateLimit("k1", 2, 60_000)).ok).toBe(true);
    expect((await rateLimit("k1", 2, 60_000)).ok).toBe(true);
    const third = await rateLimit("k1", 2, 60_000);
    expect(third.ok).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it("isolates buckets per key", async () => {
    expect((await rateLimit("a", 1, 60_000)).ok).toBe(true);
    expect((await rateLimit("b", 1, 60_000)).ok).toBe(true);
    expect((await rateLimit("a", 1, 60_000)).ok).toBe(false);
  });

  it("falls back to memory without REDIS_URL", async () => {
    delete process.env.REDIS_URL;
    const { __resetRedis } = await import("@/server/redis");
    __resetRedis();
    expect((await rateLimit("mem", 1, 60_000)).ok).toBe(true);
    expect((await rateLimit("mem", 1, 60_000)).ok).toBe(false);
  });
});

describe("clientKey", () => {
  it("prefers the session address", () => {
    expect(clientKey(req(), "0xABC")).toBe("0xabc");
  });

  it("falls back to the forwarded IP", () => {
    expect(clientKey(req("9.9.9.9"))).toBe("ip:9.9.9.9");
  });
});
