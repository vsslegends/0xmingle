import { parseEther, type Hex } from "viem";

/** Client-side tip helpers. Fee math stays server-side (/api/tips/quote). */
export const TIP_PRESETS_ETH = ["0.0001", "0.0005", "0.001"] as const;
export const TIP_PRESETS_USD = ["0.10", "1", "5"] as const;
export const MIN_TIP_USD = 0.1;

export function parseTipAmount(input: string): bigint | null {
  try {
    const v = parseEther(input as `${number}`);
    return v > 0n ? v : null;
  } catch {
    return null;
  }
}

export interface TipTx { to: Hex; value: bigint }

/** Builds the wallet-to-wallet transfer. Caller must confirm in wallet; never auto-send. */
export function buildTipTx(recipient: string, amountWei: bigint): TipTx | null {
  if (!/^0x[0-9a-fA-F]{40}$/.test(recipient) || amountWei <= 0n) return null;
  return { to: recipient as Hex, value: amountWei };
}

/** Enforcing splitter contract address (unset until deployed). */
export function tipContractAddress(): Hex | null {
  const raw = (process.env.NEXT_PUBLIC_TIP_CONTRACT ?? "").trim();
  return /^0x[0-9a-fA-F]{40}$/.test(raw) ? (raw.toLowerCase() as Hex) : null;
}

export const TIP_SPLITTER_ABI = [
  {
    name: "tip",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "recipient", type: "address" }],
    outputs: [],
  },
] as const;

/**
 * USD → wei at the given ETH/USD price. Exact BigInt math (cents × 1e18 ÷
 * price-cents, floored). Returns null below the $0.10 minimum or on bad input.
 */
export function usdToWei(usd: string, ethUsdPrice: number): bigint | null {
  if (!Number.isFinite(ethUsdPrice) || ethUsdPrice <= 0) return null;
  const m = /^\d+(\.\d{1,2})?$/.exec(usd.trim());
  if (!m) return null;
  const [dollars, cents = ""] = usd.trim().split(".");
  const usdCents = BigInt(dollars) * 100n + BigInt((cents + "00").slice(0, 2));
  if (usdCents < 10n) return null; // $0.10 minimum
  const priceCentsPerEth = BigInt(Math.round(ethUsdPrice * 100));
  if (priceCentsPerEth <= 0n) return null;
  const wei = (usdCents * 1_000_000_000_000_000_000n) / priceCentsPerEth;
  return wei > 0n ? wei : null;
}
