import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth";
import { profileInputSchema } from "@/lib/profiles";
import { profileStore } from "@/server/profiles/store";

/** Own profile: read + update. Session-guarded. */
export async function GET(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const profile = await profileStore.get(session.address);
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = profileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const profile = await profileStore.upsert(session.address, parsed.data);
  return NextResponse.json({ profile });
}
