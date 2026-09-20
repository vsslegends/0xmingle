import { describe, expect, it } from "vitest";
import { decodeClient, encode } from "@/server/realtime/protocol";

describe("protocol", () => {
  it("accepts valid chat.send, rejects oversize/empty", () => {
    expect(decodeClient(JSON.stringify({ t: "chat.send", p: { text: "hi" } }))).not.toBeNull();
    expect(decodeClient(JSON.stringify({ t: "chat.send", p: { text: "" } }))).toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.send", p: { text: "x".repeat(501) } })),
    ).toBeNull();
  });

  it("rejects unknown types and garbage", () => {
    expect(decodeClient(JSON.stringify({ t: "hack", p: {} }))).toBeNull();
    expect(decodeClient("not json")).toBeNull();
  });

  it("encodes server envelope with version", () => {
    const raw = encode({ t: "q.searching" });
    expect(JSON.parse(raw)).toMatchObject({ v: 1, t: "q.searching" });
  });
});
