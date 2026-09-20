/**
 * Standalone realtime gateway: `npm run ws`.
 * Auth: HttpOnly session cookie (browser sends it on same-host WS handshake).
 * Dev bypass: ALLOW_GUEST_WS=1 + ?guest=0x... (never in production).
 * Messages are relayed ephemerally — never stored, never logged.
 */
import { WebSocketServer, WebSocket } from "ws";
import { SESSION_COOKIE, readSessionToken, verifyWsTicket } from "@/server/auth";
import { Matchmaker, type Mode } from "@/server/realtime/matcher";
import { createPresenceStore } from "@/server/realtime/store";
import { decodeClient, encode, type ServerMessage } from "@/server/realtime/protocol";
import { shortAddress, strangerLabel } from "@/lib/utils";

const PORT = Number(process.env.PORT ?? process.env.WS_PORT ?? 3001);
const ALLOW_GUEST = process.env.ALLOW_GUEST_WS === "1";

interface Conn {
  id: string;
  address: string;
  ws: WebSocket;
  identity: "anonymous" | "wallet";
  mode: Mode;
  interests: string[];
  alive: boolean;
  msgAt: number[];
  fileAt: number[];
  sessionsStarted: number[];
}

const matchmaker = new Matchmaker();
const presence = createPresenceStore();
const conns = new Map<string, Conn>();
let connSeq = 0;

const metrics = { matches: 0, messages: 0, nexts: 0, blocks: 0, reports: 0, rejects: 0 };

function anonNumber(address: string): number {
  let h = 2166136261;
  for (const c of address) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return 10000 + (Math.abs(h) % 90000);
}

function displayName(c: Conn): string {
  return c.identity === "anonymous" ? strangerLabel(anonNumber(c.address)) : shortAddress(c.address);
}

/**
 * Peer address eligible for tipping. Only revealed when the peer chose a
 * non-anonymous identity (wallet/profile). Anonymous peers stay hidden and
 * the client disables the Tip button. Never logged.
 */
function tipAddress(c: Conn | undefined): string | null {
  if (!c || c.identity === "anonymous") return null;
  return /^0x[0-9a-fA-F]{40}$/.test(c.address) ? c.address.toLowerCase() : null;
}

function send(c: Conn, msg: ServerMessage): void {
  if (c.ws.readyState === WebSocket.OPEN) c.ws.send(encode(msg));
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function checkRate(c: Conn, limit: number, windowMs: number): boolean {
  const now = Date.now();
  c.msgAt = c.msgAt.filter((t) => now - t < windowMs);
  if (c.msgAt.length >= limit) return false;
  c.msgAt.push(now);
  return true;
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws: WebSocket, req) => {
  // Attach the frame handler synchronously: a client may send its first
  // frame in onopen, before async auth below finishes. Buffer until authed
  // (bounded; dropped on auth failure) so fast first frames are never lost.
  let conn: Conn | null = null;
  const pending: string[] = [];
  const dispatch = (raw: string): void => {
    const c = conn;
    if (!c) return;
    const msg = decodeClient(raw);
    if (!msg) {
      send(c, { t: "error", p: { code: "BAD_MESSAGE", message: "Invalid message." } });
      return;
    }
    handle(c, msg.t, (msg as { p?: unknown }).p);
  };
  ws.on("message", (data) => {
    const raw = String(data);
    if (!conn) {
      if (pending.length < 20) pending.push(raw);
      return;
    }
    dispatch(raw);
  });
  ws.on("close", () => {
    if (!conn) return;
    const id = conn.id;
    conns.delete(id);
    void presence.setOffline(conn.address, id);
    matchmaker.leave(id);
    const ended = matchmaker.end(id, "ENDED");
    if (ended) {
      const peerId = ended.a === id ? ended.b : ended.a;
      const peer = conns.get(peerId);
      if (peer) send(peer, { t: "session.ended", p: { sid: ended.id, reason: "peer-disconnected" } });
    }
  });
  void (async () => {
    const cookies = parseCookies(req.headers.cookie);
    let address: string | null = null;
    const session = await readSessionToken(cookies[SESSION_COOKIE]);
    if (session) {
      address = session.address;
    } else {
      // Cross-host gateway: browsers don't send the web app's HttpOnly
      // cookie, so accept a short-lived signed ticket (?ticket=) minted by
      // /api/ws-ticket. Same SESSION_SECRET required on web + gateway.
      const url = new URL(req.url ?? "/", "http://localhost");
      const verified = await verifyWsTicket(url.searchParams.get("ticket"));
      if (verified) {
        address = verified.address;
      } else if (ALLOW_GUEST) {
        const guest = url.searchParams.get("guest") ?? "";
        if (/^0x[0-9a-fA-F]{40}$/.test(guest)) {
          address = guest.toLowerCase();
          console.warn("[ws] guest bypass active (dev only)");
        }
      }
    }
    if (!address) {
      metrics.rejects += 1;
      ws.close(4401, "unauthorized: connect wallet and sign in first");
      return;
    }

    const risk = await presence.getRisk(address);
    if (risk === "BANNED" || risk === "TEMP_BLOCKED") {
      ws.close(4403, "restricted");
      return;
    }

    conn = {
      id: `c_${++connSeq}_${Date.now().toString(36)}`,
      address,
      ws,
      identity: "anonymous",
      mode: "text",
      interests: [],
    alive: true,
    msgAt: [],
    fileAt: [],
    sessionsStarted: [],
    };
    conns.set(conn.id, conn);
    void presence.setOnline(address, conn.id);

    ws.on("pong", () => {
      if (conn) conn.alive = true;
    });
    pending.splice(0).forEach(dispatch);
  })();
});

