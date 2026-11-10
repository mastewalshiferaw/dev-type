-- ==============================================================================
-- Migration: Secure Telegram Channel Ownership Verification & Anti-Spoofing
-- ==============================================================================

-- 1. Add telegram_verified column to profiles and scores
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_verified boolean DEFAULT false;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS telegram_verified boolean DEFAULT false;

-- 2. Unique index to guarantee no two users can claim or verify the same channel
CREATE UNIQUE INDEX IF NOT EXISTS profiles_telegram_unique_idx
  ON public.profiles (LOWER(TRIM(telegram)))
  WHERE telegram IS NOT NULL AND TRIM(telegram) <> '';

-- 3. Update sync trigger so telegram_verified propagates from profiles to scores
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
    telegram = NEW.telegram,
    telegram_verified = COALESCE(NEW.telegram_verified, false)
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_profile_changed_sync_scores ON public.profiles;
CREATE TRIGGER on_profile_changed_sync_scores
  AFTER UPDATE OF username, avatar_url, telegram, telegram_verified ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_data_to_scores();
