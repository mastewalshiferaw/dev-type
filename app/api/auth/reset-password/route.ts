import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipRate = checkRateLimit(`reset-ip:${ip}`, 20, 15 * 60 * 1000);
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const cleanEmail = rawEmail.trim().toLowerCase();

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const emailRate = checkRateLimit(`reset-email:${cleanEmail}`, 3, 15 * 60 * 1000);
    if (!emailRate.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset attempts for this email. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const origin =
      request.headers.get('origin') ||
      request.headers.get('referer')?.replace(/\/.*$/, '') ||
      '';

    const redirectTo = origin ? `${origin}/play?recovery=true` : undefined;

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Authentication service temporarily unavailable' }, { status: 500 });
    }

    // Call standard Supabase resetPasswordForEmail: Supabase directly delivers the email.
    // Never generate an admin recovery link, never log tokens, never log recovery URLs.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (resetError) {
      // Log sanitized warning without leaking tokens, credentials, or email
      logger.warn('[Password Reset] Request dispatched with upstream note', { code: resetError.status });
    } else {
      logger.info('[Password Reset] Reset request processed successfully');
    }

    // Always return a generic success response to avoid account enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (err) {
    logger.error('[Password Reset] Unexpected error occurred', err);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
