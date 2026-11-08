-- ==============================================================================
-- DEV_TYPE Fast Username Availability RPC & Strict Early Rejection
-- ==============================================================================
-- Allows frontend to check if a username is taken in real-time across:
-- 1. public.profiles (case-insensitive)
-- 2. public.scores (case-insensitive)
-- 3. auth.users raw_user_meta_data (case-insensitive)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_username_available(
  candidate_username text,
  exclude_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned text;
  taken boolean;
BEGIN
  cleaned := LOWER(TRIM(candidate_username));
  
  -- Reject empty or invalid length usernames
  IF cleaned IS NULL OR CHAR_LENGTH(cleaned) < 2 OR CHAR_LENGTH(cleaned) > 24 THEN
    RETURN false;
  END IF;

  -- 1. Check public.profiles
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(TRIM(username)) = cleaned
      AND (exclude_user_id IS NULL OR id <> exclude_user_id)
  ) INTO taken;

  IF taken THEN
    RETURN false;
  END IF;

  -- 2. Check public.scores (ensures no one can steal an existing leaderboard username)
  SELECT EXISTS (
    SELECT 1 FROM public.scores
    WHERE LOWER(TRIM(player_name)) = cleaned
      AND (exclude_user_id IS NULL OR user_id IS DISTINCT FROM exclude_user_id)
  ) INTO taken;

  IF taken THEN
    RETURN false;
  END IF;

  -- 3. Check auth.users metadata if registered
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
$$;

-- Grant execution permission to both guests and authenticated users
GRANT EXECUTE ON FUNCTION public.check_username_available(text, uuid) TO anon, authenticated, service_role;
