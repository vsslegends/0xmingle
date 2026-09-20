import { describe, expect, it } from "vitest";
import { buildTipTx, parseTipAmount } from "@/lib/tips";

const ADDR = "0x1234567890123456789012345678901234567890";

describe("tips", () => {
  it("parses any positive ETH amount", () => {
    expect(parseTipAmount("0.001")).toBe(1_000_000_000_000_000n);
    expect(parseTipAmount("1.5")).toBe(1_500_000_000_000_000_000n);
    expect(parseTipAmount("0")).toBeNull();
    expect(parseTipAmount("-1")).toBeNull();
    expect(parseTipAmount("abc")).toBeNull();
    expect(parseTipAmount("")).toBeNull();
  });

  it("builds transfers only for valid recipients and amounts", () => {
    expect(buildTipTx(ADDR, 100n)).toEqual({ to: ADDR, value: 100n });
    expect(buildTipTx(ADDR, 0n)).toBeNull();
    expect(buildTipTx("not-an-address", 100n)).toBeNull();
    expect(buildTipTx("0x123", 100n)).toBeNull();
  });
});
