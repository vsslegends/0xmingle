"use client";

import * as React from "react";
import { INTERESTS, CHAT_MODES, type ChatMode } from "@/lib/interests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { SearchingAnimation } from "@/components/matchmaking/SearchingAnimation";
import { cn } from "@/lib/utils";

/**
 * Phase 1 interactive shell with local-only state.
 * Phase 3 replaces `onFind` with the real WS matchmaking hook.
 */
export function MatchmakingPanel() {
  const [mode, setMode] = React.useState<ChatMode>("text");
  const [identity, setIdentity] = React.useState<"anonymous" | "wallet">("anonymous");
  const [picked, setPicked] = React.useState<string[]>(["random"]);
  const [searching, setSearching] = React.useState(false);

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

        {searching ? (
          <SearchingAnimation onCancel={() => setSearching(false)} />
        ) : (
          <Button
            data-testid="find-stranger"
            className="w-full"
            size="lg"
            onClick={() => setSearching(true)}
          >
            Find Stranger
          </Button>
        )}
        <p className="text-center text-xs text-slate-500">
          18+ only. Report / Block / Next are always one tap away.
        </p>
      </CardBody>
    </Card>
  );
}
