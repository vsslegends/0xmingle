"use client";

import { NetworkSwitcher } from "@/components/NetworkSwitcher";
import { useSession } from "@/hooks/useSession";
import { shortAddress } from "@/lib/utils";

export function AuthStatus() {
  const session = useSession();
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
      <NetworkSwitcher />
      {session.status === "loading" ? (
        <span>Checking session…</span>
      ) : session.status === "signed-in" ? (
        <span className="text-emerald-300">Signed in as {shortAddress(session.address)}</span>
      ) : (
        <span>Connect a wallet, then sign (no transaction) to enter matchmaking.</span>
      )}
    </div>
  );
}
