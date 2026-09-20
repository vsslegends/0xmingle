import { z } from "zod";

/** WS envelope v1. Client→server types prefixed `q.`/`chat.`/`session.`; server→client `matched`, `chat.msg`, etc. */

export const clientMessageSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("q.join"), p: z.object({
    mode: z.enum(["text", "audio", "video"]),
    identity: z.enum(["anonymous", "wallet"]),
    interests: z.array(z.string().min(1).max(24)).max(11).default([]),
  }) }),
  z.object({ t: z.literal("q.leave") }),
  z.object({ t: z.literal("chat.send"), p: z.object({ text: z.string().min(1).max(500) }) }),
  z.object({ t: z.literal("chat.typing"), p: z.object({ on: z.boolean() }) }),
  z.object({ t: z.literal("chat.file"), p: z.object({
    name: z.string().min(1).max(120),
    mime: z.enum(["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain"]),
    size: z.number().int().min(1).max(5_000_000),
    dataUrl: z.string().min(1).max(2_000_000).regex(/^data:(image\/(png|jpeg|gif|webp)|application\/pdf|text\/plain);base64,/),
  }) }),
  z.object({ t: z.literal("session.next") }),
  z.object({ t: z.literal("session.end") }),
  z.object({ t: z.literal("peer.block") }),
  z.object({ t: z.literal("peer.report"), p: z.object({
    category: z.string().min(1).max(48),
    detail: z.string().max(500).optional(),
  }) }),
  z.object({ t: z.literal("rtc.signal"), p: z.object({ data: z.unknown() }) }),
  z.object({ t: z.literal("tip.request"), p: z.object({
    amountWei: z.string().regex(/^\d{1,25}$/, "wei integer expected"),
    display: z.string().min(1).max(24),
  }) }),
  z.object({ t: z.literal("tip.response"), p: z.object({ accepted: z.boolean() }) }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export type ServerMessage =
  | { t: "q.searching" }
  | { t: "session.matched"; p: { sid: string; peer: string; mode: string; initiator: boolean; peerAddress?: string | null } }
  | { t: "session.ended"; p: { sid: string; reason: string } }
  | { t: "chat.msg"; p: { sid: string; from: string; text: string; at: number } }
  | { t: "chat.file"; p: { sid: string; from: string; name: string; mime: string; size: number; dataUrl: string; at: number } }
  | { t: "chat.ack"; p: { sid: string; at: number } }
  | { t: "chat.typing"; p: { sid: string; on: boolean } }
  | { t: "rtc.signal"; p: { sid: string; data: unknown } }
  | { t: "tip.incoming"; p: { sid: string; from: string; amountWei: string; display: string } }
  | { t: "tip.answer"; p: { sid: string; accepted: boolean; address?: string | null } }
  | { t: "error"; p: { code: string; message: string } };

export function encode(msg: ServerMessage): string {
  return JSON.stringify({ v: 1, ...msg });
}

export function decodeClient(raw: string): ClientMessage | null {
  try {
    const parsed = clientMessageSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
