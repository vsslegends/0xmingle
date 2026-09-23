"use client";

import { MatchmakingPanel } from "@/components/matchmaking/MatchmakingPanel";
import { SessionView } from "@/components/chat/SessionView";
import { AuthStatus } from "@/components/AuthStatus";
import { MatchFound } from "@/components/matchmaking/SearchingAnimation";
import { useSession } from "@/hooks/useSession";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

export function ChatExperience() {
  const session = useSession();
  const mm = useMatchmaking();
  const gated = session.status !== "signed-in";
  const wsDown = mm.status === "closed";

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-[380px_1fr]">
      <div>
        <h1 className="mb-2 text-2xl font-bold">Find a stranger</h1>
        <div className="mb-4">
          <AuthStatus />
        </div>
        <MatchmakingPanel
          searching={mm.state.kind === "searching"}
          gated={gated}
          wsDown={wsDown}
          position={mm.queuePosition}
          onFind={mm.find}
          onStop={mm.stop}
        />
        {mm.notice && mm.state.kind !== "connected" ? (
          <p role="status" className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-sm text-cyan-200">
            {mm.notice}
          </p>
        ) : null}
        {mm.error ? (
          <p role="alert" className="mt-3 text-sm text-slate-400">
            {mm.error}{" "}
            <button className="underline" onClick={() => mm.stop()}>
              Search again
            </button>
          </p>
        ) : null}
      </div>
      <div className="space-y-4">
        {mm.state.kind === "connected" ? (
          <>
            <MatchFound />
            <SessionView mm={mm} />
          </>
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                title={
                  gated
                    ? "Connect + sign to start"
                    : mm.status === "open"
                      ? "Not in a conversation yet"
                      : "Starting realtime…"
                }
                hint="Press “Find Stranger”. Messages are ephemeral — they vanish when you leave."
              />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
