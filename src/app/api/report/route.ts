import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth";
import { rateLimit } from "@/server/ratelimit";
import { recordReport, reportInputSchema } from "@/server/moderation";

/**
 * POST /api/report — file a moderation report against a wallet.
 * Session-guarded + rate-limited. The gateway applies live escalation via
 * peer.report; this endpoint is the durable/API path (writes land in
 * moderation_events via the service role once Supabase is configured —
 * until then the report is counted in-process and acknowledged).
 * Never accepts chat contents — category + optional short detail only.
 */
export async function POST(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const rl = await rateLimit(`report:${session.address}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many reports. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = reportInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report." }, { status: 400 });
  }
  if (parsed.data.reported.toLowerCase() === session.address) {
    return NextResponse.json({ error: "Cannot report yourself." }, { status: 400 });
  }
  const level = recordReport(parsed.data.reported);
  // Address-only server log; never chat contents.
  console.log(`[report-api] category=${parsed.data.category} level=${level}`);
  return NextResponse.json({ ok: true });
}
