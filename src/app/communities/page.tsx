import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export const metadata = { title: "Communities — STRANGER" };

export default async function CommunitiesPage() {
  const rooms = await getRooms();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Communities</h1>
      <p className="mt-1 text-sm text-slate-400">Join a room after random chat — or jump straight in.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">{r.community}</p>
            <p className="mt-1 text-lg font-bold">{r.name}</p>
            <p className="mt-1 text-sm text-slate-400">{r.description}</p>
            <div className="mt-4 flex items-center gap-2">
              <Link href="/chat"><Button size="sm">Enter room</Button></Link>
              <span className="text-xs text-slate-500">{r.access.kind === "public" ? "Open" : "Gated"}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-500">Creator rooms (public / private / paid / token-gated) reuse this model. Paid and token gates enforce server-side when configured.</p>
    </div>
  );
}
