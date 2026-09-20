"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function SearchingAnimation({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-center" role="status">
      <div className="flex items-center justify-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-300">Finding someone…</p>
      <Button variant="ghost" size="sm" className="mt-2" onClick={onCancel}>
        Stop
      </Button>
    </div>
  );
}

export function MatchFound({ label = "Stranger found." }: { label?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center text-sm font-medium text-emerald-300"
      role="status"
    >
      {label}
    </motion.p>
  );
}
