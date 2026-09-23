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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {shortAddress(session.address)}
        </span>
      ) : (
        <span>Connect a wallet, then sign (no transaction) to enter matchmaking.</span>
      )}
    </div>
  );
}
