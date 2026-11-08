-- ==============================================================================
-- Migration: Deduplicate Scores and Enforce Single Score Per Player (Upsert)
-- ==============================================================================
-- 1. Cleans up existing duplicate scores (keeps each player's personal best)
-- 2. Enforces UNIQUE(player_name) constraint so duplicate entries can never exist
-- 3. Adds Row-Level Security (RLS) UPDATE policy so scores can be updated in place
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PURGE DUPLICATES (Keep highest WPM per player_name, breaking ties with accuracy and date)
-- ------------------------------------------------------------------------------
DELETE FROM public.scores
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(TRIM(player_name))) id
  FROM public.scores
  ORDER BY LOWER(TRIM(player_name)), wpm DESC, accuracy DESC, created_at DESC
);

-- Also ensure no duplicate rows exist for the same authenticated user account
DELETE FROM public.scores
WHERE user_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.scores
    WHERE user_id IS NOT NULL
    ORDER BY user_id, wpm DESC, accuracy DESC, created_at DESC
  );

-- ------------------------------------------------------------------------------
-- 2. UNIQUE CONSTRAINTS
-- ------------------------------------------------------------------------------

-- Ensure player_name is unique so a player only has one row in public.scores
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_player_name_key;
ALTER TABLE public.scores ADD CONSTRAINT scores_player_name_key UNIQUE (player_name);

-- Ensure authenticated users can only have one row
CREATE UNIQUE INDEX IF NOT EXISTS scores_user_id_unique ON public.scores (user_id) WHERE user_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. ROW-LEVEL SECURITY (RLS): ALLOW UPDATES
-- ------------------------------------------------------------------------------

-- Allow users and guests to update their own row when submitting improved scores
DROP POLICY IF EXISTS "Allow update own scores" ON public.scores;
DROP POLICY IF EXISTS "Allow update scores" ON public.scores;

CREATE POLICY "Allow update own scores" ON public.scores
  FOR UPDATE
  USING (
    -- Authenticated users can update their own row (or claim a matching guest row)
    (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
    -- Guests can update unassigned guest rows
    OR (auth.uid() IS NULL AND user_id IS NULL)
  )
  WITH CHECK (
    wpm >= 1 AND wpm <= 350
    AND accuracy >= 0 AND accuracy <= 100
    AND char_length(trim(player_name)) BETWEEN 2 AND 24
    AND (
      (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
      OR (auth.uid() IS NULL AND user_id IS NULL)
    )
  );
