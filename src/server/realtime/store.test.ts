import { afterEach, describe, expect, it } from "vitest";
import {
  InMemoryPresenceStore,
  RedisPresenceStore,
  createPresenceStore,
} from "@/server/realtime/store";
import { __resetRedis } from "@/server/redis";

const ADDR = "0xAbC1230000000000000000000000000000000DeF";

afterEach(() => {
  delete process.env.REDIS_URL;
  __resetRedis();
});

describe("InMemoryPresenceStore", () => {
  it("tracks online/offline per connection", async () => {
    const s = new InMemoryPresenceStore();
    expect(await s.isOnline(ADDR)).toBe(false);
    await s.setOnline(ADDR, "c1");
    await s.setOnline(ADDR, "c2");
    expect(await s.isOnline(ADDR)).toBe(true);
    await s.setOffline(ADDR, "c1");
    expect(await s.isOnline(ADDR)).toBe(true);
    await s.setOffline(ADDR, "c2");
    expect(await s.isOnline(ADDR)).toBe(false);
  });

  it("grants locks exclusively with TTL expiry", async () => {
    const s = new InMemoryPresenceStore();
    expect(await s.acquireLock("k", 50)).toBe(true);
    expect(await s.acquireLock("k", 50)).toBe(false);
    await s.releaseLock("k");
    expect(await s.acquireLock("k", 50)).toBe(true);
  });

  it("defaults risk to NORMAL and stores escalations", async () => {
    const s = new InMemoryPresenceStore();
    expect(await s.getRisk(ADDR)).toBe("NORMAL");
    await s.setRisk(ADDR, "BANNED");
    expect(await s.getRisk(ADDR)).toBe("BANNED");
  });
});

describe("createPresenceStore", () => {
  it("returns in-memory when REDIS_URL is unset", () => {
    expect(createPresenceStore()).toBeInstanceOf(InMemoryPresenceStore);
  });

  it("returns Redis store when REDIS_URL is set", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    expect(createPresenceStore()).toBeInstanceOf(RedisPresenceStore);
  });
});

describe("RedisPresenceStore fallback", () => {
  // Nothing listens on 9 (discard) — connection refused immediately,
  // so every op must degrade to in-memory without throwing.
  function unreachable(): RedisPresenceStore {
    process.env.REDIS_URL = "redis://127.0.0.1:9";
    return new RedisPresenceStore();
  }

  it("presence works via fallback when Redis is unreachable", async () => {
    const s = unreachable();
    await s.setOnline(ADDR, "c1");
    expect(await s.isOnline(ADDR)).toBe(true);
    await s.setOffline(ADDR, "c1");
    expect(await s.isOnline(ADDR)).toBe(false);
  });

  it("locks stay exclusive via fallback when Redis is unreachable", async () => {
    const s = unreachable();
    expect(await s.acquireLock("k", 60_000)).toBe(true);
    expect(await s.acquireLock("k", 60_000)).toBe(false);
    await s.releaseLock("k");
    expect(await s.acquireLock("k", 60_000)).toBe(true);
  });

  it("risk cache works via fallback when Redis is unreachable", async () => {
    const s = unreachable();
    expect(await s.getRisk(ADDR)).toBe("NORMAL");
    await s.setRisk(ADDR, "TEMP_BLOCKED");
    expect(await s.getRisk(ADDR)).toBe("TEMP_BLOCKED");
  });

  it("constructor without a client degrades to pure in-memory", async () => {
    const s = new RedisPresenceStore(null);
    await s.setOnline(ADDR, "c1");
    expect(await s.isOnline(ADDR)).toBe(true);
    await s.setRisk(ADDR, "BANNED");
    expect(await s.getRisk(ADDR)).toBe("BANNED");
  });
});
