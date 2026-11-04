-- DEV_TYPE Optional Migration: Admin RLS Policies for Testimonials
-- 
-- If you use the in-app Admin Moderation panel with SUPABASE_SERVICE_ROLE_KEY set,
-- the server API route bypasses RLS and handles authorization securely via Next.js.
--
-- However, if you prefer client-side direct access without a service role key,
-- or want to enforce admin policies directly in PostgreSQL RLS, run this migration:

-- Example: Define an admin helper function checking auth.jwt() email
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    -- Check user metadata or specific admin emails:
    (auth.jwt() ->> 'email') = any(string_to_array(coalesce(current_setting('app.settings.admin_emails', true), ''), ',')),
    false
  );
$$;

-- Allow authenticated admins to view all testimonials regardless of status
drop policy if exists "Admins can view all testimonials" on public.testimonials;
create policy "Admins can view all testimonials" on public.testimonials
  for select to authenticated
  using (
    -- Allow user if email matches admin list or has admin role:
    (auth.jwt() ->> 'email') in (
      select email from auth.users where raw_user_meta_data->>'is_admin' = 'true'
    )
    or ((select auth.uid()) = user_id)
    or (status = 'approved')
  );

-- Allow admins to update status (approve, reject, revert) of any testimonial
drop policy if exists "Admins can update all testimonials" on public.testimonials;
create policy "Admins can update all testimonials" on public.testimonials
  for update to authenticated
  using (
    (auth.jwt() ->> 'email') in (
      select email from auth.users where raw_user_meta_data->>'is_admin' = 'true'
    )
    or ((select auth.uid()) = user_id and status = 'pending')
  );

-- Allow admins to delete any testimonial
drop policy if exists "Admins can delete any testimonial" on public.testimonials;
create policy "Admins can delete any testimonial" on public.testimonials
  for delete to authenticated
  using (
    (auth.jwt() ->> 'email') in (
      select email from auth.users where raw_user_meta_data->>'is_admin' = 'true'
    )
    or ((select auth.uid()) = user_id)
  );
