import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth";
import { clientKey, rateLimit } from "@/server/ratelimit";

/**
 * Returns ICE servers for WebRTC. Requires a signed-in session so TURN
 * credentials stay server-guarded. Falls back to STUN-only when unconfigured.
 */
export async function GET(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  const rl = await rateLimit(`turn:${clientKey(req, session.address)}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }
  const turnUrl = process.env.TURN_SERVER_URL;
  const turnUser = process.env.TURN_USERNAME;
  const turnCred = process.env.TURN_CREDENTIAL;
  const iceServers: Array<Record<string, unknown>> = [
    { urls: "stun:stun.lacity.pro:3478" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
  if (turnUrl && turnUser && turnCred) {
    iceServers.push({ urls: turnUrl, username: turnUser, credential: turnCred });
  }
  return NextResponse.json({ iceServers });
}
