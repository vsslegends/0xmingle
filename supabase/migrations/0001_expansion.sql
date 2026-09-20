-- Expansion: wallet-native social network (profiles, rooms, economy).
-- Reuses AGENTS.md table names where planned; all idempotent.
-- Chat/media stay off-chain; this stores identity, access, and economy only.

-- ---------- profiles (extends planned users/profiles) ----------
create table if not exists profiles (
  address text primary key check (address ~ '^0x[0-9a-f]{40}$'),
  username text unique check (username is null or username ~ '^[a-zA-Z0-9_]{3,20}$'),
  avatar text,
  bio text check (bio is null or char_length(bio) <= 160),
  language text,
  region text,
  links text[] not null default '{}',
  privacy text not null default 'anonymous' check (privacy in ('anonymous','wallet','profile')),
  conversations int not null default 0,
  people_met int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_interests (
  address text not null references profiles(address) on delete cascade,
  interest text not null check (char_length(interest) between 1 and 24),
  primary key (address, interest)
);

-- ---------- reputation (internal signals; never public raw) ----------
create table if not exists reputation_events (
  id bigserial primary key,
  address text not null,
  kind text not null check (kind in ('session','report_against','block_against','spam_flag','bot_signal')),
  weight int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists reputation_events_address_idx on reputation_events (address);

-- ---------- communities / rooms ----------
create table if not exists communities (
  id text primary key,
  name text not null,
  description text not null default '',
  avatar text,
  creator text,
  created_at timestamptz not null default now()
);

create table if not exists rooms (
  id text primary key,
  community_id text not null references communities(id) on delete cascade,
  name text not null,
  description text not null default '',
  access_kind text not null default 'public'
    check (access_kind in ('public','wallet','token','nft','paid')),
  access_config jsonb not null default '{}',
  creator text,
  members int not null default 0,
  online int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists room_members (
  room_id text not null references rooms(id) on delete cascade,
  address text not null,
  role text not null default 'member' check (role in ('member','mod','creator')),
  joined_at timestamptz not null default now(),
  primary key (room_id, address)
);

create table if not exists creator_settings (
  address text primary key,
  paid_enabled boolean not null default false,
  price_wei text not null default '0',
  duration_min int not null default 10,
  updated_at timestamptz not null default now()
);

-- ---------- economy ----------
create table if not exists tips (
  id bigserial primary key,
  from_address text not null,
  to_address text not null,
  amount_wei text not null,
  fee_wei text not null default '0',
  tx_hash text,
  chain_id int,
  status text not null default 'quoted' check (status in ('quoted','sent','confirmed','failed')),
  created_at timestamptz not null default now()
);
create index if not exists tips_to_idx on tips (to_address);

create table if not exists payment_intents (
  id text primary key,
  payer text not null,
  kind text not null check (kind in ('tip','premium','private_session','room')),
  amount_wei text not null,
  fee_wei text not null default '0',
  status text not null default 'open' check (status in ('open','paid','expired','refunded')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  address text primary key,
  tier text not null default 'free' check (tier in ('free','premium')),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- referrals / rewards (off-chain points; no token) ----------
create table if not exists referrals (
  id bigserial primary key,
  referrer text not null,
  referred text not null unique,
  qualified boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists referrals_referrer_idx on referrals (referrer);

create table if not exists reward_points (
  address text primary key,
  points int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table user_interests enable row level security;
alter table communities enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;

-- Public read for discovery; writes via service role only (API routes).
create policy "public profiles readable" on profiles for select using (true);
create policy "public interests readable" on user_interests for select using (true);
create policy "public communities readable" on communities for select using (true);
create policy "public rooms readable" on rooms for select using (true);
create policy "public room members readable" on room_members for select using (true);
