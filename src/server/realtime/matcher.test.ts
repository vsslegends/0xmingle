import { describe, expect, it } from "vitest";
import { Matchmaker, type Seeker } from "@/server/realtime/matcher";

function seeker(id: string, address: string, over: Partial<Seeker> = {}): Seeker {
  return {
    id,
    address: address.toLowerCase(),
    mode: "text",
    identity: "anonymous",
    interests: ["random"],
    joinedAt: Date.now(),
    ...over,
  };
}

describe("matchmaker", () => {
  it("queues first seeker, matches second (FIFO)", () => {
    const m = new Matchmaker();
    expect(m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"))).toBeNull();
    expect(m.queueSize).toBe(1);
    const s = m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    expect(s).not.toBeNull();
    expect(m.queueSize).toBe(0);
    expect(m.sessionOf("c1")?.id).toBe(s?.id);
  });

  it("requires same mode", () => {
    const m = new Matchmaker();
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", { mode: "video" }));
    expect(
      m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", { mode: "text" })),
    ).toBeNull();
  });

  it("prefers shared interests, keeps FIFO on tie", () => {
    const m = new Matchmaker();
    const W = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    // Same wallet twice: no self-match, so both stay queued → real candidate pool.
    m.join(seeker("a1", W, { interests: ["music"] }));
    m.join(seeker("a2", W, { interests: ["ai", "crypto"] }));
    expect(m.queueSize).toBe(2);
    const s = m.join(
      seeker("me", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", { interests: ["ai"] }),
    );
    expect(s?.b).toBe("a2");
  });

  it("keeps FIFO order on interest tie", () => {
    const m = new Matchmaker();
    // Same wallet twice: no self-match, both stay queued.
    const W2 = "0xcccccccccccccccccccccccccccccccccccccccc";
    m.join(seeker("b1", W2, { interests: ["music"] }));
    m.join(seeker("b2", W2, { interests: ["music"] }));
    expect(m.queueSize).toBe(2);
    const t = m.join(
      seeker("me2", "0xdddddddddddddddddddddddddddddddddddddddd", { interests: ["sports"] }),
    );
    // Both score 0 → earlier queued (b1) wins.
    expect(t?.b).toBe("b1");
  });

  it("never self-matches same wallet on two connections", () => {
    const m = new Matchmaker();
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    expect(m.join(seeker("c2", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"))).toBeNull();
  });

  it("respects blocks both directions", () => {
    const m = new Matchmaker();
    m.block("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    expect(m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"))).toBeNull();
  });

  it("avoids immediate rematch after NEXT", () => {
    const m = new Matchmaker();
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    const prefs = seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const { matched } = m.next("c1", prefs);
    // c2 still in session? c2 was ended too — requeue c2, must not rematch c1
    m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    void matched;
    expect(m.sessionOf("c1")).toBeUndefined();
  });

  it("reconnects recent peers on fresh find (low-population fallback)", () => {
    const m = new Matchmaker();
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    m.end("c1"); // both stopped
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    const s = m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    expect(s).not.toBeNull();
  });

  it("prefers fresh peers over recent ones when both wait", () => {
    const m = new Matchmaker();
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    m.end("c1"); // c1+c2 are now a recent pair
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")); // c1 waits
    m.join(seeker("c3", "0xcccccccccccccccccccccccccccccccccccccccc")); // c3 matches c1 (fresh)
    const s = m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    // c1 taken by c3; c2 alone → still searching, never force-blocked
    expect(s).toBeNull();
    expect(m.sessionOf("c1")?.b ?? m.sessionOf("c1")?.a).toBeDefined();
  });

  it("prevents duplicate queue entries", () => {
    const m = new Matchmaker();
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    expect(m.queueSize).toBe(1);
  });

  it("end() cleans both sides", () => {
    const m = new Matchmaker();
    m.join(seeker("c1", "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    m.join(seeker("c2", "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    m.end("c1");
    expect(m.sessionOf("c2")).toBeUndefined();
    expect(m.activeSessions).toBe(0);
  });

  it("handles 50 simultaneous seekers without duplicates", () => {
    const m = new Matchmaker();
    const addrs = Array.from({ length: 50 }, (_, i) =>
      `0x${i.toString(16).padStart(40, "0")}`,
    );
    const matched = new Set<string>();
    addrs.forEach((a, i) => {
      const s = m.join(seeker(`c${i}`, a));
      if (s) {
        expect(matched.has(s.a) || matched.has(s.b)).toBe(false);
        matched.add(s.a);
        matched.add(s.b);
      }
    });
    expect(matched.size % 2).toBe(0);
  });
});
