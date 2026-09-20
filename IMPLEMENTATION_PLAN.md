# Implementation Plan — 0xMingle MVP

Phase 0 ✅: inspected /Users/sureshreddy — no parent git repo, no existing app. Scaffolded fresh `stranger/` (Next 14.2.5, TS, Tailwind, App Router, npm, node v24.15). No wallet/supabase/redis pre-existing.

Phase 1 — UI shell + design system + landing (this pass):
- brand.ts, theme tokens, ui primitives (button/card/input/badge/modal/toast/skeleton), layout, landing page, /chat skeleton (lazy), /safety /terms /privacy /community-guidelines, stubs for /profile /settings /admin.
- reportedly: typecheck+lint+build green.

Phase 2 — Wallet + chain:
- chain.ts (4663/46630 env switch), wagmi+RainbowKit providers, ConnectModal, /api/auth/nonce + /api/auth/verify (viem SIWE verify), HttpOnly session, NetworkSwitcher, useSession.

Phase 3 — Matchmaking (server-authoritative):
- `src/server/matchmaking/*` (queue, lock, matcher: mode→interest→FIFO→block/recent avoidance) + WS gateway + `MatchmakingPanel`, SearchingAnimation, MatchFound, useMatchmaking. Redis adapter interface + in-memory fallback.

Phase 4 — Text chat:
- WS chat relay, typing indicator, rate limit, reconnect, ChatPanel/ChatInput/TypingIndicator. Ephemeral only.

Phase 5 — WebRTC A/V:
- useWebRTC (getUserMedia, device select, mute/cam, renegotiate, TURN), VideoRoom + VideoControls + mobile bottom-sheet. Lazy-load.

Phase 6 — Safety: report/block modals, /api/report /api/block, moderation_events, risk scorer, age gate, rate limits.
Phase 7 — Chain profile/tips: profiles table, StrangerProtocol.sol minimal (registerProfile/tip/withdraw + events), TipModal, viem write flow.
Phase 8 — Admin: guarded /admin/* + metrics APIs.
Phase 9 — Hardening: XSS/CSRF/replay/nonce/RLS audit, perf (lazy video, bundle), mobile/a11y pass.
Phase 10 — Deploy: .env.example, supabase migrations, README, build green, tests (vitest: auth, matcher, block/report, e2e scenario).

Test gate after each phase: typecheck + lint + targeted tests + dev smoke.
