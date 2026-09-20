/**
 * Blockchain service layer. Components import these — never raw RPC logic.
 * Payments/premium/paid-rooms expose clean abstractions marked where
 * integration is future work. No RPC happens before random chat entry.
 */
export const walletService = {
  kind: "wallet",
  note: "Signature login only (no transaction). See useSession + /api/auth/*.",
} as const;

export const profileService = {
  kind: "profile",
  async get(address: string) {
    const r = await fetch(`/api/profile/${address}`, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as unknown;
  },
} as const;

export const paymentService = {
  kind: "payment",
  status: "abstraction-only",
  note: "Premium/paid-room checkout plugs in here. No fake charges.",
} as const;

export const tipService = {
  kind: "tip",
  async quote(amountWei: string) {
    const r = await fetch("/api/tips/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountWei }),
    });
    if (!r.ok) throw new Error("Quote failed");
    return (await r.json()) as { amountWei: string; feeWei: string; recipientWei: string; feeBps: number; treasury: string | null };
  },
} as const;

export const accessControlService = {
  kind: "access",
  async rooms() {
    const r = await fetch("/api/rooms", { cache: "no-store" });
    if (!r.ok) return [];
    const j = (await r.json()) as { rooms: unknown[] };
    return j.rooms;
  },
} as const;

export const tokenGateService = {
  kind: "token-gate",
  status: "abstraction-only",
  note: "Balance checks run server-side with cache. See checkAccess.",
} as const;
