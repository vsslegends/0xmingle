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

  it("accepts tip.request/response, rejects malformed amounts", () => {
    expect(
      decodeClient(JSON.stringify({ t: "tip.request", p: { amountWei: "1000000", display: "$1.00" } })),
    ).not.toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "tip.request", p: { amountWei: "-5", display: "$1" } })),
    ).toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "tip.request", p: { amountWei: "1.5", display: "$1" } })),
    ).toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "tip.request", p: { amountWei: "100", display: "x".repeat(25) } })),
    ).toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "tip.response", p: { accepted: true } })),
    ).not.toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "tip.response", p: { accepted: "yes" } })),
    ).toBeNull();
  });

  it("encodes tip.incoming/answer envelopes with version", () => {
    expect(JSON.parse(encode({ t: "tip.incoming", p: { sid: "s1", from: "Stranger", amountWei: "10", display: "$1" } })))
      .toMatchObject({ v: 1, t: "tip.incoming" });
    expect(JSON.parse(encode({ t: "tip.answer", p: { sid: "s1", accepted: true, address: "0xabc" } })))
      .toMatchObject({ v: 1, t: "tip.answer" });
  });

  it("accepts chat.react, carries optional message ids", () => {
    expect(
      decodeClient(JSON.stringify({ t: "chat.react", p: { toId: "m1", emoji: "❤️", on: true } })),
    ).not.toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.react", p: { toId: "", emoji: "❤️", on: true } })),
    ).toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.react", p: { toId: "m1", emoji: "❤️", on: "yes" } })),
    ).toBeNull();
    // ids optional for backward compat, passed through when present
    expect(
      decodeClient(JSON.stringify({ t: "chat.send", p: { text: "hi" } })),
    ).toMatchObject({ t: "chat.send" });
    expect(
      decodeClient(JSON.stringify({ t: "chat.send", p: { text: "hi", id: "m9" } })),
    ).toMatchObject({ t: "chat.send", p: { text: "hi", id: "m9" } });
    expect(JSON.parse(encode({ t: "chat.reacted", p: { sid: "s1", from: "A", toId: "m9", emoji: "🔥", on: false } })))
      .toMatchObject({ v: 1, t: "chat.reacted" });
  });

  it("accepts reply/edit/delete/read, rejects overlong or empty", () => {
    expect(
      decodeClient(JSON.stringify({ t: "chat.send", p: { text: "hi", id: "m1", replyToId: "m0" } })),
    ).toMatchObject({ t: "chat.send", p: { text: "hi", replyToId: "m0" } });
    expect(
      decodeClient(JSON.stringify({ t: "chat.send", p: { text: "hi", replyToId: "" } })),
    ).toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.edit", p: { id: "m1", text: "new" } })),
    ).not.toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.edit", p: { id: "m1", text: "" } })),
    ).toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.edit", p: { id: "m1", text: "x".repeat(501) } })),
    ).toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.delete", p: { id: "m1" } })),
    ).not.toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.delete", p: { id: "" } })),
    ).toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.read", p: { lastId: "m1" } })),
    ).not.toBeNull();
    expect(
      decodeClient(JSON.stringify({ t: "chat.read", p: {} })),
    ).not.toBeNull();
    expect(JSON.parse(encode({ t: "chat.edited", p: { sid: "s1", from: "A", id: "m1", text: "new", at: 1 } })))
      .toMatchObject({ v: 1, t: "chat.edited" });
    expect(JSON.parse(encode({ t: "chat.deleted", p: { sid: "s1", from: "A", id: "m1", at: 1 } })))
      .toMatchObject({ v: 1, t: "chat.deleted" });
    expect(JSON.parse(encode({ t: "chat.read", p: { sid: "s1", from: "A", lastId: "m1", at: 1 } })))
      .toMatchObject({ v: 1, t: "chat.read" });
    // delivery acks echo the sender's message id so the UI can tick Sent → Delivered
    expect(JSON.parse(encode({ t: "chat.ack", p: { sid: "s1", at: 1, id: "m1" } })))
      .toMatchObject({ v: 1, t: "chat.ack", p: { id: "m1" } });
    // capability handshake on connect
    expect(JSON.parse(encode({ t: "hello", p: { caps: ["chat.edit"] } })))
      .toMatchObject({ v: 1, t: "hello" });
  });
});
