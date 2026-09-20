"use client";

import { Badge } from "@/components/ui/badge";

/** Shell — Phase 2 shows live chain id + switcher via wagmi. */
export function NetworkSwitcher() {
  const id = process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID ?? "46630";
  return <Badge>Robinhood Chain · {id}</Badge>;
}
