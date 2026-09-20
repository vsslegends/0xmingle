import { NextRequest, NextResponse } from "next/server";
import { issueChallenge, nonceRequestSchema } from "@/server/auth";
import { rateLimit } from "@/server/ratelimit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`nonce:${ip}`, 20, 60_000);
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
  const parsed = nonceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid address." }, { status: 400 });
  }
  const challenge = issueChallenge(parsed.data.address);
  return NextResponse.json(challenge);
}
