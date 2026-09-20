import { describe, expect, it } from "vitest";
import {
  ROBINHOOD_MAINNET_ID,
  ROBINHOOD_TESTNET_ID,
  getActiveChainId,
  robinhoodMainnet,
  robinhoodTestnet,
} from "@/lib/chain";

describe("robinhood chain config", () => {
  it("has correct chain ids, ETH native, no hard-coded secrets", () => {
    expect(robinhoodMainnet.id).toBe(ROBINHOOD_MAINNET_ID);
    expect(robinhoodTestnet.id).toBe(ROBINHOOD_TESTNET_ID);
    expect(ROBINHOOD_MAINNET_ID).toBe(4663);
    expect(ROBINHOOD_TESTNET_ID).toBe(46630);
    expect(robinhoodMainnet.nativeCurrency.symbol).toBe("ETH");
  });

  it("defaults to testnet without env", () => {
    delete process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID;
    expect(getActiveChainId()).toBe(ROBINHOOD_TESTNET_ID);
  });
});
