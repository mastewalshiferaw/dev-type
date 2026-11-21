import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireUser } from '@/lib/auth/server';
import { isLanguageId } from '@/lib/languages';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import type { LeaderboardEntry, ScoreLanguage } from '@/lib/leaderboard/types';

const ALLOWED_MODES = new Set([
  'time-15',
  'time-30',
  'time-60',
  'time-120',
  'lines-10',
  'lines-25',
  'lines-50',
  'zen',
  'custom',
]);

const MAX_HUMAN_WPM = 280;
const submittedRuns = new Set<string>();

export async function POST(request: Request) {
  try {
    // 1. Authenticate caller strictly via Supabase session
    const auth = await requireUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { error: 'Authentication required: Anonymous scores cannot be submitted to the ranked leaderboard.' },
        { status: 401 }
      );
    }

    const userId = auth.user.id;
    const ip = getClientIp(request);

    // 2. Rate limiting (per IP: 5 per 10s; per user: 1 per 10s, 30 per hour)
    const ipRapid = checkRateLimit(`score-rapid-ip:${ip}`, 5, 10 * 1000);
    if (!ipRapid.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: too many requests from this IP address.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const runId = typeof body?.runId === 'string' ? body.runId.trim() : '';

    // Replay prevention: check if runId already submitted
    if (runId) {
      const runKey = `${userId}:${runId}`;
      if (submittedRuns.has(runKey)) {
        return NextResponse.json(
          { error: 'Replay rejected: This run has already been recorded.' },
          { status: 409 }
        );
      }
    }

    // 2. Rate limiting (per user: 1 per 10s, 30 per hour)
    const userRapid = checkRateLimit(`score-rapid-u:${userId}`, 1, 10 * 1000);
    if (!userRapid.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: please wait 10 seconds between submissions.' },
        { status: 429 }
      );
    }

    const userHourly = checkRateLimit(`score-hourly-u:${userId}`, 30, 3600 * 1000);
    if (!userHourly.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: maximum 30 score submissions per hour.' },
        { status: 429 }
      );
    }

    const rawWpm = Number(body?.wpm);
    const rawAccuracy = Number(body?.accuracy);
    const rawLanguage = typeof body?.language === 'string' ? body.language.toLowerCase().trim() : 'mixed';
    const rawMode = typeof body?.modeKey === 'string' ? body.modeKey.trim() : 'time-30';

    // 3. Strict Server-Side Validation: WPM & Accuracy bounds
    if (isNaN(rawWpm) || rawWpm <= 0 || rawWpm > MAX_HUMAN_WPM) {
      return NextResponse.json(
        { error: `Score rejected: WPM must be between 1 and ${MAX_HUMAN_WPM}.` },
        { status: 400 }
      );
    }

    if (isNaN(rawAccuracy) || rawAccuracy < 0 || rawAccuracy > 100) {
      return NextResponse.json(
        { error: 'Score rejected: Accuracy must be between 0% and 100%.' },
        { status: 400 }
      );
    }

    // Allowlist check: modeKey & language
    const modeKey = ALLOWED_MODES.has(rawMode) ? rawMode : 'time-30';
    const language: ScoreLanguage = (
      isLanguageId(rawLanguage) ? rawLanguage : 'mixed'
    ) as ScoreLanguage;

    // 4. Raw Run Telemetry Verification (if provided)
    const durationMs = Number(body?.durationMs);
    const correctChars = Number(body?.correctChars);
    const incorrectChars = Number(body?.incorrectChars);

    let cleanWpm = Math.min(MAX_HUMAN_WPM, Math.max(1, Math.round(rawWpm)));
    let cleanAccuracy = Math.min(100, Math.max(0, Number(rawAccuracy.toFixed(2))));

    if (!isNaN(durationMs) && !isNaN(correctChars) && durationMs > 500) {
      // Keystroke frequency sanity check (max 25 chars/second = ~300 WPM)
      const charsPerSec = correctChars / (durationMs / 1000);
      if (charsPerSec > 25) {
        return NextResponse.json(
          { error: 'Score rejected: Telemetry indicates superhuman character entry speed.' },
          { status: 400 }
        );
      }

      // Recompute WPM from telemetry
      const minutes = durationMs / 60000;
      const computedWpm = minutes > 0 ? Math.round(correctChars / 5 / minutes) : 0;
      if (Math.abs(computedWpm - cleanWpm) > 10) {
        cleanWpm = Math.min(MAX_HUMAN_WPM, Math.max(1, computedWpm));
      }

      // Recompute Accuracy from telemetry
      const totalChars = correctChars + (isNaN(incorrectChars) ? 0 : incorrectChars);
      if (totalChars > 0) {
        const computedAcc = Math.min(100, Math.max(0, Number(((correctChars / totalChars) * 100).toFixed(2))));
        if (Math.abs(computedAcc - cleanAccuracy) > 5) {
          cleanAccuracy = computedAcc;
        }
      }
    }

    // 5. Derive identity exclusively from authenticated user profile server-side
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    let profileName = auth.authUser.username;
    let avatarUrl: string | undefined = auth.authUser.avatarUrl;
    let telegram: string | undefined = auth.authUser.telegram;
    let telegramVerified = Boolean(auth.authUser.telegramVerified);

    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('username, avatar_url, telegram, telegram_verified')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        profileName = profile.username || profileName;
        avatarUrl = profile.avatar_url || avatarUrl;
        telegram = profile.telegram || telegram;
        telegramVerified = Boolean(profile.telegram_verified);
      }
    } catch (err) {
      logger.warn('[Scores API] Profile lookup fallback to session user', { err });
    }

    const cleanName = profileName.trim().slice(0, 24);
    // Ignore any client-supplied created_at; always server-generate server time
    const serverCreatedAt = new Date().toISOString();

    // 6. Check existing score for this user (upsert / update personal best)
    const { data: existingRows } = await supabaseAdmin
      .from('scores')
      .select('id, user_id, player_name, wpm, accuracy, language, mode, created_at, avatar_url, telegram')
      .eq('user_id', userId)
      .limit(1);

    let savedRow: {
      id: string;
      user_id?: string | null;
      player_name: string;
      avatar_url?: string | null;
      telegram?: string | null;
      telegram_verified?: boolean | null;
      wpm: number;
      accuracy: number;
      language: string | null;
      mode: string | null;
      created_at: string;
    };

    if (existingRows && existingRows.length > 0) {
      const existing = existingRows[0];
      const isBetter =
        cleanWpm > existing.wpm || (cleanWpm === existing.wpm && cleanAccuracy >= existing.accuracy);

      const updateData = isBetter
        ? {
            player_name: cleanName,
            wpm: cleanWpm,
            accuracy: cleanAccuracy,
            language,
            mode: modeKey,
            created_at: serverCreatedAt,
            avatar_url: avatarUrl || null,
            telegram: telegram || null,
          }
        : {
            player_name: cleanName,
            avatar_url: avatarUrl || null,
            telegram: telegram || null,
          };

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('scores')
        .update(updateData)
        .eq('id', existing.id)
        .select('id, user_id, player_name, wpm, accuracy, language, mode, created_at, avatar_url, telegram')
        .single();

      if (updateError || !updated) {
        logger.error('[Scores API] Update score failed', updateError);
        return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
      }

      savedRow = updated;
    } else {
      const insertData = {
        user_id: userId,
        player_name: cleanName,
        wpm: cleanWpm,
        accuracy: cleanAccuracy,
        language,
        mode: modeKey,
        created_at: serverCreatedAt,
        avatar_url: avatarUrl || null,
        telegram: telegram || null,
      };

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('scores')
        .insert(insertData)
        .select('id, user_id, player_name, wpm, accuracy, language, mode, created_at, avatar_url, telegram')
        .single();

      if (insertError || !inserted) {
        logger.error('[Scores API] Insert score failed', insertError);
        return NextResponse.json({ error: 'Failed to record score' }, { status: 500 });
      }

      savedRow = inserted;
    }

    // Track submitted runId to prevent replays
    if (runId) {
      submittedRuns.add(`${userId}:${runId}`);
      if (submittedRuns.size > 10_000) {
        const first = submittedRuns.values().next().value;
        if (first) submittedRuns.delete(first);
      }
    }

    const entry: LeaderboardEntry = {
      id: String(savedRow.id),
      userId: savedRow.user_id ?? undefined,
      username: savedRow.player_name,
      avatarUrl: savedRow.avatar_url ?? undefined,
      telegram: savedRow.telegram ?? undefined,
      telegramVerified,
      wpm: Math.round(savedRow.wpm),
      accuracy: Number(savedRow.accuracy),
      language: (isLanguageId(savedRow.language?.toLowerCase())
        ? savedRow.language!.toLowerCase()
        : 'mixed') as ScoreLanguage,
      modeKey: savedRow.mode ?? 'time-30',
      createdAt: savedRow.created_at,
    };

    return NextResponse.json({ success: true, entry });
  } catch (err) {
    logger.error('[Scores API] Unexpected error', err);
    return NextResponse.json({ error: 'Internal server error while processing score' }, { status: 500 });
  }
}