function handle(conn: Conn, t: string, p: unknown): void {
  switch (t) {
    case "q.join": {
      const { mode, identity, interests } = p as Conn;
      const now = Date.now();
      conn.sessionsStarted = conn.sessionsStarted.filter((x) => now - x < 5 * 60 * 1000);
      if (conn.sessionsStarted.length >= 20) {
        send(conn, { t: "error", p: { code: "RATE_LIMITED", message: "Too many sessions. Slow down." } });
        return;
      }
      conn.mode = mode;
      conn.identity = identity;
      conn.interests = interests;
      conn.sessionsStarted.push(now);
      const session = matchmaker.join({
        id: conn.id,
        address: conn.address,
        mode,
        identity,
        interests,
        joinedAt: now,
      });
      if (!session) {
        send(conn, { t: "q.searching" });
        return;
      }
      metrics.matches += 1;
      const peerId = session.a === conn.id ? session.b : session.a;
      const peer = conns.get(peerId);
      if (peer) {
        send(peer, { t: "session.matched", p: { sid: session.id, peer: displayName(conn), mode: session.mode, initiator: true, peerAddress: tipAddress(conn) } });
      }
      send(conn, {
        t: "session.matched",
        p: { sid: session.id, peer: peer ? displayName(peer) : "Stranger", mode: session.mode, initiator: false, peerAddress: tipAddress(peer) },
      });
      return;
    }
    case "q.leave": {
      matchmaker.leave(conn.id);
      return;
    }
    case "chat.send": {
      const session = matchmaker.sessionOf(conn.id);
      if (!session) {
        send(conn, { t: "error", p: { code: "NO_SESSION", message: "No active conversation." } });
        return;
      }
      if (!checkRate(conn, 10, 10_000)) {
        send(conn, { t: "error", p: { code: "RATE_LIMITED", message: "Messaging too fast. Slow down." } });
        return;
      }
      const { text } = p as { text: string };
      const at = Date.now();
      const peer = conns.get(matchmaker.peerOf(conn.id) ?? "");
      if (peer) {
        send(peer, { t: "chat.msg", p: { sid: session.id, from: displayName(conn), text, at } });
      }
      metrics.messages += 1;
      send(conn, { t: "chat.ack", p: { sid: session.id, at } });
      return;
    }
    case "chat.typing": {
      const session = matchmaker.sessionOf(conn.id);
      if (!session) return;
      const peer = conns.get(matchmaker.peerOf(conn.id) ?? "");
      if (peer) send(peer, { t: "chat.typing", p: { sid: session.id, on: (p as { on: boolean }).on } });
      return;
    }
    case "chat.file": {
      const session = matchmaker.sessionOf(conn.id);
      if (!session) {
        send(conn, { t: "error", p: { code: "NO_SESSION", message: "No active conversation." } });
        return;
      }
      // Heavier payloads: stricter rate limit. Contents never stored or logged.
      const now = Date.now();
      conn.fileAt = conn.fileAt.filter((t) => now - t < 30_000);
      if (conn.fileAt.length >= 3) {
        send(conn, { t: "error", p: { code: "RATE_LIMITED", message: "Sending files too fast. Slow down." } });
        return;
      }
      conn.fileAt.push(now);
      const { name, mime, size, dataUrl } = p as { name: string; mime: string; size: number; dataUrl: string };
      const at = Date.now();
      const peer = conns.get(matchmaker.peerOf(conn.id) ?? "");
      if (peer) {
        send(peer, { t: "chat.file", p: { sid: session.id, from: displayName(conn), name, mime, size, dataUrl, at } });
      }
      metrics.messages += 1;
      send(conn, { t: "chat.ack", p: { sid: session.id, at } });
      return;
    }
    case "rtc.signal": {
      const session = matchmaker.sessionOf(conn.id);
      if (!session) return;
      const peer = conns.get(matchmaker.peerOf(conn.id) ?? "");
      if (peer) send(peer, { t: "rtc.signal", p: { sid: session.id, data: (p as { data: unknown }).data } });
      return;
    }
    case "session.next":
    case "session.end": {
      const ended = matchmaker.end(conn.id, "ENDED");
      if (t === "session.next") metrics.nexts += 1;
      if (ended) {
        const peer = conns.get(ended.a === conn.id ? ended.b : ended.a);
        if (peer) {
          send(peer, {
            t: "session.ended",
            p: { sid: ended.id, reason: t === "session.next" ? "peer-next" : "peer-left" },
          });
        }
        send(conn, { t: "session.ended", p: { sid: ended.id, reason: "you-left" } });
      }
      if (t === "session.next") {
        const matched = matchmaker.join({
          id: conn.id,
          address: conn.address,
          mode: conn.mode,
          identity: conn.identity,
          interests: conn.interests,
          joinedAt: Date.now(),
          strictRecent: true,
        });
        if (!matched) {
          send(conn, { t: "q.searching" });
        } else {
          metrics.matches += 1;
          const peer = conns.get(matched.a === conn.id ? matched.b : matched.a);
          if (peer) {
            send(peer, { t: "session.matched", p: { sid: matched.id, peer: displayName(conn), mode: matched.mode, initiator: true, peerAddress: tipAddress(conn) } });
          }
          send(conn, {
            t: "session.matched",
            p: { sid: matched.id, peer: peer ? displayName(peer) : "Stranger", mode: matched.mode, initiator: false, peerAddress: tipAddress(peer) },
          });
        }
      }
      return;
    }
    case "peer.block": {
      const session = matchmaker.sessionOf(conn.id);
      if (session) {
        const peerId = session.a === conn.id ? session.b : session.a;
        const peer = conns.get(peerId);
        const peerAddr = session.addrA === conn.address ? session.addrB : session.addrA;
        matchmaker.block(conn.address, peerAddr);
        matchmaker.end(conn.id, "BLOCKED");
        metrics.blocks += 1;
        if (peer) send(peer, { t: "session.ended", p: { sid: session.id, reason: "peer-left" } });
        send(conn, { t: "session.ended", p: { sid: session.id, reason: "blocked" } });
      }
      return;
    }
    case "peer.report": {
      const session = matchmaker.sessionOf(conn.id);
      metrics.reports += 1;
      // Phase 6 persists to moderation_events. Log addresses only, never contents.
      console.log(`[report] ${(p as { category: string }).category} sid=${session?.id ?? "none"}`);
      if (session) {
        const peer = conns.get(session.a === conn.id ? session.b : session.a);
        matchmaker.end(conn.id, "REPORTED");
        if (peer) send(peer, { t: "session.ended", p: { sid: session.id, reason: "peer-left" } });
        send(conn, { t: "session.ended", p: { sid: session.id, reason: "reported" } });
      }
      return;
    }
    default:
      send(conn, { t: "error", p: { code: "UNKNOWN", message: "Unknown message type." } });
  }
}

setInterval(() => {
  const all = Array.from(conns.values());
  for (const c of all) {
    if (!c.alive) {
      c.ws.terminate();
      continue;
    }
    c.alive = false;
    c.ws.ping();
  }
}, 30_000);

setInterval(() => {
  console.log(
    `[ws] online=${conns.size} queue=${matchmaker.queueSize} sessions=${matchmaker.activeSessions} matches=${metrics.matches} msgs=${metrics.messages} nexts=${metrics.nexts} blocks=${metrics.blocks} reports=${metrics.reports} rejects=${metrics.rejects}`,
  );
}, 60_000);

console.log(`[ws] realtime gateway on :${PORT} (ALLOW_GUEST_WS=${ALLOW_GUEST ? "1 — dev only" : "0"})`);
