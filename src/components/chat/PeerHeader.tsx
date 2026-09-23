"use client";

import * as React from "react";
import { Check, Copy, Ghost } from "lucide-react";

/** Holographic peer ID: avatar ring, link status, mode + session chips. */
export function PeerHeader({
  peer,
  mode,
  sid,
  stats,
}: {
  peer: string;
  mode: string;
  sid: string;
  stats?: string | null;
}) {
  const [copied, setCopied] = React.useState(false);
  const shortSid = sid.length > 14 ? `${sid.slice(0, 8)}…${sid.slice(-4)}` : sid;

  async function copySid() {
    try {
      await navigator.clipboard.writeText(sid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — sid stays visible */
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="relative shrink-0" aria-hidden>
        <span className="absolute -inset-1.5 rounded-full border border-dashed border-cyan-300/40 animate-spin-slower" />
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-500 to-cyan-400 text-black shadow-lg shadow-violet-900/50">
          <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
          <Ghost size={22} strokeWidth={2.25} className="relative" />
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0f1220] bg-emerald-400" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold leading-tight">{peer}</p>
        <p className="flex items-center gap-1.5 text-xs text-emerald-300">
          <SignalBars />
          encrypted · {mode}
          {stats ? <span className="text-slate-400">· {stats}</span> : null}
        </p>
        <button
          type="button"
          onClick={copySid}
          title="Copy session id"
          className="mt-0.5 flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 font-mono2 text-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
        >
          {shortSid}
          {copied ? <Check size={11} className="text-emerald-300" /> : <Copy size={11} />}
        </button>
      </div>
    </div>
  );
}

/** Four-bar link readout with a gentle flicker. Decorative. */
function SignalBars() {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden>
      {[5, 8, 11, 14].map((h, i) => (
        <span
          key={h}
          className="w-[3px] rounded-sm bg-emerald-300 animate-signal"
          style={{ height: h, animationDelay: `${i * 0.35}s` }}
        />
      ))}
    </span>
  );
}
