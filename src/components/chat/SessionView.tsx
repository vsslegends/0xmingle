"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatInput, TypingIndicator } from "@/components/chat/ChatInput";
import { NextButton, BlockButton } from "@/components/chat/Controls";
import { ReportModal } from "@/components/ReportModal";
import type { Matchmaking } from "@/hooks/useMatchmaking";

const VideoRoom = dynamic(
  () => import("@/components/chat/VideoRoom").then((m) => m.VideoRoom),
  { ssr: false, loading: () => <p className="text-sm text-slate-500" role="status">Loading media…</p> },
);

function time(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Live conversation view: ephemeral messages, typing, Next/Stop/Block/Report. */
export function SessionView({ mm }: { mm: Matchmaking }) {
  const [reportOpen, setReportOpen] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const msgCount = mm.state.kind === "connected" ? mm.messages.length : 0;

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [msgCount]);

  if (mm.state.kind !== "connected") return null;
  const { sid, peer, mode, initiator } = mm.state;

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold">{peer}</p>
            <p className="text-xs text-emerald-300">● connected · {mode} · {sid}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setReportOpen(true)}>
              Report
            </Button>
            <BlockButton onBlock={mm.block} />
          </div>
        </div>

        <div
          className="max-h-80 space-y-2 overflow-y-auto rounded-xl bg-black/30 p-4"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
        >
          {mm.messages.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Say hi — messages vanish when you leave.</p>
          ) : (
            mm.messages.map((m, i) => (
              <div key={`${m.at}-${i}`} className={m.mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.mine
                      ? "max-w-[80%] rounded-2xl rounded-tr-md bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm text-black"
                      : "max-w-[80%] rounded-2xl rounded-tl-md bg-white/10 px-4 py-2 text-sm text-slate-200"
                  }
                >
                  <p>{m.text}</p>
                  <p className={m.mine ? "mt-0.5 text-[10px] text-black/60" : "mt-0.5 text-[10px] text-slate-500"}>
                    {m.mine ? "You" : m.from} · {time(m.at)}
                  </p>
                </div>
              </div>
            ))
          )}
          {mm.peerTyping ? <TypingIndicator /> : null}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={mm.sendText} onTyping={mm.setTyping} />

        {mode !== "text" ? (
          <VideoRoom
            key={sid}
            mode={mode}
            initiator={initiator}
            peer={peer}
            rtcSend={mm.rtcSend}
            onRtc={mm.onRtc}
          />
        ) : null}

        <div className="sticky bottom-0 flex items-center justify-between gap-2 bg-transparent pt-1">
          <Button variant="secondary" onClick={mm.stop}>
            Stop
          </Button>
          <NextButton onNext={mm.next} />
        </div>

        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} onReport={mm.report} />
      </CardBody>
    </Card>
  );
}
