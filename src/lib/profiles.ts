import { z } from "zod";
import type { IdentityMode } from "@/lib/interests";

/** Public trust indicator. Never exposes moderation internals. */
export type TrustTier = "new" | "established" | "verified";

export interface UserProfile {
  address: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  interests: string[];
  language: string | null;
  region: string | null;
  links: string[];
  privacy: IdentityMode;
  createdAt: number;
  conversations: number;
  peopleMet: number;
}

export const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscore only")
  .optional()
  .nullable();

export const profileInputSchema = z.object({
  username: usernameSchema,
  avatar: z.string().url().max(500).optional().nullable(),
  bio: z.string().max(160).optional().nullable(),
  interests: z.array(z.string().min(1).max(24)).max(11).default([]),
  language: z.string().max(24).optional().nullable(),
  region: z.string().max(48).optional().nullable(),
  links: z.array(z.string().url().max(200)).max(4).default([]),
  privacy: z.enum(["anonymous", "wallet", "profile"]).default("anonymous"),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

/** What strangers may see, gated by privacy mode. No history, no private data. */
export function publicView(p: UserProfile): {
  display: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  interests: string[];
} {
  if (p.privacy === "anonymous") {
    return { display: "anonymous", username: null, avatar: null, bio: null, interests: [] };
  }
  if (p.privacy === "wallet") {
    return { display: "wallet", username: null, avatar: null, bio: null, interests: [] };
  }
  return {
    display: "profile",
    username: p.username,
    avatar: p.avatar,
    bio: p.bio,
    interests: p.interests,
  };
}
