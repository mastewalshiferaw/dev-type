-- DEV_TYPE User Profiles & Unique Username Migration
-- Gracefully deduplicates existing collided usernames (e.g. 'afrodev') and enforces uniqueness

-- 1. PROFILES TABLE (without unique constraint initially to allow safe migration)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz default now() not null,
  constraint username_len_chk check (char_length(username) between 2 and 18),
  constraint username_char_chk check (username ~ '^[\w.@-]{2,18}$')
);

-- Drop any previous conflicting index attempt
drop index if exists public.profiles_username_lower_idx;

-- 2. BACKFILL EXISTING USERS WITH AUTOMATIC DEDUPLICATION
-- If multiple users share the same username (e.g. 'afrodev'), the oldest user keeps the name,
-- and newer accounts get a suffix: 'afrodev_2', 'afrodev_3', etc.
with ranked_users as (
  select
    id,
    coalesce(nullif(trim(raw_user_meta_data->>'username'), ''), 'coder_' || substr(id::text, 1, 6)) as base_name,
    created_at,
    row_number() over (
      partition by lower(coalesce(nullif(trim(raw_user_meta_data->>'username'), ''), 'coder_' || substr(id::text, 1, 6)))
      order by created_at asc
    ) as rn
  from auth.users
),
deduped as (
  select
    id,
    case
      when rn = 1 then substring(base_name from 1 for 18)
      else substring(base_name from 1 for (17 - length(rn::text))) || '_' || rn::text
    end as unique_username,
    created_at
  from ranked_users
)
insert into public.profiles (id, username, created_at)
select id, unique_username, coalesce(created_at, now())
from deduped
on conflict (id) do update
set username = excluded.username;

-- 3. SYNC RESOLVED NAMES BACK TO auth.users METADATA
update auth.users u
set raw_user_meta_data = jsonb_set(
  coalesce(u.raw_user_meta_data, '{}'::jsonb),
  '{username}',
  to_jsonb(p.username)
)
from public.profiles p
where u.id = p.id
  and (u.raw_user_meta_data->>'username') is distinct from p.username;

-- 4. NOW CREATE THE UNIQUE INDEX (Guaranteed to succeed because data is deduplicated)
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_created_at on public.profiles (created_at desc);

-- 5. AUTOMATIC TRIGGER ON FUTURE SIGNUPS
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text;
  final_username text;
  candidate text;
  suffix int := 1;
begin
  desired_username := trim(coalesce(new.raw_user_meta_data->>'username', ''));
  
  if desired_username = '' or desired_username is null then
    final_username := 'coder_' || substr(new.id::text, 1, 6);
  else
    final_username := substring(desired_username from 1 for 18);
  end if;

  -- Ensure candidate is unique even under concurrent signups
  candidate := final_username;
  while exists (
    select 1 from public.profiles
    where lower(username) = lower(candidate)
      and id <> new.id
  ) loop
    suffix := suffix + 1;
    candidate := substring(final_username from 1 for (17 - length(suffix::text))) || '_' || suffix::text;
  end loop;

  insert into public.profiles (id, username, created_at)
  values (new.id, candidate, coalesce(new.created_at, now()))
  on conflict (id) do update
  set username = excluded.username;

  -- Keep user metadata in sync if a suffix was required
  if candidate <> desired_username then
    update auth.users
    set raw_user_meta_data = jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{username}',
      to_jsonb(candidate)
    )
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

-- 6. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;

-- Public can read all profiles to check availability and view ranks
drop policy if exists "Allow public read access to profiles" on public.profiles;
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

-- Authenticated users can update only their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Authenticated users can insert their own profile
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);
