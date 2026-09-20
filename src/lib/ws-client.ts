"use client";

/** Reconnecting WebSocket wrapper. Replaceable transport (Supabase Realtime later) behind this API. */

export type Status = "idle" | "connecting" | "open" | "closed";

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private backoff = 1000;
  private closed = false;
  private handlers = new Map<string, Set<(p: unknown) => void>>();
  status: Status = "idle";

  constructor(
    private getUrl: string | (() => string | Promise<string>),
    private onStatus: (s: Status) => void,
  ) {}

  connect(): void {
    this.closed = false;
    this.setStatus("connecting");
    void Promise.resolve()
      .then(() => (typeof this.getUrl === "function" ? this.getUrl() : this.getUrl))
      .then((url) => {
        if (this.closed) return;
        const ws = new WebSocket(url);
        this.ws = ws;
        ws.onopen = () => {
          this.backoff = 1000;
          this.setStatus("open");
        };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(String(ev.data)) as { t: string; p?: unknown };
            const set = this.handlers.get(msg.t);
            set?.forEach((fn) => fn(msg.p));
          } catch {
            /* ignore malformed server frames */
          }
        };
        ws.onclose = () => {
          this.ws = null;
          if (this.closed) {
            this.setStatus("closed");
            return;
          }
          this.setStatus("connecting");
          const delay = Math.min(this.backoff, 8000);
          this.backoff *= 2;
          window.setTimeout(() => {
            if (!this.closed) this.connect();
          }, delay);
        };
        ws.onerror = () => {
          ws.close();
        };
      });
  }

  on(t: string, fn: (p: unknown) => void): () => void {
    let set = this.handlers.get(t);
    if (!set) {
      set = new Set();
      this.handlers.set(t, set);
    }
    set.add(fn);
    return () => {
      set?.delete(fn);
    };
  }

  send(t: string, p?: unknown): void {
    this.ws?.send(JSON.stringify(p === undefined ? { t } : { t, p }));
  }

  disconnect(): void {
    this.closed = true;
    this.ws?.close();
    this.ws = null;
    this.setStatus("closed");
  }

  private setStatus(s: Status): void {
    this.status = s;
    this.onStatus(s);
  }
}

export function wsUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
}

/**
 * WS URL with a fresh signed ticket for cross-host gateways.
 * Falls back to the bare URL when unsigned in (server then tries
 * the session cookie, which covers same-host dev/prod).
 */
export async function wsUrlWithTicket(): Promise<string> {
  const base = wsUrl();
  try {
    const res = await fetch("/api/ws-ticket", { credentials: "same-origin" });
    if (!res.ok) return base;
    const { ticket } = (await res.json()) as { ticket?: unknown };
    if (typeof ticket !== "string" || ticket.length === 0) return base;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}ticket=${encodeURIComponent(ticket)}`;
  } catch {
    return base;
  }
}
