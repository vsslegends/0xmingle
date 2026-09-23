/**
 * Presence/session store abstraction.
 * Default: in-memory (dev + single-instance). When REDIS_URL is set,
 * RedisPresenceStore shares presence, locks, and risk cache across
 * gateway instances. Redis failures always degrade to an embedded
 * in-memory fallback — the gateway never blocks on the store.
 */
import { randomUUID } from "node:crypto";
import type IORedis from "ioredis";
import { redis } from "@/server/redis";

export type RiskLevel = "NORMAL" | "SUSPICIOUS" | "RATE_LIMITED" | "TEMP_BLOCKED" | "BANNED";

const RISK_LEVELS: readonly RiskLevel[] = [
  "NORMAL",
  "SUSPICIOUS",
  "RATE_LIMITED",
  "TEMP_BLOCKED",
  "BANNED",
];

function asRiskLevel(value: unknown): RiskLevel {
  return typeof value === "string" && (RISK_LEVELS as readonly string[]).includes(value)
    ? (value as RiskLevel)
    : "NORMAL";
}

export interface PresenceStore {
  setOnline(address: string, connId: string): Promise<void>;
  setOffline(address: string, connId: string): Promise<void>;
  isOnline(address: string): Promise<boolean>;
  acquireLock(key: string, ttlMs: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
  getRisk(address: string): Promise<RiskLevel>;
  setRisk(address: string, level: RiskLevel): Promise<void>;
}

export class InMemoryPresenceStore implements PresenceStore {
  private online = new Map<string, Set<string>>();
  private locks = new Map<string, number>();
  private risk = new Map<string, RiskLevel>();

  async setOnline(address: string, connId: string): Promise<void> {
    const set = this.online.get(address) ?? new Set<string>();
    set.add(connId);
    this.online.set(address, set);
  }

  async setOffline(address: string, connId: string): Promise<void> {
    const set = this.online.get(address);
    if (set) {
      set.delete(connId);
      if (set.size === 0) this.online.delete(address);
    }
  }

  async isOnline(address: string): Promise<boolean> {
    return this.online.has(address);
  }

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const held = this.locks.get(key);
    if (held !== undefined && held > now) return false;
    this.locks.set(key, now + ttlMs);
    return true;
  }

  async releaseLock(key: string): Promise<void> {
    this.locks.delete(key);
  }

  async getRisk(address: string): Promise<RiskLevel> {
    return this.risk.get(address) ?? "NORMAL";
  }

  async setRisk(address: string, level: RiskLevel): Promise<void> {
    this.risk.set(address, level);
  }
}

export function createPresenceStore(): PresenceStore {
  // REDIS_URL set → shared Redis store (multi-instance). Otherwise in-memory.
  if (process.env.REDIS_URL?.trim()) return new RedisPresenceStore();
  return new InMemoryPresenceStore();
}

/**
 * Redis-backed PresenceStore. Every op falls back to an embedded
 * in-memory store when Redis is unconfigured or unreachable, so a
 * Redis outage degrades to single-instance behavior instead of
 * rejecting connections.
 */
export class RedisPresenceStore implements PresenceStore {
  private readonly client: IORedis | null;
  private readonly fallback = new InMemoryPresenceStore();
  private readonly token = randomUUID();

  constructor(client?: IORedis | null) {
    this.client = client ?? redis();
  }

  private onlineKey(address: string): string {
    return `mg:presence:${address.toLowerCase()}`;
  }

  private riskKey(address: string): string {
    return `mg:risk:${address.toLowerCase()}`;
  }

  private lockKey(key: string): string {
    return `mg:lock:${key}`;
  }

  async setOnline(address: string, connId: string): Promise<void> {
    const c = this.client;
    if (!c) return this.fallback.setOnline(address, connId);
    try {
      const key = this.onlineKey(address);
      await c.sadd(key, connId);
      // Bound crash-staleness: a dead instance's entries expire.
      // Worst case, a wallet looks online for up to this TTL after a crash.
      await c.expire(key, 300);
    } catch {
      await this.fallback.setOnline(address, connId);
    }
  }

  async setOffline(address: string, connId: string): Promise<void> {
    const c = this.client;
    if (!c) return this.fallback.setOffline(address, connId);
    try {
      await c.srem(this.onlineKey(address), connId);
    } catch {
      await this.fallback.setOffline(address, connId);
    }
  }

  async isOnline(address: string): Promise<boolean> {
    const c = this.client;
    if (!c) return this.fallback.isOnline(address);
    try {
      return (await c.scard(this.onlineKey(address))) > 0;
    } catch {
      return this.fallback.isOnline(address);
    }
  }

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const c = this.client;
    if (!c) return this.fallback.acquireLock(key, ttlMs);
    try {
      const res = await c.set(this.lockKey(key), this.token, "PX", Math.max(1, ttlMs), "NX");
      return res === "OK";
    } catch {
      return this.fallback.acquireLock(key, ttlMs);
    }
  }

  async releaseLock(key: string): Promise<void> {
    const c = this.client;
    if (!c) return this.fallback.releaseLock(key);
    try {
      // Lua compare-and-del: never release another instance's lock.
      await c.eval(
        `if redis.call("GET",KEYS[1])==ARGV[1] then return redis.call("DEL",KEYS[1]) else return 0 end`,
        1,
        this.lockKey(key),
        this.token,
      );
    } catch {
      await this.fallback.releaseLock(key);
    }
  }

  async getRisk(address: string): Promise<RiskLevel> {
    const c = this.client;
    if (!c) return this.fallback.getRisk(address);
    try {
      const raw = await c.get(this.riskKey(address));
      if (raw === null) return this.fallback.getRisk(address);
      return asRiskLevel(raw);
    } catch {
      return this.fallback.getRisk(address);
    }
  }

  async setRisk(address: string, level: RiskLevel): Promise<void> {
    const c = this.client;
    if (!c) return this.fallback.setRisk(address, level);
    try {
      // Cache only — bans persist in the DB (user_bans); 7d bounds staleness.
      await c.set(this.riskKey(address), level, "EX", 604_800);
    } catch {
      await this.fallback.setRisk(address, level);
    }
  }
}
