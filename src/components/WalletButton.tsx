"use client";

import * as React from "react";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";

/**
 * Phase 1 shell: navigates to /chat where the real wagmi/RainbowKit
 * connect + SIWE flow lands in Phase 2. Keeps a stable component API.
 */
export function WalletButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      data-testid="wallet-button"
      size={compact ? "sm" : "md"}
      onClick={() => {
        setPending(true);
        router.push("/chat");
      }}
      disabled={pending}
    >
      <Wallet size={16} />
      {pending ? "Opening…" : brand.ctaPrimary}
    </Button>
  );
}
