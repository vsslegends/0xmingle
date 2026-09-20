import { defineChain } from "viem";

export const ROBINHOOD_MAINNET_ID = 4663;
export const ROBINHOOD_TESTNET_ID = 46630;

const mainnetRpc =
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ??
  "https://rpc.mainnet.chain.robinhood.com";
const testnetRpc =
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ??
  "https://rpc.testnet.chain.robinhood.com";

export const robinhoodMainnet = defineChain({
  id: ROBINHOOD_MAINNET_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [mainnetRpc] },
    public: { http: [mainnetRpc] },
  },
});

export const robinhoodTestnet = defineChain({
  id: ROBINHOOD_TESTNET_ID,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [testnetRpc] },
    public: { http: [testnetRpc] },
  },
  testnet: true,
});

/** Active chain id from env — testnet default for dev. Never hard-code RPC infra. */
export function getActiveChainId(): number {
  const raw = process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (parsed === ROBINHOOD_MAINNET_ID) return ROBINHOOD_MAINNET_ID;
  return ROBINHOOD_TESTNET_ID;
}

export function getActiveChain() {
  return getActiveChainId() === ROBINHOOD_MAINNET_ID
    ? robinhoodMainnet
    : robinhoodTestnet;
}

/** Both chains known to the wallet UI; active first. */
export function getKnownChains() {
  return getActiveChainId() === ROBINHOOD_MAINNET_ID
    ? ([robinhoodMainnet, robinhoodTestnet] as const)
    : ([robinhoodTestnet, robinhoodMainnet] as const);
}

export function getWalletConnectProjectId(): string {
  return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
}

export function isMainnet(): boolean {
  return getActiveChainId() === ROBINHOOD_MAINNET_ID;
}
