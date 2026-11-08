-- ==============================================================================
-- Migration: Add Profile Photo (Avatar) & Telegram Channel
-- ==============================================================================

-- 1. Add avatar_url and telegram to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram text;

-- 2. Add avatar_url and telegram to scores (so leaderboard queries fetch them directly)
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS telegram text;

-- 3. Update sync trigger to propagate avatar_url and telegram from profiles to scores
CREATE OR REPLACE FUNCTION public.sync_profile_data_to_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  UPDATE public.scores
  SET
    player_name = NEW.username,
    avatar_url = NEW.avatar_url,
    telegram = NEW.telegram
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_profile_changed_sync_scores ON public.profiles;
CREATE TRIGGER on_profile_changed_sync_scores
  AFTER UPDATE OF username, avatar_url, telegram ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_data_to_scores();
