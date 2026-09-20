import { NextResponse } from "next/server";
import { publicView } from "@/lib/profiles";
import { profileStore } from "@/server/profiles/store";

/** Public stranger view. Respects privacy mode; never leaks history. */
export async function GET(_req: Request, { params }: { params: { address: string } }) {
  const address = params.address ?? "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address." }, { status: 400 });
  }
  const profile = await profileStore.get(address);
  if (!profile) return NextResponse.json({ profile: null });
  return NextResponse.json({ profile: publicView(profile) });
}
