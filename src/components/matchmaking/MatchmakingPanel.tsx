"use client";

import * as React from "react";
import { INTERESTS, CHAT_MODES, type ChatMode } from "@/lib/interests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { SearchingAnimation } from "@/components/matchmaking/SearchingAnimation";
import { cn } from "@/lib/utils";

export interface FindOpts {
  mode: ChatMode;
  identity: "anonymous" | "wallet";
  interests: string[];
}

/** Setup panel. Server is authoritative — Find only emits q.join. */
export function MatchmakingPanel({
  searching,
  gated,
  wsDown,
  onFind,
  onStop,
}: {
  searching: boolean;
  gated: boolean;
  wsDown: boolean;
  onFind: (opts: FindOpts) => void;
  onStop: () => void;
}) {
  const [mode, setMode] = React.useState<ChatMode>("text");
  const [identity, setIdentity] = React.useState<"anonymous" | "wallet">("anonymous");
  const [picked, setPicked] = React.useState<string[]>(["random"]);

  const toggle = (i: string) =>
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-300">Identity</p>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Identity mode">
            {(["anonymous", "wallet"] as const).map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={identity === m}
                onClick={() => setIdentity(m)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm capitalize",
                  identity === m
                    ? "border-violet-400 bg-violet-500/20 text-white"
                    : "border-white/10 text-slate-400 hover:bg-white/5",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-300">Mode</p>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Chat mode">
            {CHAT_MODES.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm capitalize",
                  mode === m
                    ? "border-cyan-300 bg-cyan-400/15 text-white"
                    : "border-white/10 text-slate-400 hover:bg-white/5",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          {mode !== "text" ? (
            <p className="mt-1 text-xs text-slate-500">Audio/video media arrives in Phase 5 — matching works now.</p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-300">Interests <span className="text-slate-500">(optional)</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button key={i} onClick={() => toggle(i)} aria-pressed={picked.includes(i)}>
                <Badge
                  className={cn(
                    "cursor-pointer capitalize",
                    picked.includes(i) && "border-violet-400 bg-violet-500/20 text-white",
                  )}
                >
                  {i}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {wsDown ? (
          <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-200">
            Realtime server unreachable. Start it with <code>npm run ws</code>, then retry.
          </p>
        ) : null}

        {searching ? (
          <SearchingAnimation onCancel={onStop} />
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
