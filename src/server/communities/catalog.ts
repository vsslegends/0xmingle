/**
 * Communities / rooms catalog + access-control abstraction.
 * Seed data is server-side; counts come from this backend source
 * (no fake client metrics). Token/NFT gates are stub-checked with
 * caching hooks so real balance checks can plug in later.
 */

export type RoomAccess =
  | { kind: "public" }
  | { kind: "wallet" }
  | { kind: "token"; token: string; minBalance: string }
  | { kind: "nft"; collection: string }
  | { kind: "paid"; priceWei: string; durationMin: number };

export interface Room {
  id: string;
  community: string;
  name: string;
  description: string;
  access: RoomAccess;
  members: number;
  online: number;
  creator: string | null;
}

const SEED: Room[] = [
  { id: "ai-builders", community: "AI Builders", name: "AI Builders", description: "Ship AI x crypto experiments.", access: { kind: "public" }, members: 0, online: 0, creator: null },
  { id: "nft-lounge", community: "NFT Collectors", name: "NFT Holders Lounge", description: "Collectors only. Gate enforced when collection is configured.", access: { kind: "nft", collection: "TBD" }, members: 0, online: 0, creator: null },
  { id: "gaming-lounge", community: "Gaming", name: "Gaming Lounge", description: "Find squadmates by interest.", access: { kind: "public" }, members: 0, online: 0, creator: null },
  { id: "crypto-traders", community: "Crypto Traders", name: "Crypto Traders", description: "Markets talk. Token-gate ready.", access: { kind: "token", token: "TBD", minBalance: "0" }, members: 0, online: 0, creator: null },
  { id: "devs", community: "Developers", name: "Developers", description: "Code, review, ship.", access: { kind: "wallet" }, members: 0, online: 0, creator: null },
];

export function listRooms(): Room[] {
  return SEED;
}

export interface AccessCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Extensible gate. Public/wallet pass now; token/nft/paid return
 * a clear "not configured" denial until a real checker is injected.
 * Results should be cached server-side (balance lookups are expensive).
 */
export async function checkAccess(
  roomId: string,
  viewer: { address: string | null },
): Promise<AccessCheck> {
  const room = SEED.find((r) => r.id === roomId);
  if (!room) return { ok: false, reason: "Room not found." };
  const a = room.access;
  if (a.kind === "public") return { ok: true };
  if (a.kind === "wallet") {
    return viewer.address ? { ok: true } : { ok: false, reason: "Connect a wallet to enter." };
  }
  // Future: verify on-chain balance / payment with cached indexer.
  return { ok: false, reason: "Gated room — enforcement pending configuration." };
}
