import type { Room } from "@/server/communities/catalog";
import { Reveal } from "@/components/ui/reveal";
import { InviteCard } from "@/components/InviteCard";

async function getRooms(base: string): Promise<Room[]> {
  try {
    const r = await fetch(`${base}/api/rooms`, { cache: "no-store" });
    if (!r.ok) return [];
    const j = (await r.json()) as { rooms: Room[] };
    return j.rooms;
  } catch {
    return [];
  }
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const metadata = { title: "Explore — 0xMingle" };

export default async function ExplorePage() {
  const rooms = await getRooms(baseUrl());
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Reveal>
        <h1 className="text-2xl font-bold">Explore the <span className="text-gradient">unknown</span></h1>
        <p className="mt-1 text-sm text-slate-400">Discover people through interests and rooms — no follower counts.</p>
      </Reveal>

      <h2 className="mt-8 font-semibold">Trending rooms</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r, i) => (
          <Reveal key={r.id} delay={Math.min(i * 0.06, 0.3)}>
            <div className="card-lift h-full rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="font-semibold">{r.name}</p>
              <p className="mt-1 text-sm text-slate-400">{r.description}</p>
              <p className="mt-3 text-xs">
                <span className={`rounded-full border px-2 py-0.5 ${r.access.kind === "public" ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-200" : "border-amber-300/30 bg-amber-500/10 text-amber-200"}`}>
                  {r.access.kind === "public" ? "Open" : r.access.kind === "wallet" ? "Wallet required" : "Gated"}
                </span>
                <span className="ml-2 text-slate-500">· {r.community}</span>
              </p>
            </div>
          </Reveal>
        ))}
        {rooms.length === 0 && <p className="text-sm text-slate-500">Rooms are loading — check back soon.</p>}
      </div>

      <h2 className="mt-8 font-semibold">Popular interests</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {["ai", "gaming", "web3", "travel", "music", "coding", "language"].map((t) => (
          <a key={t} href={`/chat?interest=${t}`} className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-300 transition-all hover:-translate-y-0.5 hover:border-violet-300/50 hover:text-white hover:shadow-lg hover:shadow-violet-950/40">#{t}</a>
        ))}
      </div>
      <InviteCard />
    </div>
  );
}
