import type { TrustTier } from "@/lib/profiles";

/**
 * Server-side reputation. Internal score drives spam protection,
 * matchmaking quality, and access control. Public surface is only
 * a coarse TrustTier — never raw signals or moderation data.
 */
export interface ReputationSignals {
  accountAgeDays: number;
  conversations: number;
  reportsAgainst: number;
  blocksAgainst: number;
  spamFlags: number;
  botProbability: number; // 0..1
}

export interface ReputationResult {
  score: number; // 0..100 internal
  tier: TrustTier;
}

export function scoreReputation(s: ReputationSignals): ReputationResult {
  let score = 50;
  score += Math.min(20, s.accountAgeDays * 0.5); // age up to +20
  score += Math.min(25, s.conversations * 0.5); // completed sessions up to +25
  score -= s.reportsAgainst * 12;
  score -= s.blocksAgainst * 4;
  score -= s.spamFlags * 10;
  score -= Math.round(s.botProbability * 30);
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Verified requires external verification (set by admin flow); scorer caps at established.
  const tier: TrustTier = score >= 70 ? "established" : "new";
  return { score, tier };
}

export function tierLabel(t: TrustTier): string {
  if (t === "verified") return "Verified Wallet";
  if (t === "established") return "Established Wallet";
  return "New Wallet";
}
