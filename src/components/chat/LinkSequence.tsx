"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Ghost, Lock, Radio } from "lucide-react";

const STEPS = ["handshake", "encrypting channel", "stranger linked"] as const;

/**
 * Cinematic link-up overlay shown once per session: a beam sweep, stepped
 * handshake readout, then it dissolves into the conversation. Click skips.
 * Reduced motion → never shown.
 */
export function LinkSequence({ sid, peer }: { sid: string; peer: string }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = React.useState(() => !reduce);
  const [step, setStep] = React.useState(0);
  const seen = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (reduce) return;
    if (seen.current === sid) return;
    seen.current = sid;
    setVisible(true);
    setStep(0);
    const timers = [
      window.setTimeout(() => setStep(1), 450),
      window.setTimeout(() => setStep(2), 900),
      window.setTimeout(() => setVisible(false), 1500),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [sid, reduce]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Skip intro, show conversation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-xl bg-[#070812]/92 backdrop-blur-sm"
        >
          {/* Beam sweep */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent animate-beam" />
          <span aria-hidden className="pointer-events-none absolute inset-0 signal-field opacity-70" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-500 to-cyan-400 text-black shadow-2xl shadow-violet-900/60">
            <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
            <Ghost size={28} strokeWidth={2.25} className="relative" />
          </span>
          <span className="relative flex items-center gap-2 text-xs text-slate-300">
            {step < 2 ? <Radio size={14} className="text-cyan-300 animate-pulse" /> : <Lock size={14} className="text-emerald-300" />}
            <span className="font-mono2">{STEPS[Math.min(step, STEPS.length - 1)]}…</span>
          </span>
          <span className="relative max-w-[220px] truncate text-sm font-semibold text-white">{peer}</span>
          {/* Progress hairline */}
          <span aria-hidden className="relative h-0.5 w-44 overflow-hidden rounded-full bg-white/10">
            <motion.span
              className="block h-full bg-gradient-to-r from-violet-400 to-cyan-300"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
