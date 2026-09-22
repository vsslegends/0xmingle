"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Gift } from "lucide-react";
import { formatEther } from "viem";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ChatInput, TypingIndicator } from "@/components/chat/ChatInput";
import { Message } from "@/components/chat/Message";
import { NextButton, BlockButton } from "@/components/chat/Controls";
import { ReportModal } from "@/components/ReportModal";
import { TipModal } from "@/components/TipModal";
import type { Matchmaking } from "@/hooks/useMatchmaking";

const VideoRoom = dynamic(
  () => import("@/components/chat/VideoRoom").then((m) => m.VideoRoom),
  { ssr: false, loading: () => <p className="text-sm text-slate-500" role="status">Loading media…</p> },
);

/** Live conversation view: ephemeral messages, typing, Next/Stop/Block/Report. */
export function SessionView({ mm }: { mm: Matchmaking }) {
  const [reportOpen, setReportOpen] = React.useState(false);
  const [replyToId, setReplyToId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tipFlow, setTipFlow] = React.useState<
    | null
    | { kind: "direct" }
    | { kind: "request" }
    | { kind: "accepted"; address: string; amountWei: string }
  >(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const msgCount = mm.state.kind === "connected" ? mm.messages.length : 0;
  const sidKey = mm.state.kind === "connected" ? mm.state.sid : null;

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [msgCount]);

  // New session → clear reply/edit drafts.
  React.useEffect(() => {
    setReplyToId(null);
    setEditingId(null);
  }, [sidKey]);

  // Read receipts: advertise the latest visible message id to the peer.
  // Throttled inside the hook (one frame per new id). Ephemeral like typing.
  const lastVisibleId =
    mm.state.kind === "connected" && mm.messages.length > 0
      ? mm.messages[mm.messages.length - 1].id
      : null;
  React.useEffect(() => {
    if (lastVisibleId) mm.markRead(lastVisibleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastVisibleId]);

  // Peer accepted our request → open the send modal prefilled with the amount.
  React.useEffect(() => {
    const o = mm.tipOutgoing;
    if (o?.status === "accepted") {
      setTipFlow({ kind: "accepted", address: o.address, amountWei: o.amountWei });
    }
  }, [mm.tipOutgoing]);

  if (mm.state.kind !== "connected") return null;
  const { sid, peer, mode, initiator, peerAddress } = mm.state;
  const incoming = mm.tipIncoming;
  const outgoing = mm.tipOutgoing;

  const byId = new Map(mm.messages.map((x) => [x.id, x]));
  const replyTarget = replyToId ? byId.get(replyToId) ?? null : null;
  const editingTarget = editingId ? byId.get(editingId) ?? null : null;
  // Seen: the last of my messages at-or-before the id the peer advertised.
  let seenId: string | null = null;
  if (mm.peerLastReadId) {
    const idx = mm.messages.findIndex((x) => x.id === mm.peerLastReadId);
    if (idx >= 0) {
      for (let i = idx; i >= 0; i--) {
        if (mm.messages[i].mine && !mm.messages[i].deleted) { seenId = mm.messages[i].id; break; }
      }
    }
  }

  const openTip = () => {
    setTipFlow(peerAddress ? { kind: "direct" } : { kind: "request" });
  };

  const acceptedEth =
    tipFlow?.kind === "accepted" && /^\d+$/.test(tipFlow.amountWei)
      ? formatEther(BigInt(tipFlow.amountWei))
      : undefined;

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold">{peer}</p>
            <p className="text-xs text-emerald-300">● connected · {mode} · {sid}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={openTip}
              title={peerAddress ? "Send an ETH tip to this stranger" : "Ask this stranger to accept a tip (they stay anonymous unless they accept)"}
              data-testid="tip-button"
            >
              <Gift size={14} />
              Tip
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setReportOpen(true)}>
              Report
            </Button>
            <BlockButton onBlock={mm.block} />
          </div>
        </div>
        {outgoing?.status === "pending" ? (
          <p className="text-xs text-slate-400" role="status">Tip request sent — waiting for the stranger…</p>
        ) : null}
        {outgoing?.status === "declined" ? (
          <p className="text-xs text-slate-400" role="status">
            Stranger declined the tip.{" "}
            <button className="underline" onClick={() => mm.dismissTips()}>Dismiss</button>
          </p>
        ) : null}
        {outgoing?.status === "expired" ? (
          <p className="text-xs text-slate-400" role="status">
            Tip request expired with no answer.{" "}
            <button className="underline" onClick={() => mm.dismissTips()}>Dismiss</button>
          </p>
        ) : null}

        <div
          className="max-h-80 space-y-2 overflow-y-auto rounded-xl bg-black/30 p-4"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
        >
          {mm.messages.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Say hi — messages vanish when you leave.</p>
          ) : (
            mm.messages.map((m) => {
              const target = m.replyToId ? byId.get(m.replyToId) : undefined;
              return (
                <Message
                  key={m.id}
                  m={m}
                  reactions={mm.reactions[m.id]}
                  onReact={(e) => mm.toggleReaction(m.id, e)}
                  replySnippet={target ? { from: target.mine ? "You" : target.from, text: target.text } : m.replyToId ? { from: "Stranger", text: "" } : null}
                  seen={seenId === m.id}
                  delivered={!!mm.delivered[m.id]}
                  onReply={() => { setEditingId(null); setReplyToId(m.id); }}
                  onEdit={m.mine && m.text && !m.deleted ? () => { setReplyToId(null); setEditingId(m.id); } : undefined}
                  onDelete={m.mine && !m.deleted ? () => mm.deleteMessage(m.id) : undefined}
                />
              );
            })
          )}
          {mm.peerTyping ? <TypingIndicator /> : null}
          <div ref={bottomRef} />
        </div>

        <ChatInput
          onSend={(text) => { mm.sendText(text, replyToId ?? undefined); setReplyToId(null); }}
          onFile={mm.sendFile}
          onTyping={mm.setTyping}
          replyTo={replyTarget ? { from: replyTarget.mine ? "You" : replyTarget.from, text: replyTarget.text } : null}
          editing={editingTarget && editingTarget.text ? { text: editingTarget.text } : null}
          onCancelMeta={() => { setReplyToId(null); setEditingId(null); }}
          onEditCommit={(text) => { if (editingId) mm.editMessage(editingId, text); setEditingId(null); }}
        />

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
        <TipModal
          open={tipFlow?.kind === "direct"}
          onClose={() => setTipFlow(null)}
          recipient={peerAddress ?? undefined}
          onSent={(d) => mm.sendText(`\u{1F496} Tipped ${d}`)}
        />
        <TipModal
          open={tipFlow?.kind === "request"}
          onClose={() => setTipFlow(null)}
          mode="request"
          onRequest={(wei, display) => {
            mm.requestTip(wei, display);
            setTipFlow(null);
          }}
        />
        <TipModal
          open={tipFlow?.kind === "accepted"}
          onClose={() => { setTipFlow(null); mm.dismissTips(); }}
          recipient={tipFlow?.kind === "accepted" ? tipFlow.address : undefined}
          initialAmount={acceptedEth}
          initialCurrency="ETH"
          onSent={(d) => mm.sendText(`\u{1F496} Tipped ${d}`)}
        />
        <Modal open={incoming !== null} onClose={() => mm.respondTip(false)} label="Tip request">
          <h2 className="text-lg font-bold">Someone wants to tip you</h2>
          <p className="mt-1 text-sm text-slate-400">
            <span className="text-white">{incoming?.from}</span> offers{" "}
            <span className="font-semibold text-white">{incoming?.display}</span>.
            Accepting reveals your wallet address for this one tip — nothing else.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => mm.respondTip(false)}>Decline</Button>
            <Button onClick={() => mm.respondTip(true)}>Accept tip</Button>
          </div>
        </Modal>
      </CardBody>
    </Card>
  );
}
