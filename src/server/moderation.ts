import { z } from "zod";
import type { RiskLevel } from "@/server/realtime/store";

/**
 * Server-side moderation escalation. In-process counters drive the
 * PresenceStore risk level; Supabase tables (0002_safety) are the durable
 * audit trail written best-effort by API routes. Multi-instance prod needs
 * the Redis-backed presence store — this module never trusts the client.
 */

const ADDRESS_RE = /^0x[0-9a-f]{40}$/;

export const reportInputSchema = z.object({
  reported: z.string().regex(ADDRESS_RE, "Invalid address"),
  category: z.string().min(1).max(48),
  detail: z.string().max(500).optional(),
});

export const blockInputSchema = z.object({
  blocked: z.string().regex(ADDRESS_RE, "Invalid address"),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
export type BlockInput = z.infer<typeof blockInputSchema>;

// Escalation ladder on total strikes (reports + spam flags).
export function levelForStrikes(strikes: number): RiskLevel {
  if (strikes >= 10) return "BANNED";
  if (strikes >= 5) return "TEMP_BLOCKED";
  if (strikes >= 3) return "RATE_LIMITED";
  if (strikes >= 1) return "SUSPICIOUS";
  return "NORMAL";
}

/** Chat send budget per 10s window for a risk level. 0 = reject. */
export function chatLimitFor(level: RiskLevel): number {
  if (level === "SUSPICIOUS") return 5;
  if (level === "RATE_LIMITED") return 0;
  return 10;
}

/** Levels refused at gateway connect / queue join. */
export function isConnectRestricted(level: RiskLevel): boolean {
  return level === "BANNED" || level === "TEMP_BLOCKED";
}

interface Counter {
  reports: number;
  spamFlags: number;
}

const counters = new Map<string, Counter>();

function key(address: string): string {
  return address.toLowerCase();
}

function strikes(c: Counter): number {
  return c.reports + c.spamFlags;
}

export function getLevel(address: string): RiskLevel {
  const c = counters.get(key(address));
  if (!c) return "NORMAL";
  return levelForStrikes(strikes(c));
}

/** Seed from a durable store (e.g. PresenceStore on WS connect). */
export function seedLevel(address: string, level: RiskLevel): void {
  const k = key(address);
  const current = getLevel(address);
  if (current !== "NORMAL") return; // in-process strikes win
  if (level === "NORMAL") return;
  // Represent a seeded restriction with the minimum strikes for that level.
  const seed: Record<RiskLevel, number> = {
    NORMAL: 0,
    SUSPICIOUS: 1,
    RATE_LIMITED: 3,
    TEMP_BLOCKED: 5,
    BANNED: 10,
  };
  counters.set(k, { reports: seed[level], spamFlags: 0 });
}

export function recordReport(address: string): RiskLevel {
  const k = key(address);
  const c = counters.get(k) ?? { reports: 0, spamFlags: 0 };
  c.reports += 1;
  counters.set(k, c);
  return levelForStrikes(strikes(c));
}

export function recordSpam(address: string): RiskLevel {
  const k = key(address);
  const c = counters.get(k) ?? { reports: 0, spamFlags: 0 };
  c.spamFlags += 1;
  counters.set(k, c);
  return levelForStrikes(strikes(c));
}

/** Test hook — clears in-process counters. */
export function __resetModeration(): void {
  counters.clear();
}
