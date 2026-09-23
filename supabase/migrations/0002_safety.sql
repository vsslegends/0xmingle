-- Safety: durable moderation trail for the escalation wired in
-- src/server/moderation.ts + src/server/ws-server.ts + /api/report + /api/block.
-- Chat/media stay off-chain: these tables store addresses, categories, and
-- decisions only — never message contents. All idempotent.

-- ---------- reports (one row per API/gateway report) ----------
create table if not exists reports (
  id bigserial primary key,
  reporter text not null check (reporter ~ '^0x[0-9a-f]{40}$'),
  reported text not null check (reported ~ '^0x[0-9a-f]{40}$'),
  category text not null check (char_length(category) between 1 and 48),
  detail text check (detail is null or char_length(detail) <= 500),
  created_at timestamptz not null default now(),
  check (reporter <> reported)
);
create index if not exists reports_reported_idx on reports (reported);
create index if not exists reports_reporter_idx on reports (reporter);

-- ---------- blocks (matchmaking exclusion list) ----------
create table if not exists blocks (
  blocker text not null check (blocker ~ '^0x[0-9a-f]{40}$'),
  blocked text not null check (blocked ~ '^0x[0-9a-f]{40}$'),
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
create index if not exists blocks_blocked_idx on blocks (blocked);

-- ---------- moderation_events (append-only audit; service role writes) ----------
create table if not exists moderation_events (
  id bigserial primary key,
  address text not null check (address ~ '^0x[0-9a-f]{40}$'),
  action text not null check (action in ('report','spam_flag','restrict','unrestrict','ban','unban')),
  level text check (level is null or level in ('NORMAL','SUSPICIOUS','RATE_LIMITED','TEMP_BLOCKED','BANNED')),
  reason text check (reason is null or char_length(reason) <= 200),
  actor text check (actor is null or actor ~ '^0x[0-9a-f]{40}$'),
  created_at timestamptz not null default now()
);
create index if not exists moderation_events_address_idx on moderation_events (address);

-- ---------- user_bans (durable restriction state; gateway seeds from here) ----------
create table if not exists user_bans (
  address text primary key check (address ~ '^0x[0-9a-f]{40}$'),
  level text not null check (level in ('TEMP_BLOCKED','BANNED')),
  reason text check (reason is null or char_length(reason) <= 200),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table reports enable row level security;
alter table blocks enable row level security;
alter table moderation_events enable row level security;
alter table user_bans enable row level security;

-- Writes/reads go through the service role (API routes + admin). No public
-- policies: RLS denies anon access by default, so reporter/reported mappings
-- are never publicly readable. The gateway keeps live state in-process.
