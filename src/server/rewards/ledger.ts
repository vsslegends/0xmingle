/**
 * Referrals + internal points. No token launch: points are off-chain
 * integers that could later map to an on-chain reward layer.
 * Abuse-resistant: no automatic payouts, conversion tracked server-side.
 */

export const POINTS = {
  conversation: 2,
  invite: 20,
  communityJoin: 5,
} as const;

interface Referral { referrer: string; referred: string; at: number; qualified: boolean }
interface Ledger { points: Map<string, number>; referrals: Referral[]; claimedRefs: Set<string> }

const ledger: Ledger = { points: new Map(), referrals: [], claimedRefs: new Set() };

export function referralCode(address: string): string {
  return address.toLowerCase();
}

export function referralLink(origin: string, address: string): string {
  return `${origin.replace(/\/$/, "")}/?ref=${address.toLowerCase()}`;
}

export function applyReferral(referrer: string, referred: string): { ok: boolean; reason?: string } {
  const from = referrer.toLowerCase();
  const to = referred.toLowerCase();
  if (from === to) return { ok: false, reason: "Self-referral not allowed." };
  if (ledger.claimedRefs.has(to)) return { ok: false, reason: "Already referred." };
  ledger.claimedRefs.add(to);
  ledger.referrals.push({ referrer: from, referred: to, at: Date.now(), qualified: false });
  return { ok: true };
}

export function award(address: string, amount: number): number {
  const key = address.toLowerCase();
  const next = (ledger.points.get(key) ?? 0) + amount;
  ledger.points.set(key, next);
  return next;
}

export function balance(address: string): number {
  return ledger.points.get(address.toLowerCase()) ?? 0;
}
