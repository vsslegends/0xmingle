import { describe, expect, it } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  __testOnly,
  buildAuthMessage,
  createWsTicket,
  issueChallenge,
  verifyChallenge,
  verifyWsTicket,
  createSessionToken,
  readSessionToken,
} from "@/server/auth";

const ADDR_A = privateKeyToAccount(generatePrivateKey());
const ADDR_B = privateKeyToAccount(generatePrivateKey());

describe("auth challenges", () => {
  it("builds a non-transaction message", () => {
    const m = buildAuthMessage({
      address: ADDR_A.address,
      nonce: "abc",
      chainId: 46630,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
    });
    expect(m).toContain("does not authorize a transaction");
    expect(m).toContain("Nonce: abc");
  });

  it("verifies a real signature round-trip", async () => {
    const { message } = issueChallenge(ADDR_A.address);
    const signature = await ADDR_A.signMessage({ message });
    const res = await verifyChallenge({
      address: ADDR_A.address,
      message,
      signature,
    });
    expect(res).toEqual({ ok: true });
  });

  it("rejects wrong-address signatures", async () => {
    const { message } = issueChallenge(ADDR_A.address);
    const signature = await ADDR_B.signMessage({ message });
    const res = await verifyChallenge({
      address: ADDR_A.address,
      message,
      signature,
    });
    expect(res.ok).toBe(false);
  });

  it("single-use: replay fails", async () => {
    const { message } = issueChallenge(ADDR_A.address);
    const signature = await ADDR_A.signMessage({ message });
    const first = await verifyChallenge({ address: ADDR_A.address, message, signature });
    expect(first.ok).toBe(true);
    const second = await verifyChallenge({ address: ADDR_A.address, message, signature });
    expect(second.ok).toBe(false);
  });

  it("rejects expired challenges", async () => {
    const { message } = issueChallenge(ADDR_A.address);
    const stored = __testOnly.challenges.get(ADDR_A.address.toLowerCase());
    expect(stored).toBeDefined();
    if (stored) stored.expiresAt = Date.now() - 1;
    const signature = await ADDR_A.signMessage({ message });
    const res = await verifyChallenge({ address: ADDR_A.address, message, signature });
    expect(res.ok).toBe(false);
  });

  it("issues and reads session tokens", async () => {
    process.env.SESSION_SECRET = "test-secret-32-chars-minimum-here!!";
    const token = await createSessionToken(ADDR_A.address);
    const session = await readSessionToken(token);
    expect(session?.address).toBe(ADDR_A.address.toLowerCase());
    expect(await readSessionToken("garbage")).toBeNull();
  });

  it("ws tickets round-trip", async () => {
    process.env.SESSION_SECRET = "test-secret-32-chars-minimum-here!!";
    const ticket = await createWsTicket(ADDR_A.address);
    const verified = await verifyWsTicket(ticket);
    expect(verified?.address).toBe(ADDR_A.address.toLowerCase());
  });

  it("ws tickets reject tampered, garbage, and wrong-purpose tokens", async () => {
    process.env.SESSION_SECRET = "test-secret-32-chars-minimum-here!!";
    const ticket = await createWsTicket(ADDR_A.address);
    expect(await verifyWsTicket(ticket.slice(0, -2) + "xx")).toBeNull();
    expect(await verifyWsTicket("garbage")).toBeNull();
    expect(await verifyWsTicket(null)).toBeNull();
    // A session token is valid JWT but must not pass as a WS ticket.
    const sessionToken = await createSessionToken(ADDR_A.address);
    expect(await verifyWsTicket(sessionToken)).toBeNull();
  });
});
