-- DEV_TYPE User Profiles & Unique Username Migration
-- Enforces true system-wide username uniqueness at the database level

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz default now() not null,
  constraint username_len_chk check (char_length(username) between 2 and 18),
  constraint username_char_chk check (username ~ '^[\w.@-]{2,18}$')
);

-- Case-insensitive unique index: prevents "Alice" and "alice" from coexisting
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_created_at on public.profiles (created_at desc);

-- 2. BACKFILL EXISTING USERS
insert into public.profiles (id, username, created_at)
select
  id,
  coalesce(nullif(trim(raw_user_meta_data->>'username'), ''), 'coder_' || substr(id::text, 1, 6)),
  created_at
from auth.users
on conflict (id) do update
set username = excluded.username;

-- 3. AUTOMATIC SYNC TRIGGER ON SIGNUP
-- Automatically creates a profile row whenever a new user signs up in auth.users
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text;
  final_username text;
begin
  desired_username := trim(coalesce(new.raw_user_meta_data->>'username', ''));
  
  if desired_username = '' or desired_username is null then
    final_username := 'coder_' || substr(new.id::text, 1, 6);
  else
    final_username := desired_username;
  end if;

  insert into public.profiles (id, username, created_at)
  values (new.id, final_username, coalesce(new.created_at, now()))
  on conflict (id) do update
  set username = excluded.username;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;

-- Public can check taken usernames
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
