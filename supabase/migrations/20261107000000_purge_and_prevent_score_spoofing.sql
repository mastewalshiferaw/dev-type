-- ==============================================================================
-- Migration: Purge Spoofed Scores and Enforce Strict Anti-Cheat Constraints
-- ==============================================================================
-- Fixes: Score spoofing / tampering (e.g. 9999 WPM, 100% accuracy)
-- Ensures: Both database-level CHECK constraints and Row-Level Security (RLS)
--          reject any submission outside realistic human typing limits (<= 350 WPM).
-- ==============================================================================

-- 1. Purge any spoofed, negative, or physically impossible scores from the database
DELETE FROM public.scores
WHERE wpm > 350
   OR wpm <= 0
   OR accuracy > 100
   OR accuracy < 0
   OR char_length(trim(player_name)) < 2
   OR char_length(trim(player_name)) > 24;

-- 2. Enforce CHECK constraints at table level
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_wpm_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_wpm_chk CHECK (wpm >= 1 AND wpm <= 350);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_acc_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_acc_chk CHECK (accuracy >= 0 AND accuracy <= 100);

ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_len_chk;
ALTER TABLE public.scores ADD CONSTRAINT scores_len_chk CHECK (char_length(trim(player_name)) BETWEEN 2 AND 24);

-- 3. Hardened RLS INSERT policy (blocks direct PostgREST calls with fake WPM)
DROP POLICY IF EXISTS "Allow insert scores" ON public.scores;
DROP POLICY IF EXISTS "authenticated insert own scores" ON public.scores;

CREATE POLICY "Allow insert scores" ON public.scores
  FOR INSERT WITH CHECK (
    wpm >= 1 AND wpm <= 350
    AND accuracy >= 0 AND accuracy <= 100
    AND char_length(trim(player_name)) BETWEEN 2 AND 24
    AND (created_at IS NULL OR created_at BETWEEN (now() - interval '5 minutes') AND (now() + interval '5 minutes'))
  );
