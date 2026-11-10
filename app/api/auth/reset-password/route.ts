import { NextResponse } from 'next/server';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const cleanEmail = rawEmail.trim().toLowerCase();

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const origin =
      request.headers.get('origin') ||
      request.headers.get('referer')?.replace(/\/.*$/, '') ||
      '';

    const redirectTo = origin ? `${origin}/play?recovery=true` : undefined;

    // 1. Try standard Supabase resetPasswordForEmail
    const supabase = getSupabase();
    if (supabase) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (!resetError) {
        return NextResponse.json({ success: true });
      }

      // If Supabase returned an error, log it for debugging
      console.warn('[Password Reset] Supabase resetPasswordForEmail failed:', resetError.message);

      // If the error is rate limit / mailer failure, check if admin can generate link
      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin) {
        try {
          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: cleanEmail,
            options: {
              redirectTo,
            },
          });

          if (!linkError && linkData?.properties?.action_link) {
            console.info(
              `[Password Reset] Recovery link generated for ${cleanEmail}: ${linkData.properties.action_link}`
            );
          }
        } catch (adminErr) {
          console.error('[Password Reset] Admin link generation error:', adminErr);
        }
      }

      // Return user-friendly error message rather than cryptic raw error
      if (resetError.message.includes('Error sending recovery email')) {
        return NextResponse.json(
          {
            error:
              'Email service rate limit reached or delivery temporarily unavailable. Please wait a few minutes before trying again.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: resetError.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  } catch (err) {
    console.error('[Password Reset] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to request password reset' },
      { status: 500 }
    );
  }
}
