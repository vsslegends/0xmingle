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

  it("accepts chat.file with allowlisted mime, rejects the rest", () => {
    const good = {
      t: "chat.file",
      p: { name: "pic.png", mime: "image/png", size: 100, dataUrl: "data:image/png;base64,iVBORw0=" },
    };
    expect(decodeClient(JSON.stringify(good))).not.toBeNull();
    const badMime = { ...good, p: { ...good.p, mime: "image/svg+xml", dataUrl: "data:image/svg+xml;base64,xxx" } };
    expect(decodeClient(JSON.stringify(badMime))).toBeNull();
    const huge = { ...good, p: { ...good.p, dataUrl: `data:image/png;base64,${"A".repeat(2_000_001)}` } };
    expect(decodeClient(JSON.stringify(huge))).toBeNull();
  });
});
