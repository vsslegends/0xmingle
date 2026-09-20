import type { UserProfile, ProfileInput } from "@/lib/profiles";

/**
 * Persistent wallet identity store.
 * In-memory for dev; same interface backs Supabase/Postgres in prod.
 * Keyed by lowercase address. Never stores chat contents.
 */
export interface ProfileStore {
  get(address: string): Promise<UserProfile | null>;
  upsert(address: string, input: ProfileInput): Promise<UserProfile>;
  recordSession(a: string, b: string): Promise<void>;
}

const db = new Map<string, UserProfile>();
const met = new Map<string, Set<string>>();

function blank(address: string): UserProfile {
  const now = Date.now();
  return {
    address: address.toLowerCase(),
    username: null,
    avatar: null,
    bio: null,
    interests: [],
    language: null,
    region: null,
    links: [],
    privacy: "anonymous",
    createdAt: now,
    conversations: 0,
    peopleMet: 0,
  };
}

export function createMemoryProfileStore(): ProfileStore {
  return {
    async get(address: string) {
      return db.get(address.toLowerCase()) ?? null;
    },
    async upsert(address: string, input: ProfileInput) {
      const key = address.toLowerCase();
      const prev = db.get(key) ?? blank(key);
      const next: UserProfile = {
        ...prev,
        username: input.username ?? null,
        avatar: input.avatar ?? null,
        bio: input.bio ?? null,
        interests: input.interests ?? [],
        language: input.language ?? null,
        region: input.region ?? null,
        links: input.links ?? [],
        privacy: input.privacy,
      };
      db.set(key, next);
      return next;
    },
    async recordSession(a: string, b: string) {
      for (const [self, peer] of [[a.toLowerCase(), b.toLowerCase()], [b.toLowerCase(), a.toLowerCase()]] as const) {
        const p = db.get(self) ?? blank(self);
        p.conversations += 1;
        let set = met.get(self);
        if (!set) { set = new Set(); met.set(self, set); }
        if (!set.has(peer)) { set.add(peer); p.peopleMet = set.size; }
        db.set(self, p);
      }
    },
  };
}

/** Singleton for API routes (dev). Prod injects Supabase adapter. */
export const profileStore = createMemoryProfileStore();
