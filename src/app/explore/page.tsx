import type { Room } from "@/server/communities/catalog";

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

export const metadata = { title: "Explore — STRANGER" };

export default async function ExplorePage() {
  const rooms = await getRooms(baseUrl());
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Explore</h1>
      <p className="mt-1 text-sm text-slate-400">Discover people through interests and rooms — no follower counts.</p>

      <h2 className="mt-8 font-semibold">Trending rooms</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="font-semibold">{r.name}</p>
            <p className="mt-1 text-sm text-slate-400">{r.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              {r.access.kind === "public" ? "Open" : r.access.kind === "wallet" ? "Wallet required" : "Gated"} · {r.community}
            </p>
          </div>
        ))}
        {rooms.length === 0 && <p className="text-sm text-slate-500">Rooms are loading — check back soon.</p>}
      </div>

      <h2 className="mt-8 font-semibold">Popular interests</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {["ai", "gaming", "web3", "travel", "music", "coding", "language"].map((t) => (
          <a key={t} href={`/chat?interest=${t}`} className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-300 hover:bg-white/5">{t}</a>
        ))}
      </div>
    </div>
  );
}
