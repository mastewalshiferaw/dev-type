-- ==============================================================================
-- DEV_TYPE Hard Database Reset & Absolute Identity Lockdown
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PURGE SPOOFED & IMPOSSIBLE METRICS (wpm > 280, invalid accuracy)
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
-- 2. DEDUPLICATE PROFILES & SCORES
-- ------------------------------------------------------------------------------

-- Deduplicate scores by player_name (keeps highest WPM & accuracy)
DELETE FROM public.scores
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(TRIM(player_name))) id
  FROM public.scores
  ORDER BY LOWER(TRIM(player_name)), wpm DESC, accuracy DESC, created_at DESC
);

-- Deduplicate scores by user_id
DELETE FROM public.scores
WHERE user_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.scores
    WHERE user_id IS NOT NULL
    ORDER BY user_id, wpm DESC, accuracy DESC, created_at DESC
  );

-- Deduplicate profiles by lowercase username (oldest user keeps name)
WITH ranked_profiles AS (
  SELECT
    id,
    username,
    row_number() OVER (PARTITION BY LOWER(TRIM(username)) ORDER BY created_at ASC) as rn
  FROM public.profiles
)
UPDATE public.profiles p
SET username = SUBSTRING(p.username FROM 1 FOR 12) || '_' || SUBSTR(p.id::text, 1, 4)
FROM ranked_profiles r
WHERE p.id = r.id AND r.rn > 1;

-- ------------------------------------------------------------------------------
-- 3. ENGINE-LEVEL AUTH GUARD: PREVENT DUPLICATE USERNAME ON SIGNUP OR UPDATE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_new_auth_user_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  desired text;
BEGIN
  desired := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'username', '')));
  IF desired IS NOT NULL AND desired <> '' THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE LOWER(TRIM(username)) = desired AND id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'This username is already taken. Please choose another one.';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.scores 
      WHERE LOWER(TRIM(player_name)) = desired AND (user_id IS NULL OR user_id <> NEW.id)
    ) THEN
      RAISE EXCEPTION 'This username is already taken. Please choose another one.';
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_auth_user_before_insert ON auth.users;
CREATE TRIGGER on_auth_user_before_insert
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_new_auth_user_username();

-- ------------------------------------------------------------------------------
-- 4. HARD UNIQUE CONSTRAINTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_wpm_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_wpm_chk CHECK (wpm >= 1 AND wpm <= 280);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_acc_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_acc_chk CHECK (accuracy >= 0 AND accuracy <= 100);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_len_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_len_chk CHECK (char_length(trim(player_name)) BETWEEN 2 AND 24);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_player_name_key;
ALTER TABLE public.scores ADD CONSTRAINT scores_player_name_key UNIQUE (player_name);

DROP INDEX IF EXISTS public.scores_player_name_lower_idx;
CREATE UNIQUE INDEX scores_player_name_lower_idx ON public.scores (lower(trim(player_name)));

DROP INDEX IF EXISTS public.scores_user_id_unique;
CREATE UNIQUE INDEX scores_user_id_unique ON public.scores (user_id) WHERE user_id IS NOT NULL;

DROP INDEX IF EXISTS public.profiles_username_lower_idx;
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(trim(username)));

DROP INDEX IF EXISTS public.profiles_email_lower_idx;
CREATE UNIQUE INDEX profiles_email_lower_idx ON public.profiles (lower(trim(email))) 
  WHERE email IS NOT NULL AND email <> '';

-- ------------------------------------------------------------------------------
-- 5. ANTI-CHEAT TRIGGER (Scores table)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_score_anti_cheat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  NEW.player_name := TRIM(NEW.player_name);

  IF NEW.wpm < 1 OR NEW.wpm > 280 THEN
    RAISE EXCEPTION 'Score rejected: % WPM is outside valid human limits (1-280 WPM).', NEW.wpm;
  END IF;

  IF NEW.accuracy < 0 OR NEW.accuracy > 100 THEN
    RAISE EXCEPTION 'Score rejected: %%% accuracy is invalid (must be between 0 and 100).', NEW.accuracy;
  END IF;

  IF CHAR_LENGTH(NEW.player_name) < 2 OR CHAR_LENGTH(NEW.player_name) > 24 THEN
    RAISE EXCEPTION 'Score rejected: Player name length must be between 2 and 24 characters.';
  END IF;

  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;

  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_scores_anti_cheat ON public.scores;
CREATE TRIGGER trg_scores_anti_cheat
  BEFORE INSERT OR UPDATE ON public.scores
  FOR EACH ROW
  EXECUTE FUNCTION public.check_score_anti_cheat();

-- ------------------------------------------------------------------------------
-- 6. ATOMIC USERNAME SYNCHRONIZATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_username_to_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    UPDATE public.scores
    SET player_name = NEW.username
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_profile_username_changed ON public.profiles;
CREATE TRIGGER on_profile_username_changed
  AFTER UPDATE OF username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_username_to_scores();

-- ------------------------------------------------------------------------------
-- 7. FAST USERNAME AVAILABILITY RPC FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_username_available(
  candidate_username text,
  exclude_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  cleaned text;
  taken boolean;
BEGIN
  cleaned := LOWER(TRIM(candidate_username));
  
  IF cleaned IS NULL OR CHAR_LENGTH(cleaned) < 2 OR CHAR_LENGTH(cleaned) > 24 THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(TRIM(username)) = cleaned
      AND (exclude_user_id IS NULL OR id <> exclude_user_id)
  ) INTO taken;

  IF taken THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.scores
    WHERE LOWER(TRIM(player_name)) = cleaned
      AND (exclude_user_id IS NULL OR user_id IS DISTINCT FROM exclude_user_id)
  ) INTO taken;

  IF taken THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(TRIM(COALESCE(raw_user_meta_data->>'username', ''))) = cleaned
      AND (exclude_user_id IS NULL OR id <> exclude_user_id)
  ) INTO taken;

  IF taken THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.check_username_available(text, uuid) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 8. ROW-LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to scores" ON public.scores;
CREATE POLICY "Allow public read access to scores" ON public.scores
  FOR SELECT USING (wpm >= 1 AND wpm <= 280);

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
