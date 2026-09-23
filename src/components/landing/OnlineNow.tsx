"use client";

import * as React from "react";

/** Live headcount from the realtime gateway's aggregate /health. Silent on failure. */
export function OnlineNow() {
  const [online, setOnline] = React.useState<number | null>(null);

  React.useEffect(() => {
    const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
    let http = base.replace(/^ws/, "http");
    // No mixed-content upgrades: https pages can't poll an http gateway.
    if (typeof window !== "undefined" && window.location.protocol === "https:" && http.startsWith("http:")) {
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`${http.replace(/\/$/, "")}/health`, { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as { online?: unknown };
        if (!cancelled && typeof j.online === "number") setOnline(j.online);
      } catch {
        /* gateway down — stay silent */
      }
    };
    void poll();
    const t = window.setInterval(() => void poll(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

  if (online === null) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      {online} online now
    </span>
  );
}
