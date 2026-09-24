"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { brand } from "@/config/brand";
import { CHAT_MODES } from "@/lib/interests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/WalletButton";
import { Dashboard } from "@/components/home/Dashboard";
import { OnlineNow } from "@/components/landing/OnlineNow";

/** Left hero column: staggered entrance + gradient accent on the tagline. */
export function HeroCopy() {
  const reduce = useReducedMotion();
  const parts = brand.tagline.split(brand.taglineAccent);

  // Undefined variants = static render (reduced motion). Typed as Variants
  // so easing strings stay assignable under strict TS.
  const container: Variants | undefined = reduce
    ? undefined
    : { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
  const item: Variants | undefined = reduce
    ? undefined
    : {
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
      };

  return (
    <motion.div initial="hidden" animate="show" variants={container}>
      <motion.div variants={item}>
        <Badge className="mb-5 border-violet-300/30 bg-violet-500/10 text-violet-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="h-2 w-2 rounded-full bg-violet-400" />
          </span>
          Wallet-native · No followers needed
        </Badge>
      </motion.div>
      <motion.h1 variants={item} className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
        {parts.length === 2 ? (
          <>
            {parts[0]}
            <span className="text-gradient">{brand.taglineAccent}</span>
          </>
        ) : (
          brand.tagline
        )}
      </motion.h1>
      <motion.p variants={item} className="mt-5 max-w-md text-lg text-slate-400">
        One wallet. One stranger. One conversation. Connect, get matched,
        and talk — text, audio, or video.
      </motion.p>
      <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
        <WalletButton />
        <Link href="/chat">
          <Button variant="secondary" size="md">
            {brand.ctaSecondary}
            <ArrowRight size={16} />
          </Button>
        </Link>
      </motion.div>
      <motion.p variants={item} className="mt-4 text-xs text-slate-500">
        Basic chat is free. Connecting a wallet only verifies it&apos;s yours — no transaction, no jargon.{" "}
        No wallet yet?{" "}
        <a
          href={brand.links.getWallet}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:text-slate-300 hover:underline"
        >
          Get {brand.links.getWalletLabel} in ~2 min
        </a>
        .
      </motion.p>
      <motion.div variants={item} className="mt-6 flex flex-wrap items-center gap-2" aria-label="Product facts">
        <OnlineNow />
        {[
          `${CHAT_MODES.length} modes · text, audio, video`,
          "Up to 11 interests",
          "0 messages stored",
        ].map((s) => (
          <span key={s} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
            {s}
          </span>
        ))}
      </motion.div>
      <Dashboard />
    </motion.div>
  );
}
