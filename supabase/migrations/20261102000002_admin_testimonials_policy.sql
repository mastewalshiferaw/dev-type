-- DEV_TYPE Migration: Admin RLS Policies for Testimonials
-- Run this in the Supabase SQL Editor if you do not have SUPABASE_SERVICE_ROLE_KEY configured,
-- or to enforce admin moderation access directly in PostgreSQL RLS.

-- 1. Helper function: checks if the current authenticated user is an admin.
-- Uses SECURITY DEFINER so it executes safely without permission errors.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    -- Check if is_admin flag is in user metadata:
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    -- Or match admin emails directly:
    or lower(auth.jwt() ->> 'email') in (
      'mastewalgshiferaw@gmail.com'
    ),
    false
  );
$$;

-- 2. Allow authenticated admins to view all testimonials regardless of status
drop policy if exists "Admins can view all testimonials" on public.testimonials;
create policy "Admins can view all testimonials" on public.testimonials
  for select to authenticated
  using (
    public.is_admin()
    or ((select auth.uid()) = user_id)
    or (status = 'approved')
  );

-- 3. Allow admins to update status (approve, reject, revert) of any testimonial
drop policy if exists "Admins can update all testimonials" on public.testimonials;
create policy "Admins can update all testimonials" on public.testimonials
  for update to authenticated
  using (
    public.is_admin()
    or ((select auth.uid()) = user_id and status = 'pending')
  );

-- 4. Allow admins to delete any testimonial
drop policy if exists "Admins can delete any testimonial" on public.testimonials;
create policy "Admins can delete any testimonial" on public.testimonials
  for delete to authenticated
  using (
    public.is_admin()
    or ((select auth.uid()) = user_id)
  );
