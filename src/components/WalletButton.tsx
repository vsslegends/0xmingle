"use client";

import * as React from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { shortAddress } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";

/** Full connect → sign-in button. Signature verifies ownership only, never a transaction. */
export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const session = useSession();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const signIn = async () => {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const nonceJson = (await nonceRes.json()) as { message?: string; error?: string };
      if (!nonceRes.ok || !nonceJson.message) {
        throw new Error(nonceJson.error ?? "Could not start sign-in.");
      }
      const signature = await signMessageAsync({ message: nonceJson.message });
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, message: nonceJson.message, signature }),
      });
      const verifyJson = (await verifyRes.json()) as { error?: string };
      if (!verifyRes.ok) throw new Error(verifyJson.error ?? "Sign-in failed.");
      session.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  if (session.status === "signed-in") {
    return (
      <Link href="/profile" aria-label="Your profile">
        <Button size={compact ? "sm" : "md"} variant="secondary" data-testid="wallet-button">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
          {shortAddress(session.address)}
        </Button>
      </Link>
    );
  }

  return (
    <ConnectButton.Custom>
      {({ openConnectModal }) => {
        if (!isConnected) {
          return (
            <Button
              size={compact ? "sm" : "md"}
              onClick={openConnectModal}
              data-testid="wallet-button"
            >
              <Wallet size={16} />
              {brand.ctaPrimary}
            </Button>
          );
        }
        return (
          <span className="inline-flex flex-col items-end gap-1">
            <Button
              size={compact ? "sm" : "md"}
              onClick={signIn}
              disabled={busy}
              data-testid="wallet-button"
              title="This signature only verifies that you control this wallet. It does not authorize a transaction."
            >
              <Wallet size={16} />
              {busy ? "Signing…" : "Sign to chat"}
            </Button>
            {error ? (
              <span role="alert" className="max-w-55 text-right text-xs text-red-300">
                {error}
              </span>
            ) : null}
          </span>
        );
      }}
    </ConnectButton.Custom>
  );
}
