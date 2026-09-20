import { randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { verifyMessage, type Hex } from "viem";
import { z } from "zod";
import { brand } from "@/config/brand";
import { getActiveChainId } from "@/lib/chain";

export const SESSION_COOKIE = "oxmingle_session";
const SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 days
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const addressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Invalid EVM address");

export const nonceRequestSchema = z.object({ address: addressSchema });
export const verifyRequestSchema = z.object({
  address: addressSchema,
  message: z.string().min(20).max(2000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, "Invalid signature"),
});

type Challenge = { nonce: string; expiresAt: number; message: string };

/** In-memory challenge store (dev). Production: Redis with TTL. Same API. */
const challenges = new Map<string, Challenge>();

function getSecret(): Uint8Array {
  const s =
    process.env.SESSION_SECRET ??
    (process.env.NODE_ENV === "test" ? "test-secret-32-chars-minimum-here!!" : "");
  if (s.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters. See .env.example.",
    );
  }
  return new TextEncoder().encode(s);
}

export function buildAuthMessage(input: {
  address: string;
  nonce: string;
  chainId: number;
  issuedAt: string;
  expiresAt: string;
}): string {
  return [
    `${brand.name} — verify wallet ownership`,
    "",
    `Address: ${input.address}`,
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `Issued: ${input.issuedAt}`,
    `Expires: ${input.expiresAt}`,
    "",
    "This signature only verifies that you control this wallet. It does not authorize a transaction.",
  ].join("\n");
}

export function issueChallenge(address: string): {
  message: string;
  nonce: string;
  expiresAt: string;
} {
  const normalized = address.toLowerCase();
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
  const message = buildAuthMessage({
    address: normalized,
    nonce,
    chainId: getActiveChainId(),
    issuedAt,
    expiresAt,
  });
  challenges.set(normalized, {
    nonce,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    message,
  });
  return { message, nonce, expiresAt };
}

export async function verifyChallenge(input: {
  address: string;
  message: string;
  signature: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = input.address.toLowerCase();
  const stored = challenges.get(normalized);
  if (!stored) return { ok: false, error: "No active challenge. Request a new signature message." };
  challenges.delete(normalized); // single-use: delete before verify to block replays
  if (stored.expiresAt < Date.now()) {
    return { ok: false, error: "Challenge expired. Request a new signature message." };
  }
  if (stored.message !== input.message) {
    return { ok: false, error: "Message mismatch. Request a new signature message." };
  }
  let valid = false;
  try {
    valid = await verifyMessage({
      address: input.address as Hex,
      message: input.message,
      signature: input.signature as Hex,
    });
  } catch {
    return { ok: false, error: "Signature verification failed." };
  }
  if (!valid) return { ok: false, error: "Signature verification failed." };
  return { ok: true };
}

export async function createSessionToken(address: string): Promise<string> {
  return new SignJWT({ address: address.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_S}s`)
    .sign(getSecret());
}

export async function readSessionToken(
  token: string | undefined,
): Promise<{ address: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const address = (payload as { address?: unknown }).address;
    if (typeof address !== "string" || !/^0x[0-9a-f]{40}$/.test(address)) return null;
    return { address };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_S}${secure}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

const WS_TICKET_TTL_S = 120; // 2 minutes: covers handshake + socket reconnects

/**
 * Short-lived signed WS ticket. Lets the realtime gateway verify identity
 * when it runs on a different host than the web app (browsers don't send
 * the HttpOnly session cookie cross-origin). Self-contained JWT — no shared
 * state, so it works across serverless instances and separate hosts.
 * Requires the same SESSION_SECRET on web + gateway.
 */
export async function createWsTicket(address: string): Promise<string> {
  return new SignJWT({ address: address.toLowerCase(), purpose: "ws-ticket" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${WS_TICKET_TTL_S}s`)
    .sign(getSecret());
}

export async function verifyWsTicket(
  ticket: string | undefined | null,
): Promise<{ address: string } | null> {
  if (!ticket || ticket.length > 2000) return null;
  try {
    const { payload } = await jwtVerify(ticket, getSecret());
    const { address, purpose } = payload as { address?: unknown; purpose?: unknown };
    if (purpose !== "ws-ticket") return null;
    if (typeof address !== "string" || !/^0x[0-9a-f]{40}$/.test(address)) return null;
    return { address };
  } catch {
    return null;
  }
}

/** Test hook — not exported to clients. */
export const __testOnly = { challenges };
