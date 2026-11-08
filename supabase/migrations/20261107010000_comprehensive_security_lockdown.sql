-- ==============================================================================
-- DEV_TYPE Comprehensive Security Lockdown Migration (Self-Healing & Idempotent)
-- ==============================================================================
-- This script hardens all database tables against:
-- 1. Score spoofing / tampering (wpm > 350)
-- 2. Email harvesting / PII leakage from profiles
-- 3. Privilege escalation via user_metadata in is_admin()
-- 4. Identity impersonation in public.scores (spoofing other users' user_id)
-- 5. Data corruption in public.user_logs
-- 6. Trigger loop exhaustion in handle_new_user_profile()
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SCORES TABLE: ENSURE COLUMNS, PURGE & HARDEN
-- ------------------------------------------------------------------------------

-- Ensure all expected columns exist even if created under an older schema
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS language text DEFAULT 'mixed';
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS mode text DEFAULT 'time-30';

-- Delete any existing corrupted or spoofed scores
DELETE FROM public.scores
WHERE wpm > 350
   OR wpm <= 0
   OR accuracy > 100
   OR accuracy < 0
   OR char_length(trim(player_name)) < 2
   OR char_length(trim(player_name)) > 24;

-- Table-level constraints
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_wpm_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_wpm_chk CHECK (wpm >= 1 AND wpm <= 350);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_acc_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_acc_chk CHECK (accuracy >= 0 AND accuracy <= 100);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_len_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_len_chk CHECK (char_length(trim(player_name)) BETWEEN 2 AND 24);

-- Hardened RLS policy:
-- Enforces valid score metrics AND prevents an attacker from spoofing someone else's user_id
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to scores" ON public.scores;
CREATE POLICY "Allow public read access to scores" ON public.scores
  FOR SELECT USING (wpm >= 1 AND wpm <= 350);

DROP POLICY IF EXISTS "Allow insert scores" ON public.scores;
DROP POLICY IF EXISTS "authenticated insert own scores" ON public.scores;

CREATE POLICY "Allow insert scores" ON public.scores
  FOR INSERT WITH CHECK (
    wpm >= 1 AND wpm <= 350
    AND accuracy >= 0 AND accuracy <= 100
    AND char_length(trim(player_name)) BETWEEN 2 AND 24
    AND (
      -- If authenticated, user_id MUST match caller; if guest, user_id MUST be null
      (auth.uid() IS NULL AND user_id IS NULL)
      OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
    )
    AND (created_at IS NULL OR created_at BETWEEN (now() - interval '5 minutes') AND (now() + interval '5 minutes'))
  );

-- Deny public updates & deletes to scores (scores are immutable records)
DROP POLICY IF EXISTS "Deny public delete scores" ON public.scores;
DROP POLICY IF EXISTS "Deny public update scores" ON public.scores;


-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE: STOP EMAIL HARVESTING / PII LEAK
-- ------------------------------------------------------------------------------

-- Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Safely null out existing emails if the email column exists in profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    EXECUTE 'UPDATE public.profiles SET email = NULL WHERE email IS NOT NULL';
  END IF;
END $$;

-- Public can read profile usernames and ranks without exposing PII
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);


-- ------------------------------------------------------------------------------
-- 3. TESTIMONIALS: FIX PRIVILEGE ESCALATION VULNERABILITY
-- ------------------------------------------------------------------------------

-- CRITICAL FIX: DO NOT check raw_user_meta_data for is_admin!
-- Users can set raw_user_meta_data on signup or via client SDK.
-- Only check app_metadata (set by server/admin) OR hardcoded admin email list.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Check app_metadata (CANNOT be edited by client):
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    -- Or match verified admin emails:
    OR lower(auth.jwt() ->> 'email') IN (
      'mastewalgshiferaw@gmail.com'
    ),
    false
  );
$$;


-- ------------------------------------------------------------------------------
-- 4. USER_LOGS: ENSURE TABLE & PREVENT CORRUPTED STATS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wpm integer NOT NULL,
  raw_wpm integer,
  accuracy integer NOT NULL,
  consistency integer,
  language text,
  mode text,
  duration_ms integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own logs" ON public.user_logs;
CREATE POLICY "Users manage their own logs" ON public.user_logs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER TABLE public.user_logs DROP CONSTRAINT IF EXISTS user_logs_wpm_chk;
ALTER TABLE public.user_logs ADD CONSTRAINT user_logs_wpm_chk CHECK (wpm >= 0 AND wpm <= 350);

ALTER TABLE public.user_logs DROP CONSTRAINT IF EXISTS user_logs_acc_chk;
ALTER TABLE public.user_logs ADD CONSTRAINT user_logs_acc_chk CHECK (accuracy >= 0 AND accuracy <= 100);


-- ------------------------------------------------------------------------------
-- 5. HANDLE_NEW_USER_PROFILE TRIGGER: CIRCUIT-BREAKER ON COLLISION LOOP
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_username text;
  final_username text;
  candidate text;
  suffix int := 1;
BEGIN
  desired_username := trim(COALESCE(new.raw_user_meta_data->>'username', ''));
  
  IF desired_username = '' OR desired_username IS NULL THEN
    final_username := 'coder_' || substr(new.id::text, 1, 6);
  ELSE
    final_username := substring(desired_username FROM 1 FOR 18);
  END IF;

  -- Ensure candidate is unique with a circuit-breaker to prevent query timeouts
  candidate := final_username;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(candidate)
      AND id <> new.id
  ) LOOP
    suffix := suffix + 1;
    IF suffix > 20 THEN
      -- Circuit breaker: append random hex digits to guarantee immediate uniqueness
      candidate := substring(final_username FROM 1 FOR 12) || '_' || substr(md5(random()::text), 1, 4);
      EXIT;
    END IF;
    candidate := substring(final_username FROM 1 FOR (17 - length(suffix::text))) || '_' || suffix::text;
  END LOOP;

  -- Insert profile WITHOUT leaking email
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (new.id, candidate, COALESCE(new.created_at, now()))
  ON CONFLICT (id) DO UPDATE
  SET username = excluded.username;

  -- Keep user metadata in sync if a suffix was required
  IF candidate <> desired_username THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{username}',
      to_jsonb(candidate)
    )
    WHERE id = new.id;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

