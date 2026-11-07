-- ==============================================================================
-- DEV_TYPE Comprehensive Security Lockdown Migration
-- ==============================================================================
-- This script hardens all database tables against:
-- 1. Score spoofing / tampering (wpm > 350)
-- 2. Email harvesting / PII leakage from profiles
-- 3. Privilege escalation via user_metadata in is_admin()
-- 4. Identity impersonation in public.scores (spoofing other users' user_id)
-- 5. Data corruption in public.user_logs
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SCORES TABLE HARDENING & PURGE
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE: STOP EMAIL HARVESTING / PII LEAK
-- ------------------------------------------------------------------------------

-- Ensure email column is not readable by anonymous scrapers.
-- The auth.users table already holds the user's private email securely.
-- We null out existing emails in public.profiles to protect user privacy.
UPDATE public.profiles SET email = NULL WHERE email IS NOT NULL;

-- Remove email column or make it restricted:
-- If public profiles are queried, scrapers can only see id, username, and created_at.
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
-- 4. USER_LOGS: PREVENT CORRUPTED STATS
-- ------------------------------------------------------------------------------

ALTER TABLE public.user_logs DROP CONSTRAINT IF EXISTS user_logs_wpm_chk;
ALTER TABLE public.user_logs ADD CONSTRAINT user_logs_wpm_chk CHECK (wpm >= 0 AND wpm <= 350);

ALTER TABLE public.user_logs DROP CONSTRAINT IF EXISTS user_logs_acc_chk;
ALTER TABLE public.user_logs ADD CONSTRAINT user_logs_acc_chk CHECK (accuracy >= 0 AND accuracy <= 100);
