"use client";

import * as React from "react";
import { RealtimeClient, wsUrlWithTicket, type Status } from "@/lib/ws-client";
import type { ChatMode as Mode } from "@/lib/interests";

export type MatchState =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "connected"; sid: string; peer: string; mode: Mode; initiator: boolean; peerAddress: string | null };

export interface ChatFile {
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
}

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  at: number;
  mine: boolean;
  file?: ChatFile;
  replyToId?: string;
  edited?: boolean;
  editedAt?: number;
  deleted?: boolean;
}

export type ReactionMap = Record<string, Record<string, { count: number; mine: boolean }>>;

export type RtcSignal = { kind: string; [k: string]: unknown };

export interface TipIncoming {
  sid: string;
  from: string;
  amountWei: string;
  display: string;
}

export type TipOutgoing =
  | { status: "pending" }
  | { status: "accepted"; address: string; amountWei: string; display: string }
  | { status: "declined" }
  | { status: "expired" };

interface JoinOpts {
  mode: Mode;
  identity: "anonymous" | "wallet";
  interests: string[];
}

/**
 * Owns one RealtimeClient per mount. Server is authoritative:
 * every state change comes from a server frame.
 */
export function useMatchmaking() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [state, setState] = React.useState<MatchState>({ kind: "idle" });
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [peerTyping, setPeerTyping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tipIncoming, setTipIncoming] = React.useState<TipIncoming | null>(null);
  const [tipOutgoing, setTipOutgoing] = React.useState<TipOutgoing | null>(null);
  const [reactions, setReactions] = React.useState<ReactionMap>({});
  const [peerLastReadId, setPeerLastReadId] = React.useState<string | null>(null);
  // Per-message delivery: gateway acks each relayed text/file with its id.
  const [delivered, setDelivered] = React.useState<Record<string, true>>({});
  // Relay freshness: new gateways say hello with caps on connect. A socket
  // that stays open without hello is a stale (pre-chat-depth) gateway —
  // edits/deletes/reads/Seen will silently fail against it.
  const [relay, setRelay] = React.useState<"unknown" | "ready" | "legacy">("unknown");
  // Ref mirror: toggleReaction must decide on/off synchronously before send.
  const reactionsRef = React.useRef<ReactionMap>({});
  const applyReactions = React.useCallback(
    (fn: (prev: ReactionMap) => ReactionMap) => {
      reactionsRef.current = fn(reactionsRef.current);
      setReactions(reactionsRef.current);
    },
    [],
  );
  const tipTimer = React.useRef<number | null>(null);
  const lastTipRequest = React.useRef<{ amountWei: string; display: string } | null>(null);
  const lastReadSent = React.useRef<string | null>(null);
  const clientRef = React.useRef<RealtimeClient | null>(null);
  const lastJoin = React.useRef<JoinOpts | null>(null);

  const clearTipTimer = React.useCallback(() => {
    if (tipTimer.current !== null) {
      window.clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
  }, []);

  const resetTips = React.useCallback(() => {
    clearTipTimer();
    lastTipRequest.current = null;
    lastReadSent.current = null;
    setTipIncoming(null);
    setTipOutgoing(null);
    reactionsRef.current = {};
    setReactions({});
    setPeerLastReadId(null);
    setDelivered({});
  }, [clearTipTimer]);

  React.useEffect(() => {
    const client = new RealtimeClient(wsUrlWithTicket, setStatus);
    clientRef.current = client;
    const offs = [
      client.on("q.searching", () => {
        setError(null);
        setState({ kind: "searching" });
      }),
      client.on("session.matched", (p) => {        const { sid, peer, mode, initiator, peerAddress } = p as {
          sid: string;
          peer: string;
          mode: Mode;
          initiator: boolean;
          peerAddress?: unknown;
        };
        setMessages([]);
        setPeerTyping(false);
        setError(null);
        // Only accept a well-formed address; anonymous peers send null.
        const addr =
          typeof peerAddress === "string" && /^0x[0-9a-fA-F]{40}$/.test(peerAddress)
            ? peerAddress.toLowerCase()
            : null;
        setState({ kind: "connected", sid, peer, mode, initiator: initiator === true, peerAddress: addr });
        resetTips();
      }),
      client.on("session.ended", (p) => {
        const { reason } = p as { reason: string };
        resetTips();
        if (reason === "you-left" || reason === "blocked" || reason === "reported") {
          setState({ kind: "idle" });
        } else {
          setState({ kind: "idle" });
          setError(
            reason === "peer-next"
              ? "Stranger pressed Next."
              : reason === "peer-disconnected"
                ? "Stranger disconnected."
                : "Conversation ended.",
          );
        }
        setPeerTyping(false);
      }),
      client.on("chat.msg", (p) => {
        const { from, text, at, id, replyToId } = p as { from: string; text: string; at: number; id?: unknown; replyToId?: unknown };
        const mid = typeof id === "string" && id ? id : `${from}-${at}`;
        const reply = typeof replyToId === "string" && replyToId ? replyToId : undefined;
        setMessages((m) => [...m.slice(-99), { id: mid, from, text, at, mine: false, replyToId: reply }]);
      }),
      client.on("chat.file", (p) => {
        const { from, name, mime, size, dataUrl, at, id } = p as {
          from: string; name: string; mime: string; size: number; dataUrl: string; at: number; id?: unknown;
        };
        const mid = typeof id === "string" && id ? id : `${from}-${at}`;
        setMessages((m) => [...m.slice(-99), { id: mid, from, text: "", at, mine: false, file: { name, mime, size, dataUrl } }]);
      }),
      client.on("chat.reacted", (p) => {
        const { toId, emoji, on } = p as { toId: unknown; emoji: unknown; on: unknown };
        if (typeof toId !== "string" || typeof emoji !== "string" || typeof on !== "boolean") return;
        applyReactions((prev) => {
          const entry = { ...(prev[toId] ?? {}) };
          if (on) {
            const cur = entry[emoji] ?? { count: 0, mine: false };
            entry[emoji] = { count: cur.count + 1, mine: cur.mine };
          } else {
            const cur = entry[emoji];
            if (!cur) return prev;
            if (cur.count <= 1) delete entry[emoji];
            else entry[emoji] = { count: cur.count - 1, mine: false };
          }
          const next = { ...prev };
          if (Object.keys(entry).length === 0) delete next[toId];
          else next[toId] = entry;
          return next;
        });
      }),
      client.on("chat.typing", (p) => {
        setPeerTyping((p as { on: boolean }).on);
      }),
      // Remote edit: only apply when the target was authored by the peer
      // (mine === false). Prevents a stranger from rewriting your bubbles.
      client.on("chat.edited", (p) => {
        const { id, text, at } = p as { id: unknown; text: unknown; at: unknown };
        if (typeof id !== "string" || typeof text !== "string" || typeof at !== "number") return;
        setMessages((m) => m.map((msg) => (msg.id === id && !msg.mine ? { ...msg, text: text.slice(0, 500), edited: true, editedAt: at } : msg)));
      }),
      // Remote delete: same authorship rule — only peer's own bubbles vanish.
      client.on("chat.deleted", (p) => {
        const { id } = p as { id: unknown };
        if (typeof id !== "string") return;
        setMessages((m) => m.map((msg) => (msg.id === id && !msg.mine ? { ...msg, deleted: true, text: "", file: undefined } : msg)));
      }),
      client.on("chat.read", (p) => {
        const { lastId } = p as { lastId?: unknown };
        if (typeof lastId === "string" && lastId) setPeerLastReadId(lastId);
        else if (lastId === undefined) setPeerLastReadId(null);
      }),
      // Delivery receipt: gateway relayed my message (by id) to the peer socket.
      client.on("chat.ack", (p) => {
        const { id } = p as { id?: unknown };
        if (typeof id !== "string" || !id) return;
        setDelivered((d) => (d[id] ? d : { ...d, [id]: true }));
      }),
      client.on("hello", (p) => {
        const { caps } = p as { caps?: unknown };
        if (Array.isArray(caps) && caps.includes("chat.edit")) setRelay("ready");
        else setRelay("legacy");
      }),
      client.on("error", (p) => {
        setError((p as { message: string }).message ?? "Something went wrong.");
      }),
      client.on("tip.incoming", (p) => {
        const { sid, from, amountWei, display } = p as {
          sid: unknown; from: unknown; amountWei: unknown; display: unknown;
        };
        if (
          typeof sid !== "string" || typeof from !== "string" ||
          typeof amountWei !== "string" || typeof display !== "string"
        ) return;
        setTipOutgoing(null);
        setTipIncoming({ sid, from: from.slice(0, 32), amountWei, display: display.slice(0, 24) });
      }),
      client.on("tip.answer", (p) => {
        const { accepted, address } = p as { accepted: unknown; address: unknown };
        clearTipTimer();
        setTipIncoming(null);
        if (accepted === true && typeof address === "string" && /^0x[0-9a-fA-F]{40}$/.test(address)) {
          const req = lastTipRequest.current;
          setTipOutgoing({
            status: "accepted",
            address: address.toLowerCase(),
            amountWei: req?.amountWei ?? "",
            display: req?.display ?? "",
          });
        } else {
          setTipOutgoing({ status: "declined" });
        }
      }),
    ];
    client.connect();
    return () => {
      offs.forEach((off) => off());
      client.disconnect();
      clientRef.current = null;
      clearTipTimer();
    };
  }, [clearTipTimer, resetTips, applyReactions]);

  // Stale-gateway detector: a fresh relay says hello immediately on connect.
  // No hello within 3s of open ⇒ legacy relay, chat-depth frames won't deliver.
  React.useEffect(() => {
    if (status !== "open") {
      if (status === "closed" || status === "idle") setRelay("unknown");
      return;
    }
    setRelay("unknown");
    const t = window.setTimeout(() => {
      setRelay((r) => (r === "unknown" ? "legacy" : r));
    }, 3000);
    return () => window.clearTimeout(t);
  }, [status]);

  const find = React.useCallback((opts: JoinOpts) => {
    lastJoin.current = opts;
    setError(null);
    setMessages([]);
    setPeerLastReadId(null);
    setDelivered({});
    lastReadSent.current = null;
    setState({ kind: "searching" });
    clientRef.current?.send("q.join", opts);
  }, []);

  const stop = React.useCallback(() => {
    clientRef.current?.send("q.leave");
    clientRef.current?.send("session.end");
    setState({ kind: "idle" });
  }, []);

  const next = React.useCallback(() => {
    setMessages([]);
    setPeerTyping(false);
    setPeerLastReadId(null);
    setDelivered({});
    lastReadSent.current = null;
    setState({ kind: "searching" });
    clientRef.current?.send("session.next");
  }, []);

  const sendText = React.useCallback(
    (text: string, replyToId?: string) => {
      const clean = text.trim();
      if (!clean || state.kind !== "connected") return;
      const id = crypto.randomUUID();
      clientRef.current?.send("chat.send", replyToId ? { text: clean.slice(0, 500), id, replyToId } : { text: clean.slice(0, 500), id });
      setMessages((m) => [...m.slice(-99), { id, from: "You", text: clean.slice(0, 500), at: Date.now(), mine: true, replyToId }]);
    },
    [state.kind],
  );

  const setTyping = React.useCallback((on: boolean) => {
    clientRef.current?.send("chat.typing", { on });
  }, []);

  const sendFile = React.useCallback(
    (file: ChatFile) => {
      if (state.kind !== "connected") return;
      const id = crypto.randomUUID();
      clientRef.current?.send("chat.file", { ...file, id });
      setMessages((m) => [...m.slice(-99), { id, from: "You", text: "", at: Date.now(), mine: true, file }]);
    },
    [state.kind],
  );

  const block = React.useCallback(() => {
    clientRef.current?.send("peer.block");
  }, []);

  const report = React.useCallback((category: string, detail?: string) => {
    clientRef.current?.send("peer.report", { category, detail });
  }, []);

  /** Ask an anonymous peer to accept a tip. Server relays; address only flows on accept. */
  const requestTip = React.useCallback((amountWei: string, display: string) => {
    clearTipTimer();
    lastTipRequest.current = { amountWei, display: display.slice(0, 24) };
    setTipIncoming(null);
    setTipOutgoing({ status: "pending" });
    clientRef.current?.send("tip.request", { amountWei, display: display.slice(0, 24) });
    tipTimer.current = window.setTimeout(() => {
      setTipOutgoing((cur) => (cur?.status === "pending" ? { status: "expired" } : cur));
      tipTimer.current = null;
    }, 60_000);
  }, [clearTipTimer]);

  /** Answer an incoming tip request. Accept reveals your address for this one tip. */
  const respondTip = React.useCallback((accepted: boolean) => {
    clientRef.current?.send("tip.response", { accepted });
    setTipIncoming(null);
    if (!accepted) setTipOutgoing({ status: "declined" });
  }, []);

  const dismissTips = React.useCallback(() => {
    resetTips();
  }, [resetTips]);

  /** Toggle an emoji reaction on a message. Relayed ephemerally like chat. */
  const toggleReaction = React.useCallback((toId: string, emoji: string) => {
    const cur = reactionsRef.current[toId]?.[emoji];
    const on = !(cur?.mine === true);
    applyReactions((prev) => {
      const entry = { ...(prev[toId] ?? {}) };
      if (on) {
        entry[emoji] = { count: (entry[emoji]?.count ?? 0) + 1, mine: true };
      } else if (entry[emoji]) {
        if (entry[emoji].count <= 1) delete entry[emoji];
        else entry[emoji] = { count: entry[emoji].count - 1, mine: false };
      }
      const next = { ...prev };
      if (Object.keys(entry).length === 0) delete next[toId];
      else next[toId] = entry;
      return next;
    });
    clientRef.current?.send("chat.react", { toId, emoji, on });
  }, [applyReactions]);

  const rtcSend = React.useCallback((data: RtcSignal) => {
    clientRef.current?.send("rtc.signal", { data });
  }, []);

  const onRtc = React.useCallback((cb: (data: RtcSignal) => void) => {
    const client = clientRef.current;
    if (!client) return () => {};
    return client.on("rtc.signal", (p) => {
      cb((p as { data: RtcSignal }).data);
    });
  }, []);

  /** Edit one of my own text bubbles. Peer applies it only if it was mine. */
  const editMessage = React.useCallback((id: string, text: string) => {
    const clean = text.trim().slice(0, 500);
    if (!clean) return;
    clientRef.current?.send("chat.edit", { id, text: clean });
    setMessages((m) => m.map((msg) => (msg.id === id && msg.mine && !msg.deleted ? { ...msg, text: clean, edited: true, editedAt: Date.now() } : msg)));
  }, []);

  /** Delete one of my own bubbles (tombstone locally, relay to peer). */
  const deleteMessage = React.useCallback((id: string) => {
    clientRef.current?.send("chat.delete", { id });
    setMessages((m) => m.map((msg) => (msg.id === id && msg.mine ? { ...msg, deleted: true, text: "", file: undefined } : msg)));
  }, []);

  /** Tell the peer which message id we've seen (throttled by change). */
  const markRead = React.useCallback((lastId: string | null) => {
    if (!lastId || lastReadSent.current === lastId) return;
    lastReadSent.current = lastId;
    clientRef.current?.send("chat.read", { lastId });
  }, []);

  return { status, state, messages, peerTyping, error, find, stop, next, sendText, sendFile, setTyping, block, report, rtcSend, onRtc, tipIncoming, tipOutgoing, requestTip, respondTip, dismissTips, reactions, toggleReaction, editMessage, deleteMessage, markRead, peerLastReadId, delivered, relayLegacy: relay === "legacy" };
}

export type Matchmaking = ReturnType<typeof useMatchmaking>;
