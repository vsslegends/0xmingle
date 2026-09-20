/** Brand config — change these values to rebrand. No other file should hard-code the product name. */
export const brand = {
  name: "STRANGER",
  tagline: "Talk to someone you were never supposed to meet.",
  subhead:
    "Random conversations. Wallet-native identity. No follower counts required.",
  ctaPrimary: "Connect Wallet",
  ctaSecondary: "Explore",
  footerNote: "Wallet-native random chat. Be kind. Be safe.",
  links: {
    chat: "/chat",
    safety: "/safety",
    terms: "/terms",
    privacy: "/privacy",
    guidelines: "/community-guidelines",
  },
} as const;

export type Brand = typeof brand;
