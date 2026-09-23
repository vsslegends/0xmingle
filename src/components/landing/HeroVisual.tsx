"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const bubbles = [
  { mine: false, text: "hey — what's something interesting you learned this week?" },
  { mine: true, text: "that strangers give better travel advice than algorithms" },
  { mine: false, text: "exactly why I'm here ✦" },
];

/**
 * Live-feeling chat preview: pointer-tracked 3D tilt, staggered bubbles,
 * looping typing indicator. Tilt only on fine pointers; static otherwise.
 */
export function HeroVisual() {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 180, damping: 22 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 180, damping: 22 });

  function onMove(e: React.MouseEvent) {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }

  function onLeave() {
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* Glow + floating chips */}
        <div aria-hidden className="absolute -inset-6 -z-10 rounded-[28px] bg-gradient-to-br from-violet-600/25 via-transparent to-cyan-500/20 blur-2xl animate-glow-pulse" />
        <div aria-hidden className="absolute -right-3 -top-5 z-10 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-3 py-1.5 text-xs font-bold text-black shadow-lg animate-float">
          🔥 3 modes
        </div>
        <div aria-hidden className="absolute -left-4 bottom-16 z-10 rounded-full border border-white/15 bg-[#141524]/95 px-3 py-1.5 text-xs text-emerald-200 shadow-xl animate-float-slow" style={{ animationDelay: "-4s" }}>
          ● ephemeral · never stored
        </div>

        <Card className="overflow-hidden border-white/15 bg-[#0f1220]/90 shadow-2xl shadow-violet-950/40">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="border-emerald-300/30 bg-emerald-500/10 text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Stranger found
              </Badge>
              <span className="text-xs text-emerald-300">● connected</span>
            </div>
            <div className="space-y-2 text-sm" aria-hidden>
              {bubbles.map((b, i) => (
                <motion.div
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.35 + i * 0.45, ease: "easeOut" }}
                  className={
                    b.mine
                      ? "ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-black shadow-lg shadow-violet-900/30"
                      : "max-w-[80%] rounded-2xl rounded-tl-md border border-white/5 bg-white/10 px-4 py-2 text-slate-200"
                  }
                >
                  {b.text}
                </motion.div>
              ))}
              <motion.div
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + bubbles.length * 0.45, duration: 0.4 }}
                className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-md bg-white/10 px-4 py-2.5"
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-typing-dot"
                    style={{ animationDelay: `${d * 0.2}s` }}
                  />
                ))}
              </motion.div>
            </div>
            <div className="flex gap-2 pt-1">
              <span className="flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-slate-500">
                Say hi…
              </span>
              <span className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-2 text-sm font-bold text-black shadow-lg shadow-violet-900/30">
                Next →
              </span>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
