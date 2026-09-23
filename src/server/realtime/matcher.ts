/**
 * Server-authoritative matchmaking. Pure logic (no sockets) so it is unit-testable.
 * Rules: same mode → interest overlap → FIFO → block/recent exclusion → no self/duplicate.
 */

export type Mode = "text" | "audio" | "video";
export type SessionState =
  | "SEARCHING" | "MATCHED" | "CONNECTING" | "CONNECTED"
  | "ENDING" | "ENDED" | "BLOCKED" | "REPORTED";

export interface Seeker {
  id: string; // connection id
  address: string; // lowercased wallet
  mode: Mode;
  identity: "anonymous" | "wallet";
  interests: string[];
  joinedAt: number;
  /** Set when requeued via NEXT: never fallback-match recent peers. */
  strictRecent?: boolean;
}

export interface Session {
  id: string;
  a: string; // connection id
  b: string; // connection id
  addrA: string;
  addrB: string;
  mode: Mode;
  state: SessionState;
  createdAt: number;
}

const RECENT_WINDOW_MS = 5 * 60 * 1000;

function pairKey(x: string, y: string): string {
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}

let sessionSeq = 0;

export class Matchmaker {
  private queue: Seeker[] = [];
  private sessions = new Map<string, Session>();
  private byConn = new Map<string, string>(); // connId -> sessionId
  private blocks = new Set<string>(); // pairKey(lower addrs)
  private recent = new Map<string, number>();

  get queueSize(): number {
    return this.queue.length;
  }

  get activeSessions(): number {
    return this.sessions.size;
  }

  /** 1-based queue position for a connection, or null when not queued. */
  positionOf(connId: string): number | null {
    const i = this.queue.findIndex((q) => q.id === connId);
    return i >= 0 ? i + 1 : null;
  }

  isBlocked(a: string, b: string): boolean {
    return this.blocks.has(pairKey(a.toLowerCase(), b.toLowerCase()));
  }

  block(a: string, b: string): void {
    this.blocks.add(pairKey(a.toLowerCase(), b.toLowerCase()));
  }

  /**
   * Join queue. Returns a new session on match, else null (SEARCHING).
   * Fresh finds allow a recent-peer fallback (low population still connects),
   * but only between two fresh seekers — a NEXT-er never gets forced back.
   */
  join(seeker: Seeker): Session | null {
    this.leave(seeker.id); // idempotent: no duplicates
    const now = Date.now();
    // prune stale recent pairs
    this.recent.forEach((t, k) => {
      if (now - t > RECENT_WINDOW_MS) this.recent.delete(k);
    });
    const candidate =
      this.pick(seeker, now, false) ??
      (!seeker.strictRecent ? this.pick(seeker, now, true) : null);
    if (!candidate) {
      this.queue.push({ ...seeker, joinedAt: now });
      return null;
    }
    this.queue = this.queue.filter((q) => q.id !== candidate.id);
    const session: Session = {
      id: `s_${++sessionSeq}_${now.toString(36)}`,
      a: seeker.id,
      b: candidate.id,
      addrA: seeker.address.toLowerCase(),
      addrB: candidate.address.toLowerCase(),
      mode: seeker.mode,
      state: "MATCHED",
      createdAt: now,
    };
    this.sessions.set(session.id, session);
    this.byConn.set(session.a, session.id);
    this.byConn.set(session.b, session.id);
    this.recent.set(pairKey(session.addrA, session.addrB), now);
    return session;
  }

  private pick(seeker: Seeker, now: number, includeRecent: boolean): Seeker | null {
    const mine = new Set(seeker.interests.map((i) => i.toLowerCase()));
    let best: Seeker | null = null;
    let bestScore = -1;
    // queue is FIFO-ordered; iterate in order for fairness
    for (const q of this.queue) {
      if (q.id === seeker.id) continue;
      if (q.address.toLowerCase() === seeker.address.toLowerCase()) continue; // no self-match
      if (q.mode !== seeker.mode) continue;
      if (this.isBlocked(q.address, seeker.address)) continue;
      if (!includeRecent) {
        const last = this.recent.get(pairKey(q.address.toLowerCase(), seeker.address.toLowerCase()));
        if (last !== undefined && now - last < RECENT_WINDOW_MS) continue;
      } else if (q.strictRecent) {
        continue; // they pressed NEXT — don't pull them back
      }
      let score = 0;
      for (const i of q.interests) {
        if (mine.has(i.toLowerCase())) score += 1;
      }
      if (
        score > bestScore ||
        (score === bestScore && best !== null && q.joinedAt < best.joinedAt)
      ) {
        best = q;
        bestScore = score;
      }
    }
    return best;
  }

  leave(connId: string): void {
    this.queue = this.queue.filter((q) => q.id !== connId);
  }

  sessionOf(connId: string): Session | undefined {
    const sid = this.byConn.get(connId);
    return sid ? this.sessions.get(sid) : undefined;
  }

  peerOf(connId: string): string | null {
    const s = this.sessionOf(connId);
    if (!s) return null;
    return s.a === connId ? s.b : s.a;
  }

  /** End session. Returns the ended session (for notify) or null. */
  end(connId: string, state: SessionState = "ENDED"): Session | null {
    const s = this.sessionOf(connId);
    if (!s) return null;
    s.state = state;
    this.sessions.delete(s.id);
    this.byConn.delete(s.a);
    this.byConn.delete(s.b);
    return s;
  }

  /** NEXT: end current session and requeue with same prefs (strict: someone new). */
  next(connId: string, prefs: Omit<Seeker, "joinedAt">): { ended: Session | null; matched: Session | null } {
    const ended = this.end(connId, "ENDED");
    const matched = this.join({ ...prefs, id: connId, joinedAt: Date.now(), strictRecent: true });
    return { ended, matched };
  }
}
