/**
 * Platform-fee authority. Percentage lives here (env/DB), never in the client.
 * Client must call /api/tips/quote; server/contract is authoritative.
 */
export function platformFeeBps(): number {
  const raw = Number(process.env.PLATFORM_FEE_BPS ?? 500); // default 5%
  if (!Number.isFinite(raw) || raw < 0 || raw > 10_000) return 500;
  return Math.floor(raw);
}

export interface TipQuote {
  amountWei: bigint;
  feeWei: bigint;
  recipientWei: bigint;
  feeBps: number;
}

export function quoteTip(amountWei: bigint): TipQuote {
  if (amountWei <= 0n) throw new Error("Amount must be positive");
  const feeBps = platformFeeBps();
  const feeWei = (amountWei * BigInt(feeBps)) / 10_000n;
  return { amountWei, feeWei, recipientWei: amountWei - feeWei, feeBps };
}

export function formatEth(wei: bigint): string {
  const s = wei.toString().padStart(19, "0");
  const int = s.slice(0, -18) || "0";
  const frac = s.slice(-18).replace(/0+$/, "").slice(0, 6) || "0";
  return `${int}.${frac}`;
}
