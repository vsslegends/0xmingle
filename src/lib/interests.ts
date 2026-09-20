export const INTERESTS = [
  "random",
  "ai",
  "technology",
  "coding",
  "gaming",
  "crypto",
  "nfts",
  "defi",
  "web3",
  "developers",
  "creators",
  "collectors",
  "travel",
  "music",
  "movies",
  "sports",
  "language",
] as const;

export type Interest = (typeof INTERESTS)[number];

/** Web3-flavored subset for "Find another Web3 user" matching. No tx required. */
export const WEB3_INTERESTS: readonly Interest[] = [
  "crypto",
  "nfts",
  "defi",
  "web3",
  "developers",
  "creators",
  "collectors",
] as const;

export const CHAT_MODES = ["text", "audio", "video"] as const;
export type ChatMode = (typeof CHAT_MODES)[number];

/** Privacy modes: anonymous (Stranger #) → wallet (0x…) → profile (@user). */
export const IDENTITY_MODES = ["anonymous", "wallet", "profile"] as const;
export type IdentityMode = (typeof IDENTITY_MODES)[number];
