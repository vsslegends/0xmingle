import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { platformTreasury, quoteTip } from "@/server/economy/fees";

const schema = z.object({ amountWei: z.string().regex(/^\d+$/, "wei integer expected") });

/** Authoritative tip quote: amount → recipient + platform fee. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  try {
    const q = quoteTip(BigInt(parsed.data.amountWei));
    return NextResponse.json({
      amountWei: q.amountWei.toString(),
      feeWei: q.feeWei.toString(),
      recipientWei: q.recipientWei.toString(),
      feeBps: q.feeBps,
      treasury: platformTreasury(),
    });
  } catch {
    return NextResponse.json({ error: "Amount must be positive." }, { status: 400 });
  }
}
