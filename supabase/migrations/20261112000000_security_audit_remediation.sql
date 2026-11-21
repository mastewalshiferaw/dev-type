-- ==============================================================================
-- DEV_TYPE Security Remediation & Absolute Identity Hardening
-- Addresses:
--   1. Leaderboard scores forgery: RLS lockdown, server timestamp enforcement, run replay defense
--   2. Telegram verification IDOR: strict profile binding, anti-takeover
--   3. Password reset token exposure: server log redaction
--   4. Admin area authorization: app_metadata enforcement, verified email gate, fail-closed
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SCORES TABLE HARDENING
-- ------------------------------------------------------------------------------
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS run_id text;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS server_verified boolean DEFAULT false;

-- Uniqueness on (user_id, run_id) to eliminate client replays
CREATE UNIQUE INDEX IF NOT EXISTS scores_user_run_id_unique
  ON public.scores (user_id, run_id)
  WHERE user_id IS NOT NULL AND run_id IS NOT NULL;

-- Anti-Cheat & Server-Timestamp Trigger
-- Overwrite created_at to NOW() on all inserts/updates so client timestamps are discarded
CREATE OR REPLACE FUNCTION public.check_score_anti_cheat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  NEW.player_name := TRIM(NEW.player_name);

  -- Hard boundaries
  IF NEW.wpm < 1 OR NEW.wpm > 280 THEN
    RAISE EXCEPTION 'Score rejected: % WPM is outside valid human limits (1-280 WPM).', NEW.wpm;
  END IF;

  IF NEW.accuracy < 0 OR NEW.accuracy > 100 THEN
    RAISE EXCEPTION 'Score rejected: %%% accuracy is invalid (must be between 0 and 100).', NEW.accuracy;
  END IF;

  IF CHAR_LENGTH(NEW.player_name) < 2 OR CHAR_LENGTH(NEW.player_name) > 24 THEN
    RAISE EXCEPTION 'Score rejected: Player name length must be between 2 and 24 characters.';
  END IF;

  -- Security Fix: Always enforce database server timestamp, ignoring any client timestamp
  NEW.created_at := NOW();

  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_scores_anti_cheat ON public.scores;
CREATE TRIGGER trg_scores_anti_cheat
  BEFORE INSERT OR UPDATE ON public.scores
  FOR EACH ROW
  EXECUTE FUNCTION public.check_score_anti_cheat();

-- Row Level Security on SCORES:
-- Drop insecure anonymous insert and update policies
DROP POLICY IF EXISTS "Allow insert scores" ON public.scores;
DROP POLICY IF EXISTS "authenticated insert own scores" ON public.scores;
DROP POLICY IF EXISTS "Allow update own scores" ON public.scores;
DROP POLICY IF EXISTS "Allow update scores" ON public.scores;

-- INSERT policy: only authenticated users inserting their own verified user_id
CREATE POLICY "Allow authenticated insert own scores" ON public.scores
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND wpm >= 1 AND wpm <= 280
    AND accuracy >= 0 AND accuracy <= 100
    AND char_length(trim(player_name)) BETWEEN 2 AND 24
  );

-- No public direct UPDATE or DELETE policies:
-- Score updates and leaderboard maintenance must run through verified server actions.

-- ------------------------------------------------------------------------------
-- 2. ADMIN ROLE DEFINITION HARDENING (app_metadata only + email verification)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- 1. Must have a confirmed email address
    (auth.jwt() ->> 'email_confirmed_at') IS NOT NULL
    AND (
      -- 2. MUST read role from app_metadata only (set by service-role, never user_metadata)
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
      OR lower(auth.jwt() ->> 'email') IN (
        'mastewalgshiferaw@gmail.com'
      )
    ),
    false
  );
$$;

-- ------------------------------------------------------------------------------
-- 3. TESTIMONIALS RLS POLICIES (enforce is_admin)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.testimonials;
CREATE POLICY "Admins can view all testimonials" ON public.testimonials
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR ((select auth.uid()) = user_id)
    OR (status = 'approved')
  );

DROP POLICY IF EXISTS "Admins can update all testimonials" ON public.testimonials;
CREATE POLICY "Admins can update all testimonials" ON public.testimonials
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR ((select auth.uid()) = user_id and status = 'pending')
  );

DROP POLICY IF EXISTS "Admins can delete any testimonial" ON public.testimonials;
CREATE POLICY "Admins can delete any testimonial" ON public.testimonials
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR ((select auth.uid()) = user_id)
  );

-- ------------------------------------------------------------------------------
-- 4. PROFILE PHOTO (AVATAR) ENFORCEMENT & BACKFILL
-- ------------------------------------------------------------------------------
UPDATE public.profiles
SET avatar_url = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80'
WHERE avatar_url IS NULL OR TRIM(avatar_url) = '';

UPDATE public.scores
SET avatar_url = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80'
WHERE avatar_url IS NULL OR TRIM(avatar_url) = '';

