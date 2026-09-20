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
  from: string;
  text: string;
  at: number;
  mine: boolean;
  file?: ChatFile;
}

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
  const tipTimer = React.useRef<number | null>(null);
  const lastTipRequest = React.useRef<{ amountWei: string; display: string } | null>(null);
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
    setTipIncoming(null);
    setTipOutgoing(null);
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
        const { from, text, at } = p as { from: string; text: string; at: number };
        setMessages((m) => [...m.slice(-99), { from, text, at, mine: false }]);
      }),
      client.on("chat.file", (p) => {
        const { from, name, mime, size, dataUrl, at } = p as {
          from: string; name: string; mime: string; size: number; dataUrl: string; at: number;
        };
        setMessages((m) => [...m.slice(-99), { from, text: "", at, mine: false, file: { name, mime, size, dataUrl } }]);
      }),
      client.on("chat.typing", (p) => {
        setPeerTyping((p as { on: boolean }).on);
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
  }, [clearTipTimer, resetTips]);

  const find = React.useCallback((opts: JoinOpts) => {
    lastJoin.current = opts;
    setError(null);
    setMessages([]);
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
    setState({ kind: "searching" });
    clientRef.current?.send("session.next");
  }, []);

  const sendText = React.useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean || state.kind !== "connected") return;
      clientRef.current?.send("chat.send", { text: clean.slice(0, 500) });
      setMessages((m) => [...m.slice(-99), { from: "You", text: clean.slice(0, 500), at: Date.now(), mine: true }]);
    },
    [state.kind],
  );

  const setTyping = React.useCallback((on: boolean) => {
    clientRef.current?.send("chat.typing", { on });
  }, []);

  const sendFile = React.useCallback(
    (file: ChatFile) => {
      if (state.kind !== "connected") return;
      clientRef.current?.send("chat.file", file);
      setMessages((m) => [...m.slice(-99), { from: "You", text: "", at: Date.now(), mine: true, file }]);
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

  return { status, state, messages, peerTyping, error, find, stop, next, sendText, sendFile, setTyping, block, report, rtcSend, onRtc, tipIncoming, tipOutgoing, requestTip, respondTip, dismissTips };
}

export type Matchmaking = ReturnType<typeof useMatchmaking>;
