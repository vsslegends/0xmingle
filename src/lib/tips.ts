import { parseEther, type Hex } from "viem";

/** Client-side tip helpers. Fee math stays server-side (/api/tips/quote). */
export const TIP_PRESETS_ETH = ["0.0001", "0.0005", "0.001"] as const;

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
