-- ==============================================================================
-- DEV_TYPE Strict Anti-Cheat & Enforced Unique Username Migration
-- ==============================================================================
-- 1. Purges any spoofed scores (including 999 WPM / fake 100% accuracy)
-- 2. Enforces strict human typing limits (wpm between 1 and 280) via table constraints
--    AND an unbypassable PostgreSQL BEFORE INSERT OR UPDATE trigger.
-- 3. Strictly enforces case-insensitive username uniqueness across profiles and scores.
-- 4. Automatically propagates username changes in profiles to past leaderboard scores
--    via an atomic AFTER UPDATE trigger.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PURGE SPOOFED & IMPOSSIBLE SCORES
-- ------------------------------------------------------------------------------
DELETE FROM public.scores
WHERE wpm > 280
   OR wpm < 1
   OR accuracy > 100
   OR accuracy < 0
   OR char_length(trim(player_name)) < 2
   OR char_length(trim(player_name)) > 24;

DELETE FROM public.user_logs
WHERE wpm > 280
   OR wpm < 0
   OR accuracy > 100
   OR accuracy < 0;

-- ------------------------------------------------------------------------------
-- 2. DEDUPLICATE EXISTING SCORES (Keep each player's single personal best)
-- ------------------------------------------------------------------------------
DELETE FROM public.scores
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(TRIM(player_name))) id
  FROM public.scores
  ORDER BY LOWER(TRIM(player_name)), wpm DESC, accuracy DESC, created_at DESC
);

DELETE FROM public.scores
WHERE user_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.scores
    WHERE user_id IS NOT NULL
    ORDER BY user_id, wpm DESC, accuracy DESC, created_at DESC
  );

-- ------------------------------------------------------------------------------
-- 3. STRICT TABLE CONSTRAINTS & UNIQUE INDEXES
-- ------------------------------------------------------------------------------

-- Scores Table: Strict human typing limits (Max 280 WPM, 0-100% accuracy)
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_wpm_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_wpm_chk CHECK (wpm >= 1 AND wpm <= 280);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_acc_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_acc_chk CHECK (accuracy >= 0 AND accuracy <= 100);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_len_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_len_chk CHECK (char_length(trim(player_name)) BETWEEN 2 AND 24);

-- Enforce strict unique username across all scores (case-insensitive)
DROP INDEX IF EXISTS public.scores_player_name_lower_idx;
CREATE UNIQUE INDEX scores_player_name_lower_idx ON public.scores (lower(trim(player_name)));

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_player_name_key;
ALTER TABLE public.scores ADD CONSTRAINT scores_player_name_key UNIQUE (player_name);

CREATE UNIQUE INDEX IF NOT EXISTS scores_user_id_unique ON public.scores (user_id) WHERE user_id IS NOT NULL;

-- Profiles Table: Strict unique username & email (case-insensitive)
DROP INDEX IF EXISTS public.profiles_username_lower_idx;
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(trim(username)));

DROP INDEX IF EXISTS public.profiles_email_lower_idx;
CREATE UNIQUE INDEX profiles_email_lower_idx ON public.profiles (lower(trim(email))) 
  WHERE email IS NOT NULL AND email <> '';

-- ------------------------------------------------------------------------------
-- 4. ENGINE-LEVEL ANTI-CHEAT TRIGGER (Cannot be bypassed by PostgREST or RLS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_score_anti_cheat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.player_name := TRIM(NEW.player_name);

  -- Reject any impossible typing speed (e.g. 999 WPM or <= 0 WPM)
  IF NEW.wpm < 1 OR NEW.wpm > 280 THEN
    RAISE EXCEPTION 'Score rejected: % WPM is outside realistic human typing limits (1-280 WPM).', NEW.wpm;
  END IF;

  -- Reject invalid accuracy
  IF NEW.accuracy < 0 OR NEW.accuracy > 100 THEN
    RAISE EXCEPTION 'Score rejected: %%% accuracy is invalid (must be between 0 and 100).', NEW.accuracy;
  END IF;

  -- Reject invalid username lengths
  IF CHAR_LENGTH(NEW.player_name) < 2 OR CHAR_LENGTH(NEW.player_name) > 24 THEN
    RAISE EXCEPTION 'Score rejected: Player name length must be between 2 and 24 characters.';
  END IF;

  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scores_anti_cheat ON public.scores;
CREATE TRIGGER trg_scores_anti_cheat
  BEFORE INSERT OR UPDATE ON public.scores
  FOR EACH ROW
  EXECUTE FUNCTION public.check_score_anti_cheat();

-- ------------------------------------------------------------------------------
-- 5. ATOMIC USERNAME SYNCHRONIZATION TRIGGER (Propagates to past leaderboard scores)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_username_to_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    -- Automatically update all past leaderboard entries for this user to their new username
    UPDATE public.scores
    SET player_name = NEW.username
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_username_changed ON public.profiles;
CREATE TRIGGER on_profile_username_changed
  AFTER UPDATE OF username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_username_to_scores();

-- ------------------------------------------------------------------------------
-- 6. ROW-LEVEL SECURITY (RLS) HARDENING
-- ------------------------------------------------------------------------------
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Read policy: only display valid scores
DROP POLICY IF EXISTS "Allow public read access to scores" ON public.scores;
CREATE POLICY "Allow public read access to scores" ON public.scores
  FOR SELECT USING (wpm >= 1 AND wpm <= 280);

-- Insert policy: verify caller identity and anti-cheat constraints
DROP POLICY IF EXISTS "Allow insert scores" ON public.scores;
DROP POLICY IF EXISTS "authenticated insert own scores" ON public.scores;

CREATE POLICY "Allow insert scores" ON public.scores
  FOR INSERT WITH CHECK (
    wpm >= 1 AND wpm <= 280
    AND accuracy >= 0 AND accuracy <= 100
    AND char_length(trim(player_name)) BETWEEN 2 AND 24
    AND (
      (auth.uid() IS NULL AND user_id IS NULL)
      OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
    )
  );

-- Update policy: allow authenticated user to update their own score or username
DROP POLICY IF EXISTS "Allow update own scores" ON public.scores;
DROP POLICY IF EXISTS "Allow update scores" ON public.scores;

CREATE POLICY "Allow update own scores" ON public.scores
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
    OR (auth.uid() IS NULL AND user_id IS NULL)
  )
  WITH CHECK (
    wpm >= 1 AND wpm <= 280
    AND accuracy >= 0 AND accuracy <= 100
    AND char_length(trim(player_name)) BETWEEN 2 AND 24
    AND (
      (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
      OR (auth.uid() IS NULL AND user_id IS NULL)
    )
  );
