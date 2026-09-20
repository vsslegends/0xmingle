export const INTERESTS = [
  "technology",
  "gaming",
  "crypto",
  "nfts",
  "ai",
  "travel",
  "music",
  "movies",
  "sports",
  "coding",
  "random",
] as const;

export type Interest = (typeof INTERESTS)[number];

export const CHAT_MODES = ["text", "audio", "video"] as const;
export type ChatMode = (typeof CHAT_MODES)[number];

export const IDENTITY_MODES = ["anonymous", "wallet"] as const;
export type IdentityMode = (typeof IDENTITY_MODES)[number];
