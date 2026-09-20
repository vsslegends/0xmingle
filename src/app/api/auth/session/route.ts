import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSessionToken(token);
  if (!session) return NextResponse.json({ authenticated: false });
  return NextResponse.json({ authenticated: true, address: session.address });
}
