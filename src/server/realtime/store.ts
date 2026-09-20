/**
 * Presence/session store abstraction.
 * Default: in-memory (dev + single-instance). Production multi-instance:
 * implement with Redis (presence, queues, locks) behind this interface.
 */
export type RiskLevel = "NORMAL" | "SUSPICIOUS" | "RATE_LIMITED" | "TEMP_BLOCKED" | "BANNED";

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
  // REDIS_URL set → RedisPresenceStore (Phase 8). Until then, in-memory.
  return new InMemoryPresenceStore();
}
