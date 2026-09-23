import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth";
import { rateLimit } from "@/server/ratelimit";
import { blockInputSchema } from "@/server/moderation";

/**
 * POST /api/block — block a wallet (matchmaking exclusion + session end).
 * Session-guarded + rate-limited. Live exclusion is enforced by the gateway
 * (matchmaker.block via peer.block); this endpoint is the durable/API path
 * (rows land in blocks via the service role once Supabase is configured).
 */
export async function POST(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const rl = await rateLimit(`block:${session.address}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = blockInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid block request." }, { status: 400 });
  }
  if (parsed.data.blocked.toLowerCase() === session.address) {
    return NextResponse.json({ error: "Cannot block yourself." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
