import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  sessionCookie,
  verifyChallenge,
  verifyRequestSchema,
} from "@/server/auth";
import { rateLimit } from "@/server/ratelimit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`verify:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = verifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = await verifyChallenge(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  const token = await createSessionToken(parsed.data.address);
  const res = NextResponse.json({ address: parsed.data.address.toLowerCase() });
  res.headers.set("Set-Cookie", sessionCookie(token));
  return res;
}
