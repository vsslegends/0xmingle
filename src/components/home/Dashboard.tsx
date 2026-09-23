"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { shortAddress } from "@/lib/utils";

/**
 * Richer home after connect. FIND STRANGER stays the central CTA;
 * profile/community data loads progressively, never blocking chat.
 */
export function Dashboard() {
  const reduce = useReducedMotion();
  const session = useSession();
  const { profile } = useProfile();
  if (session.status !== "signed-in") return null;
  const name = profile?.username ? `@${profile.username}` : shortAddress(session.address ?? "");

  const stats = [
    { v: profile?.conversations ?? 0, l: "conversations" },
    { v: profile?.peopleMet ?? 0, l: "people met" },
    { v: profile?.interests.length ?? 0, l: "interests" },
  ];

  return (
    <motion.section
      aria-label="Your home"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5"
    >
      <p className="text-sm text-slate-400">
        Good to see you, <span className="font-semibold text-white">{name}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/chat"><Button>Find stranger <ArrowRight size={16} /></Button></Link>
        <Link href="/explore"><Button variant="secondary">Explore</Button></Link>
        <Link href="/communities"><Button variant="secondary">Communities</Button></Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
          >
            <Card className="card-lift h-full">
              <CardBody className="text-sm">
                <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-xl font-bold text-transparent">{s.v}</span>
                <span className="block text-slate-500">{s.l}</span>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
