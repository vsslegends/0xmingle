import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createWsTicket,
  readSessionToken,
} from "@/server/auth";

/**
 * Mints a short-lived WS ticket for the realtime gateway.
 * Same-origin fetch, so the HttpOnly session cookie is sent.
 * The gateway verifies the ticket signature — no shared state needed.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  const ticket = await createWsTicket(session.address);
  return NextResponse.json({ ticket });
}
