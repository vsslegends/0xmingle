import { describe, expect, it } from "vitest";
import { buildTipTx, parseTipAmount, tipContractAddress, usdToWei } from "@/lib/tips";

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

  it("converts USD to wei with exact math and a $0.10 floor", () => {
    // $1 @ $3000/ETH = 1/3000 ETH, floored to the wei.
    expect(usdToWei("1", 3000)).toBe(333333333333333n);
    expect(usdToWei("0.10", 3000)).toBe(33333333333333n);
    expect(usdToWei("5.50", 2500)).toBe((550n * 1_000_000_000_000_000_000n) / 250000n);
    expect(usdToWei("0.09", 3000)).toBeNull();
    expect(usdToWei("0", 3000)).toBeNull();
    expect(usdToWei("abc", 3000)).toBeNull();
    expect(usdToWei("1.234", 3000)).toBeNull();
    expect(usdToWei("1", 0)).toBeNull();
    expect(usdToWei("1", NaN)).toBeNull();
  });

  it("reads the splitter address only when well-formed", () => {
    const prev = process.env.NEXT_PUBLIC_TIP_CONTRACT;
    process.env.NEXT_PUBLIC_TIP_CONTRACT = "0xC2F0FF0f2928fc53E0e4e7B4Cf166BdC563C243b";
    expect(tipContractAddress()).toBe("0xc2f0ff0f2928fc53e0e4e7b4cf166bdc563c243b");
    process.env.NEXT_PUBLIC_TIP_CONTRACT = "0x123";
    expect(tipContractAddress()).toBeNull();
    delete process.env.NEXT_PUBLIC_TIP_CONTRACT;
    expect(tipContractAddress()).toBeNull();
    if (prev !== undefined) process.env.NEXT_PUBLIC_TIP_CONTRACT = prev;
  });
});
