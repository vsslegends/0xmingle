"use client";

/** Live ETH/USD price for USD-denominated tips. Free Coinbase endpoint, no key. */

let cached: { price: number; at: number } | null = null;
const CACHE_MS = 60_000;

export async function fetchEthUsd(): Promise<number | null> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.price;
  try {
    const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=ETH");
    if (!res.ok) return cached?.price ?? null;
    const json = (await res.json()) as { data?: { rates?: { USD?: string } } };
    const price = Number(json.data?.rates?.USD);
    if (!Number.isFinite(price) || price <= 0) return cached?.price ?? null;
    cached = { price, at: Date.now() };
    return price;
  } catch {
    return cached?.price ?? null;
  }
}

/** Test hook — not part of the public API. */
export const __testOnly = {
  reset: () => { cached = null; },
  seed: (price: number) => { cached = { price, at: Date.now() }; },
};
