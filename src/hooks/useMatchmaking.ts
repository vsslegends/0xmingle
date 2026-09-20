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
  const clientRef = React.useRef<RealtimeClient | null>(null);
  const lastJoin = React.useRef<JoinOpts | null>(null);

  React.useEffect(() => {
    const client = new RealtimeClient(wsUrlWithTicket, setStatus);
    clientRef.current = client;
    const offs = [
      client.on("q.searching", () => {
        setError(null);
        setState({ kind: "searching" });
      }),
      client.on("session.matched", (p) => {
        const { sid, peer, mode, initiator, peerAddress } = p as {
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
      }),
      client.on("session.ended", (p) => {
        const { reason } = p as { reason: string };
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
    ];
    client.connect();
    return () => {
      offs.forEach((off) => off());
      client.disconnect();
      clientRef.current = null;
    };
  }, []);

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

  return { status, state, messages, peerTyping, error, find, stop, next, sendText, sendFile, setTyping, block, report, rtcSend, onRtc };
}

export type Matchmaking = ReturnType<typeof useMatchmaking>;
