"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Radar-style searching state: ping rings + orbiting dots around a 3D core. */
export function SearchingAnimation({ onCancel, position }: { onCancel: () => void; position?: number | null }) {
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-6 text-center" role="status">
      <div className="relative mx-auto h-36 w-36" aria-hidden>
        {/* Expanding ping rings */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-full border border-violet-400/40 animate-ping-ring"
            style={{ animationDelay: `${i * 0.8}s` }}
          />
        ))}
        {/* Orbiting dots */}
        <span className="absolute inset-4 orbit-28">
          <span className="absolute -top-1 left-1/2 -ml-1 block h-2 w-2 rounded-full bg-cyan-300 shadow-lg shadow-cyan-500/60" />
        </span>
        <span className="absolute inset-4 orbit-back-28">
          <span className="absolute -bottom-1 left-1/2 -ml-1 block h-2 w-2 rounded-full bg-violet-400 shadow-lg shadow-violet-500/60" />
        </span>
        {/* Core */}
        <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-500 to-cyan-400 text-black shadow-2xl shadow-violet-900/50">
          <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
          <Ghost size={28} strokeWidth={2.25} className="relative" />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-300">Finding someone…</p>
      <p className="mt-1 font-mono2 text-[11px] tracking-wide text-slate-500" aria-live="polite">
        {position && position > 1 ? `≈ #${position} in line` : "scanning frequencies"} · {elapsed}s
      </p>
      <Button variant="ghost" size="sm" className="mt-2" onClick={onCancel}>
        Stop
      </Button>
    </div>
  );
}

export function MatchFound({ label = "Stranger found." }: { label?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className="mx-auto w-fit rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-1.5 text-center text-sm font-medium text-emerald-300 shadow-lg shadow-emerald-950/30"
      role="status"
    >
      ✦ {label}
    </motion.p>
  );
}
