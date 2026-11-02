-- DEV_TYPE Testimonials Table & Security Policies
-- Enables verified users to submit testimonials with moderation

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  role text not null default 'Developer',
  quote text not null check (char_length(quote) between 15 and 280),
  wpm_record integer check (wpm_record between 0 and 400),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  -- One testimonial per user
  constraint unique_user_testimonial unique (user_id)
);

create index if not exists testimonials_status_created on public.testimonials (status, created_at desc);
create index if not exists testimonials_user_id on public.testimonials (user_id);

-- Enable Row Level Security
alter table public.testimonials enable row level security;

-- 1. Public can read approved testimonials
drop policy if exists "Allow public read approved testimonials" on public.testimonials;
create policy "Allow public read approved testimonials" on public.testimonials
  for select using (status = 'approved');

-- 2. Authenticated users can read their own testimonial (even if pending)
drop policy if exists "Users read own testimonial" on public.testimonials;
create policy "Users read own testimonial" on public.testimonials
  for select to authenticated using ((select auth.uid()) = user_id);

-- 3. Authenticated users can insert their own testimonial (always starts as pending)
drop policy if exists "Authenticated users insert testimonial" on public.testimonials;
create policy "Authenticated users insert testimonial" on public.testimonials
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
  );

-- 4. Authenticated users can update their own testimonial (reverts to pending on edit)
drop policy if exists "Users update own testimonial" on public.testimonials;
create policy "Users update own testimonial" on public.testimonials
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
  );

-- 5. Authenticated users can delete their own testimonial
drop policy if exists "Users delete own testimonial" on public.testimonials;
create policy "Users delete own testimonial" on public.testimonials
  for delete to authenticated
  using ((select auth.uid()) = user_id);
