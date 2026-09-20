import { MatchmakingPanel } from "@/components/matchmaking/MatchmakingPanel";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

export const metadata = { title: "Chat — STRANGER" };

export default function ChatPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-[380px_1fr]">
      <div>
        <h1 className="mb-4 text-2xl font-bold">Find a stranger</h1>
        <MatchmakingPanel />
      </div>
      <Card>
        <CardBody>
          <EmptyState
            title="Not in a conversation yet"
            hint="Press “Find Stranger”. Text chat lands in Phase 4, audio/video in Phase 5 — this shell keeps the layout stable."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-hidden>
            <div className="rounded-xl bg-black/30 p-4 text-sm text-slate-500">
              Remote video preview (Phase 5)
            </div>
            <div className="rounded-xl bg-black/30 p-4 text-sm text-slate-500">
              Chat messages appear here (Phase 4)
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
