"use client";

import * as React from "react";
import { Check, Copy, Gift } from "lucide-react";
import { useSession } from "@/hooks/useSession";

/** Referral invite card: fetch your link (signed in) and copy it. Silent when signed out. */
export function InviteCard() {
  const session = useSession();
  const [link, setLink] = React.useState<string | null>(null);
  const [points, setPoints] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (session.status !== "signed-in") return;
    fetch("/api/referral", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { link?: string; points?: number } | null) => {
        if (j?.link) setLink(j.link);
        if (typeof j?.points === "number") setPoints(j.points);
      })
      .catch(() => {});
  }, [session.status]);

  if (session.status !== "signed-in" || !link) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link as string);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="card-lift mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-600 text-black shadow-lg shadow-amber-900/40">
        <Gift size={20} strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Invite strangers, earn aura</p>
        <p className="truncate font-mono2 text-xs text-slate-400">{link}</p>
        {points !== null ? (
          <p className="mt-0.5 text-xs text-slate-500">{points} pts banked</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-black shadow-lg transition-transform hover:scale-105"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied" : "Copy invite"}
      </button>
    </div>
  );
}
