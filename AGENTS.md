# AGENTS.md — STRANGER (brand-swappable random Web3 chat)

> Product: random 1:1 stranger chat (text/audio/video) where EVM wallet = identity.
> Brand "STRANGER" is a placeholder. All user-visible brand strings live in `src/config/brand.ts`.

## Architecture (do not put realtime media on-chain)

- Frontend: Next.js 14 App Router + TS strict + Tailwind + shadcn-style ui primitives (local `src/components/ui`) + framer-motion + wagmi/viem + RainbowKit.
- Auth: SIWE-style challenge flow. Server issues nonce+expiry, client signs, server verifies with viem, issues HttpOnly session cookie (iron-session style JWT). Never trust raw address.
- Realtime (off-chain only): WebSocket signaling server (`src/server/ws` abstraction → default in-memory + Redis pub/sub adapter interface). WebRTC P2P for audio/video with STUN + configurable TURN. Text chat over WS with ephemeral relay; no permanent history.
- Matchmaking: server-authoritative FIFO queue per mode (text/audio/video) + interest overlap, block/report exclusion, recent-peer avoidance, Redis lock interface (`src/server/matchmaking`) with in-memory fallback for dev.
- Persistence: Supabase/Postgres via migrations in `supabase/migrations`. Tables: users, profiles, wallet_sessions, chat_sessions, reports, blocks, moderation_events, user_bans, preferences, interest_tags, user_interests, tips, onchain_profiles. RLS on.
- Chain: Robinhood Chain abstraction `src/lib/chain.ts`. Mainnet 4663 / Testnet 46630, env-switchable. viem only; tipping via plain ETH transfer + optional `StrangerProtocol.sol` (foundry/hardhat later, keep minimal).
- Admin: `/admin/*` guarded by `ADMIN_WALLETS` env (server check). No public admin APIs.

## Repo conventions

- `src/app/*` routes only; logic in `src/lib`, `src/server`, `src/hooks`, `src/components`.
- Strict TS, no `any` without justification. Zod for all API/WS payload validation.
- Small files; no duplicated UI — use `src/components/ui/*`.
- WS message envelope: `{ t: string, sid?: string, p: unknown, v: 1 }`.
- Never commit `.env`. Copy `.env.example`.
- Client must never see: service-role key, TURN credential, session secret, Redis URL.
- Never log chat contents or keys.

## Commands

- npm install / npm run dev (web :3000, ws default :3001 — see .env.example)
- npm run lint / npm run typecheck / npm test / npm run build
- Supabase: `supabase db push` (migrations in supabase/migrations)
- Contract tests: `cd contracts && forge test` (when added)

## Env (see .env.example)

NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
NEXT_PUBLIC_ROBINHOOD_CHAIN_ID, NEXT_PUBLIC_ROBINHOOD_RPC_URL, ROBINHOOD_RPC_URL, ROBINHOOD_EXPLORER_URL,
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, SESSION_SECRET, REDIS_URL, TURN_SERVER_URL/TURN_USERNAME/TURN_CREDENTIAL,
NEXT_PUBLIC_WS_URL, ADMIN_WALLETS

## Engineering decisions (locked)

1. Chat/video/audio/signaling 100% off-chain. Chain = identity, auth, tips, gates only.
2. Server-authoritative matchmaking + session ownership checks on every WS/API action.
3. Ephemeral messages: relay + optional 24h encrypted buffer, never permanent log.
4. Risk score server-side only (NORMAL/SUSPICIOUS/RATE_LIMITED/TEMP_BLOCKED/BANNED).
5. Minimal MVP contract; no mainnet deploy without audit.
6. Mobile-first dark premium UI; NEXT always reachable; reduced-motion respected.
