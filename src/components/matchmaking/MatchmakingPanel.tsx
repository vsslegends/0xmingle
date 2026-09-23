"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Ghost, Fingerprint, MessageCircle, Mic, Video } from "lucide-react";
import { INTERESTS, CHAT_MODES, type ChatMode } from "@/lib/interests";
import { LANGS, setChatLanguage, useChatLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { SearchingAnimation } from "@/components/matchmaking/SearchingAnimation";
import { cn } from "@/lib/utils";

export interface FindOpts {
  mode: ChatMode;
  identity: "anonymous" | "wallet";
  interests: string[];
}

const MODE_META: Record<ChatMode, { icon: typeof MessageCircle; blurb: string }> = {
  text: { icon: MessageCircle, blurb: "typed" },
  audio: { icon: Mic, blurb: "voice" },
  video: { icon: Video, blurb: "face to face" },
};

/** Launch console. Server is authoritative — Find only emits q.join. */
export function MatchmakingPanel({
  searching,
  gated,
  wsDown,
  position,
  onFind,
  onStop,
}: {
  searching: boolean;
  gated: boolean;
  wsDown: boolean;
  position?: number | null;
  onFind: (opts: FindOpts) => void;
  onStop: () => void;
}) {
  const [mode, setMode] = React.useState<ChatMode>("text");
  const [identity, setIdentity] = React.useState<"anonymous" | "wallet">("anonymous");
  const [picked, setPicked] = React.useState<string[]>(["random"]);
  const [moreInterests, setMoreInterests] = React.useState(false);
  const lang = useChatLanguage();
  const visibleInterests = moreInterests ? INTERESTS : INTERESTS.slice(0, 8);

  const toggle = (i: string) =>
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  return (
    <Card className="overflow-hidden">
      <div aria-hidden className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400" />
      <CardBody className="space-y-4">
        <div>
          <p className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">01 · Identity</p>
          <div className="relative mt-2 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-black/30 p-1" role="radiogroup" aria-label="Identity mode">
            {(["anonymous", "wallet"] as const).map((m) => {
              const active = identity === m;
              const Icon = m === "anonymous" ? Ghost : Fingerprint;
              return (
                <button
                  key={m}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setIdentity(m)}
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm capitalize transition-colors",
                    active ? "text-white" : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="identity-pill"
                      className="absolute inset-0 rounded-full border border-violet-300/40 bg-violet-500/20"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={15} className="relative" />
                  <span className="relative">{m}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">02 · Channel</p>
          <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Chat mode">
            {CHAT_MODES.map((m) => {
              const active = mode === m;
              const Meta = MODE_META[m];
              return (
                <button
                  key={m}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(m)}
                  className={cn(
                    "group rounded-2xl border p-2.5 text-center transition-all duration-300",
                    active
                      ? "border-cyan-300/50 bg-cyan-400/10 shadow-lg shadow-cyan-950/40"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]",
                  )}
                >
                  <Meta.icon size={20} className={cn("mx-auto transition-transform duration-300 group-hover:scale-110", active ? "text-cyan-300" : "text-slate-400")} />
                  <span className={cn("mt-1.5 block text-sm font-semibold capitalize", active ? "text-white" : "text-slate-300")}>{m}</span>
                  <span className="block text-[11px] text-slate-500">{Meta.blurb}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            03 · Frequencies <span className="normal-case tracking-normal">(optional)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visibleInterests.map((i) => {
              const on = picked.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs capitalize transition-all duration-200",
                    on
                      ? "border-violet-300/60 bg-violet-500/25 text-white shadow-md shadow-violet-950/50"
                      : "border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200",
                  )}
                >
                  #{i}
                </button>
              );
            })}
            <button
              onClick={() => setMoreInterests((v) => !v)}
              aria-expanded={moreInterests}
              className="rounded-full border border-dashed border-white/20 px-3 py-1 text-xs text-slate-400 hover:border-white/40 hover:text-white"
            >
              {moreInterests ? "− less" : `＋${INTERESTS.length - visibleInterests.length} more`}
            </button>
          </div>
        </div>

        {wsDown ? (
          <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-200">
            Realtime server unreachable. Start it with <code>npm run ws</code>, then retry.
          </p>
        ) : null}

        <div>
          <p className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            04 · Translation <span className="normal-case tracking-normal">(optional)</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span aria-hidden className="text-sm">🌐</span>
            <select
              value={lang}
              onChange={(e) => setChatLanguage(e.target.value)}
              aria-label="Chat language"
              className="w-auto flex-1 cursor-pointer appearance-none rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-300/50 focus:outline-none"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#141524]">
                  {l.code === "off" ? "Off — no translation" : l.label}
                </option>
              ))}
            </select>
            {lang !== "off" ? (
              <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-2.5 py-1 font-mono2 text-[10px] uppercase tracking-wider text-cyan-200">
                {lang}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
            Incoming messages auto-translate via Google — originals stay one tap away
            and nothing is ever stored.
          </p>
        </div>

        {searching ? (
          <SearchingAnimation onCancel={onStop} position={position} />
        ) : (
          <Button
            data-testid="find-stranger"
            className="w-full"
            size="lg"
            disabled={gated || wsDown}
            title={gated ? "Connect wallet and sign in first" : undefined}
            onClick={() => onFind({ mode, identity, interests: picked })}
          >
            {gated ? "Sign in to find a stranger" : "Find Stranger"}
          </Button>
        )}
        <p className="text-center text-xs text-slate-500">
          18+ only. Report / Block / Next are always one tap away.
        </p>
      </CardBody>
    </Card>
  );
}
