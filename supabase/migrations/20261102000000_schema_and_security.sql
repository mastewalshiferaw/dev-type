-- DEV_TYPE Schema Migration & Security Policies
-- Addresses: DEV-001 (schema parity), DEV-002 (score poisoning prevention),
-- DEV-006 (user_id identity), DEV-008 (cloud sync user_logs)

-- Step 0 (Audit cleanup): Delete test/poison probe rows if desired:
-- delete from public.scores;

-- 1. SCORES TABLE
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  player_name text not null,
  wpm integer not null,
  accuracy numeric(5,2) not null,
  language text default 'mixed',
  mode text default 'time-30',
  created_at timestamptz default now() not null
);

-- Ensure all required columns exist
alter table public.scores add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.scores add column if not exists language text default 'mixed';
alter table public.scores add column if not exists mode text default 'time-30';
alter table public.scores alter column created_at set default now();

-- Score validation constraints (DEV-002)
alter table public.scores drop constraint if exists scores_wpm_chk;
alter table public.scores add constraint scores_wpm_chk check (wpm between 0 and 400);

alter table public.scores drop constraint if exists scores_acc_chk;
alter table public.scores add constraint scores_acc_chk check (accuracy between 0 and 100);

alter table public.scores drop constraint if exists scores_len_chk;
alter table public.scores add constraint scores_len_chk check (char_length(player_name) between 2 and 18);

-- Indexes for fast ranking queries
create index if not exists scores_created_wpm on public.scores (created_at desc, wpm desc);
create index if not exists scores_user_id on public.scores (user_id);
create index if not exists scores_language on public.scores (language);

-- Row Level Security
alter table public.scores enable row level security;

-- Public read access
drop policy if exists "Allow public read access to scores" on public.scores;
create policy "Allow public read access to scores" on public.scores
  for select using (true);

-- Submission policy: only within a valid 2-minute time window around now
drop policy if exists "Allow insert scores" on public.scores;
drop policy if exists "authenticated insert own scores" on public.scores;
create policy "Allow insert scores" on public.scores
  for insert with check (
    created_at between (now() - interval '2 minutes') and (now() + interval '2 minutes')
  );

-- Refuse anon updates/deletes to scores
drop policy if exists "Deny public delete scores" on public.scores;
drop policy if exists "Deny public update scores" on public.scores;


-- 2. USER PRACTICE LOGS TABLE (DEV-008)
create table if not exists public.user_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wpm integer not null,
  raw_wpm integer,
  accuracy integer not null,
  consistency integer,
  language text,
  mode text,
  duration_ms integer,
  created_at timestamptz default now() not null
);

create index if not exists user_logs_user_id on public.user_logs (user_id, created_at desc);

alter table public.user_logs enable row level security;

drop policy if exists "Users manage their own logs" on public.user_logs;
create policy "Users manage their own logs" on public.user_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
