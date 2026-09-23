"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Gift } from "lucide-react";
import { formatEther, parseEther } from "viem";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ChatInput, TypingIndicator } from "@/components/chat/ChatInput";
import { Message } from "@/components/chat/Message";
import { LinkSequence } from "@/components/chat/LinkSequence";
import { PeerHeader } from "@/components/chat/PeerHeader";
import { NextButton, BlockButton } from "@/components/chat/Controls";
import { ReportModal } from "@/components/ReportModal";
import { TipModal } from "@/components/TipModal";
import type { Matchmaking } from "@/hooks/useMatchmaking";

const VideoRoom = dynamic(
  () => import("@/components/chat/VideoRoom").then((m) => m.VideoRoom),
  { ssr: false, loading: () => <p className="text-sm text-slate-500" role="status">Loading media…</p> },
);

/** m:ss session clock. */
function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

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
  const paneRef = React.useRef<HTMLDivElement>(null);
  const sysTimer = React.useRef<number | null>(null);
  const [sysNote, setSysNote] = React.useState<string | null>(null);
  const msgCount = mm.state.kind === "connected" ? mm.messages.length : 0;
  const sidKey = mm.state.kind === "connected" ? mm.state.sid : null;

  // Live session clock, restarted per session.
  const [since, setSince] = React.useState<number>(() => Date.now());
  const [now, setNow] = React.useState<number>(() => Date.now());
  React.useEffect(() => {
    setSince(Date.now());
    setNow(Date.now());
  }, [sidKey]);
  React.useEffect(() => {
    if (!sidKey) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [sidKey]);

  // Smart autoscroll: stick to bottom only while the user is already there
  // (or the message is theirs); otherwise stack a "new" pill.
  const atBottomRef = React.useRef(true);
  const [skipped, setSkipped] = React.useState(0);
  const onPaneScroll = () => {
    const el = paneRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    atBottomRef.current = near;
    if (near) setSkipped(0);
  };
  const jumpLatest = () => {
    bottomRef.current?.scrollIntoView({ block: "end" });
    atBottomRef.current = true;
    setSkipped(0);
  };
  React.useEffect(() => {
    if (mm.state.kind !== "connected" || mm.messages.length === 0) return;
    const last = mm.messages[mm.messages.length - 1];
    if (last.mine || atBottomRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
      setSkipped(0);
    } else {
      setSkipped((s) => s + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgCount]);

  // New session → clear reply/edit drafts.
  React.useEffect(() => {
    setReplyToId(null);
    setEditingId(null);
  }, [sidKey]);

  // Tab visibility: background tabs must never emit read receipts.
  const [tabVisible, setTabVisible] = React.useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  React.useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Read receipts: only for the peer's messages, only when this tab is
  // visible, and only after the newest one has settled (~2.5s). This stops
  // false "Seen" ticks from background tabs or messages nobody looked at.
  // Throttled inside the hook (one frame per new id). Ephemeral like typing.
  const lastPeerMsg =
    mm.state.kind === "connected"
      ? [...mm.messages].reverse().find((m) => !m.mine && !m.deleted) ?? null
      : null;
  const lastVisibleId = lastPeerMsg?.id ?? null;
  React.useEffect(() => {
    if (!lastVisibleId || !tabVisible) return;
    const at = mm.state.kind === "connected"
      ? mm.messages.find((m) => m.id === lastVisibleId)?.at ?? 0
      : 0;
    const wait = Math.max(0, 2500 - (Date.now() - at));
    const t = window.setTimeout(() => {
      if (document.visibilityState === "visible") mm.markRead(lastVisibleId);
    }, wait);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastVisibleId, tabVisible]);

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
  const stats = `${fmtClock(now - since)} · ${msgCount} msg${msgCount === 1 ? "" : "s"}`;

  const byId = new Map(mm.messages.map((x) => [x.id, x]));
  const replyTarget = replyToId ? byId.get(replyToId) ?? null : null;
  const editingTarget = editingId ? byId.get(editingId) ?? null : null;
  // Seen: everything I sent at-or-before the message the peer last read.
  // (The peer's read receipt points at the newest visible bubble, which may
  // be theirs — so every one of my messages up to that index counts as seen.)
  let seenIdx = -1;
  if (mm.peerLastReadId) {
    const idx = mm.messages.findIndex((x) => x.id === mm.peerLastReadId);
    if (idx >= 0) seenIdx = idx;
  }

  const openTip = () => {
    setTipFlow(peerAddress ? { kind: "direct" } : { kind: "request" });
  };

  const note = (s: string) => {
    setSysNote(s);
    if (sysTimer.current) window.clearTimeout(sysTimer.current);
    sysTimer.current = window.setTimeout(() => setSysNote(null), 6000);
  };

  /** Terminal-style slash commands: /next /stop /tip 0.01 /report spam /help. */
  const handleCommand = (raw: string): boolean => {
    const [cmd, ...rest] = raw.slice(1).split(/\s+/);
    const arg = rest.join(" ").trim();
    switch ((cmd ?? "").toLowerCase()) {
      case "next":
        mm.next();
        return true;
      case "stop":
        mm.stop();
        return true;
      case "tip": {
        if (!arg) {
          note("// usage: /tip 0.01");
          return true;
        }
        try {
          const wei = parseEther(arg);
          if (wei <= 0n) {
            note("// amount must be positive.");
            return true;
          }
          mm.requestTip(wei.toString(), `${arg} ETH`);
          note(`// tip request: ${arg} ETH — awaiting stranger…`);
        } catch {
          note("// invalid amount. usage: /tip 0.01");
        }
        return true;
      }
      case "report": {
        if (!arg) {
          note("// usage: /report spam");
          return true;
        }
        mm.report(arg.slice(0, 48));
        return true;
      }
      case "help":
        note("// /next · /stop · /tip 0.01 · /report <reason>");
        return true;
      default:
        note(`// unknown command: /${cmd ?? ""}`);
        return true;
    }
  };

  /** Desktop pointer glow tracking for the signal field. */
  const onPaneMove = (e: React.MouseEvent) => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = paneRef.current;
    const r = el?.getBoundingClientRect();
    if (!el || !r) return;
    el.style.setProperty("--gx", `${e.clientX - r.left}px`);
    el.style.setProperty("--gy", `${e.clientY - r.top}px`);
  };

  const acceptedEth =
    tipFlow?.kind === "accepted" && /^\d+$/.test(tipFlow.amountWei)
      ? formatEther(BigInt(tipFlow.amountWei))
      : undefined;

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <PeerHeader peer={peer} mode={mode} sid={sid} stats={stats} />
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
        {mm.relayLegacy ? (
          <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100" role="alert">
            Realtime relay is outdated — replies, edits, deletes and Seen ticks won&apos;t reach the stranger until the
            gateway is redeployed. Messages still work.
          </p>
        ) : null}
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

        {/* Conversation column: viewport-sized so the pane is tall, the
            emoji/GIF sheet shrinks it instead of pushing Stop/Next down. */}
        <div className="flex h-[52vh] max-h-[30rem] min-h-[20rem] flex-col">
        <div className="relative min-h-[10rem] flex-1">
        <div
          ref={paneRef}
          onMouseMove={onPaneMove}
          onScroll={onPaneScroll}
          className="absolute inset-0 space-y-2 overflow-y-auto rounded-xl bg-black/30 p-4"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
        >
          <div aria-hidden className="signal-field pointer-events-none absolute inset-0 rounded-xl" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{ background: "radial-gradient(240px circle at var(--gx, 50%) var(--gy, 30%), rgb(139 124 246 / 0.14), transparent 70%)" }}
          />
          <LinkSequence sid={sid} peer={peer} />
          {mm.messages.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Say hi — messages vanish when you leave.</p>
          ) : (
            mm.messages.map((m, i) => {
              const target = m.replyToId ? byId.get(m.replyToId) : undefined;
              return (
                <Message
                  key={m.id}
                  m={m}
                  reactions={mm.reactions[m.id]}
                  onReact={(e) => mm.toggleReaction(m.id, e)}
                  replySnippet={target ? { from: target.mine ? "You" : target.from, text: target.text } : m.replyToId ? { from: "Stranger", text: "" } : null}
                  seen={m.mine && !m.deleted && i <= seenIdx}
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
        {skipped > 0 ? (
          <button
            type="button"
            onClick={jumpLatest}
            className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-1.5 text-xs font-bold text-black shadow-xl transition-transform hover:scale-105"
          >
            ↓ {skipped} new
          </button>
        ) : null}
        </div>

        <div className="shrink-0">
        <ChatInput
          onSend={(text) => { mm.sendText(text, replyToId ?? undefined); setReplyToId(null); }}
          onCommand={handleCommand}
          onFile={mm.sendFile}
          onTyping={mm.setTyping}
          replyTo={replyTarget ? { from: replyTarget.mine ? "You" : replyTarget.from, text: replyTarget.text } : null}
          editing={editingTarget && editingTarget.text ? { text: editingTarget.text } : null}
          onCancelMeta={() => { setReplyToId(null); setEditingId(null); }}
          onEditCommit={(text) => { if (editingId) mm.editMessage(editingId, text); setEditingId(null); }}
        />
        </div>
        </div>
        {sysNote ? (
          <p className="font-mono2 text-[11px] tracking-wide text-cyan-300/90" role="status">
            {sysNote}
          </p>
        ) : null}

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

        <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-2 border-t border-white/10 bg-[#0b0d18]/85 px-1 pb-1 pt-3 backdrop-blur-md">
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
