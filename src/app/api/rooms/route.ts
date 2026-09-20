import { NextRequest, NextResponse } from "next/server";
import { listRooms, checkAccess } from "@/server/communities/catalog";

/** Discover rooms. Append ?room=<id> with session address for access check. */
export async function GET(req: NextRequest) {
  const roomId = new URL(req.url).searchParams.get("room");
  const rooms = listRooms();
  if (!roomId) return NextResponse.json({ rooms });
  const check = await checkAccess(roomId, { address: null });
  return NextResponse.json({ rooms, check });
}
