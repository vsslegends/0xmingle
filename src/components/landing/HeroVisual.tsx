"use client";

import { motion } from "framer-motion";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/** Subtle product preview — motion-safe, no real user data. */
export function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="overflow-hidden">
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge>Stranger found</Badge>
            <span className="text-xs text-emerald-300">● connected</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-white/10 px-4 py-2 text-slate-200">
              hey — what&apos;s something interesting you learned this week?
            </div>
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-black">
              that strangers give better travel advice than algorithms
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-white/10 px-4 py-2 text-slate-200">
              exactly why I&apos;m here ✦
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <span className="flex-1 rounded-full bg-black/40 px-4 py-2 text-sm text-slate-500">
              Say hi…
            </span>
            <span className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold">
              Next →
            </span>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
