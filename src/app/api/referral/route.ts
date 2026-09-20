import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth";
import { referralCode, referralLink, applyReferral, balance, award, POINTS } from "@/server/rewards/ledger";
import { z } from "zod";

/** Referral code/link for signed-in user; apply a referral. No payouts. */
export async function GET(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const origin = new URL(req.url).origin;
  return NextResponse.json({
    code: referralCode(session.address),
    link: referralLink(origin, session.address),
    points: balance(session.address),
    awards: POINTS,
  });
}

export async function POST(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await req.json().catch(() => null) as { referrer?: unknown } | null;
  const parsed = z.object({ referrer: z.string().regex(/^0x[0-9a-fA-F]{40}$/) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid referrer." }, { status: 400 });
  const res = applyReferral(parsed.data.referrer, session.address);
  if (!res.ok) return NextResponse.json({ error: res.reason }, { status: 400 });
  const points = award(parsed.data.referrer, POINTS.invite);
  return NextResponse.json({ ok: true, referrerPoints: points });
}
