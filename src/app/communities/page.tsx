import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import type { Room } from "@/server/communities/catalog";

async function getRooms(): Promise<Room[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const r = await fetch(`${base}/api/rooms`, { cache: "no-store" });
    if (!r.ok) return [];
    return ((await r.json()) as { rooms: Room[] }).rooms;
  } catch {
    return [];
  }
}

export const metadata = { title: "Communities — 0xMingle" };

export default async function CommunitiesPage() {
  const rooms = await getRooms();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Reveal>
        <h1 className="text-2xl font-bold">Find your <span className="text-gradient">frequency</span></h1>
        <p className="mt-1 text-sm text-slate-400">Join a room after random chat — or jump straight in.</p>
      </Reveal>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r, i) => (
          <Reveal key={r.id} delay={Math.min(i * 0.06, 0.3)}>
            <div className="card-lift h-full rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">{r.community}</p>
              <p className="mt-1 text-lg font-bold">{r.name}</p>
              <p className="mt-1 text-sm text-slate-400">{r.description}</p>
              <div className="mt-4 flex items-center gap-2">
                <Link href="/chat"><Button size="sm">Enter room</Button></Link>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${r.access.kind === "public" ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-200" : "border-amber-300/30 bg-amber-500/10 text-amber-200"}`}>
                  {r.access.kind === "public" ? "Open" : "Gated"}
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-500">Creator rooms (public / private / paid / token-gated) reuse this model. Paid and token gates enforce server-side when configured.</p>
    </div>
  );
}
