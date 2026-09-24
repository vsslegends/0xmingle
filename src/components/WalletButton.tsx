"use client";

import * as React from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";
import { Sparkles, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { cn, shortAddress } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";

/** Full connect → sign-in button. Signature verifies ownership only, never a transaction. */
export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, isConnected, status } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const session = useSession();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Double-submit guard: a rapid second click would fetch a second nonce
  // that overwrites the first challenge, failing the first signature with
  // "Message mismatch" and forcing the user to sign twice.
  const busyRef = React.useRef(false);
  const prevStatus = React.useRef(status);
  const syncingDown = React.useRef(false);

  /**
   * Wallet disconnected (or switched to a different account) while a server
   * session exists: the HttpOnly session is now stale, so clear it and
   * reload for a clean state (chat socket, tickets, session UI).
   * Only a real connected → disconnected transition counts — the
   * 'reconnecting' flap (wallet sleep, network blip, auto-reconnect) must
   * NOT nuke the session, or users get logged out mid-session and forced
   * to sign a 2nd time.
   */
  React.useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;
    const disconnected = was === "connected" && status === "disconnected";
    const switched =
      session.status === "signed-in" &&
      status === "connected" &&
      address &&
      address.toLowerCase() !== session.address.toLowerCase();
    if ((disconnected || switched) && !syncingDown.current) {
      syncingDown.current = true;
      fetch("/api/auth/logout", { method: "POST" }).finally(() => {
        window.location.reload();
      });
    }
  }, [status, address, session]);

  const signIn = async () => {
    if (!address || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      let lastError = "Sign-in failed.";
      // Up to 2 attempts: if the challenge died server-side between nonce
      // and verify (server restart, overwritten nonce), retry once with a
      // fresh nonce instead of forcing the user to click Sign again.
      for (let attempt = 0; attempt < 2; attempt++) {
        const nonceRes = await fetch("/api/auth/nonce", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ address }),
        });
        const nonceJson = (await nonceRes.json()) as { message?: string; error?: string };
        if (!nonceRes.ok || !nonceJson.message) {
          throw new Error(nonceJson.error ?? "Could not start sign-in.");
        }
        let signature: string;
        try {
          signature = await signMessageAsync({ message: nonceJson.message });
        } catch {
          // User rejected/cancelled in the wallet — never auto-reprompt.
          throw new Error("Signature cancelled in wallet.");
        }
        const verifyRes = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ address, message: nonceJson.message, signature }),
        });
        if (verifyRes.ok) {
          // Signed in — land on matchmaking so the user can find a stranger
          // with a fresh session (full navigation picks up the cookie).
          window.location.assign("/chat");
          return;
        }
        const verifyJson = (await verifyRes.json()) as { error?: string };
        lastError = verifyJson.error ?? "Sign-in failed.";
        // Non-challenge errors (rate limits, bad requests) surface at once.
        if (verifyRes.status !== 401) throw new Error(lastError);
      }
      throw new Error(lastError);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      busyRef.current = false;
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
            <span className="inline-flex flex-row flex-wrap items-center gap-2">
              <Button
                size={compact ? "sm" : "md"}
                onClick={openConnectModal}
                data-testid="wallet-button"
              >
                <Wallet size={16} />
                {brand.ctaPrimary}
              </Button>
              <a
                href={brand.links.getWallet}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Create a free wallet with Rainbow (opens in a new tab)"
                className={cn(buttonVariants({ size: compact ? "sm" : "md" }))}
              >
                <Sparkles size={16} />
                Create free wallet
              </a>
            </span>
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
