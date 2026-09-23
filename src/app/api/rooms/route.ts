import { NextRequest, NextResponse } from "next/server";
import { listRooms, checkAccess } from "@/server/communities/catalog";
import { clientKey, rateLimit } from "@/server/ratelimit";

/** Discover rooms. Append ?room=<id> with session address for access check. */
export async function GET(req: NextRequest) {
  const rl = await rateLimit(`rooms:${clientKey(req)}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }
  const roomId = new URL(req.url).searchParams.get("room");
  const rooms = listRooms();
  if (!roomId) return NextResponse.json({ rooms });
  const check = await checkAccess(roomId, { address: null });
  return NextResponse.json({ rooms, check });
}
