import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cleanTelegramChannel, getTelegramVerificationCode } from '@/lib/telegram';
import { generateLetterAvatarSvg, initials } from '@/lib/avatar';

const TG_CHANNEL_PATTERN = /^[a-zA-Z0-9_]{4,32}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawChannel = typeof body?.channel === 'string' ? body.channel : '';
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';

    const channel = cleanTelegramChannel(rawChannel);

    if (!channel || !TG_CHANNEL_PATTERN.test(channel)) {
      return NextResponse.json(
        { success: false, error: 'Channel must be 4-32 alphanumeric characters or underscores' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to verify channel ownership' },
        { status: 401 }
      );
    }

    const expectedCode = getTelegramVerificationCode(userId);
    if (!code || code.toLowerCase() !== expectedCode.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: `Invalid verification code. Expected "${expectedCode}".` },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Ensure channel is not already claimed by another user
    if (supabaseAdmin) {
      try {
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id, username')
          .ilike('telegram', channel)
          .neq('id', userId)
          .limit(1);

        if (existing && existing.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Channel @${channel} is already claimed and verified by user "${existing[0].username}".`,
            },
            { status: 409 }
          );
        }
      } catch (err) {
        console.warn('[Telegram Verify] Check existing channel failed:', err);
      }
    }

    // 2. Fetch public channel feed (https://t.me/s/<channel>) and channel info (https://t.me/<channel>)
    const feedUrl = `https://t.me/s/${channel}`;
    const infoUrl = `https://t.me/${channel}`;

    let foundInFeed = false;
    let customPhotoUrl: string | null = null;
    let title: string | null = null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const [feedRes, infoRes] = await Promise.allSettled([
        fetch(feedUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        }),
        fetch(infoUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        }),
      ]);

      let combinedHtml = '';

      if (feedRes.status === 'fulfilled' && feedRes.value.ok) {
        const feedHtml = await feedRes.value.text();
        combinedHtml += ' ' + feedHtml;
      }

      if (infoRes.status === 'fulfilled' && infoRes.value.ok) {
        const infoHtml = await infoRes.value.text();
        combinedHtml += ' ' + infoHtml;

        // Extract photo from class="tgme_page_photo_image" or og:image
        const photoMatch = infoHtml.match(/class="tgme_page_photo_image"\s+src="([^"]+)"/i);
        const ogMatch = infoHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        const titleMatch = infoHtml.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);

        if (photoMatch && photoMatch[1]) {
          customPhotoUrl = photoMatch[1];
        } else if (ogMatch && ogMatch[1]) {
          const candidate = ogMatch[1];
          if (!candidate.includes('/img/t_logo') && !candidate.includes('t_logo.png')) {
            customPhotoUrl = candidate;
          }
        }

        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
        }
      }

      // Case-insensitive check for the verification code in posts or bio
      if (combinedHtml.toLowerCase().includes(expectedCode.toLowerCase())) {
        foundInFeed = true;
      }
    } catch (fetchErr) {
      console.warn('[Telegram Verify] Channel fetch error:', fetchErr);
    } finally {
      clearTimeout(timeout);
    }

    if (!foundInFeed) {
      return NextResponse.json(
        {
          success: false,
          error: `Verification code "${expectedCode}" was not found in recent posts of @${channel}. Please publish a post containing "${expectedCode}" in the channel and click Verify again.`,
        },
        { status: 400 }
      );
    }

    // Channel verified! Build avatar URL
    if (customPhotoUrl) {
      customPhotoUrl = customPhotoUrl.replace(/&amp;/g, '&');
    }
    const channelLetters = initials(title || channel);
    const finalAvatarUrl = customPhotoUrl || generateLetterAvatarSvg(channelLetters, channel);

    // 3. Persist verified channel to Supabase
    if (supabaseAdmin) {
      try {
        // Update user metadata in Supabase Auth
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userData?.user) {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...userData.user.user_metadata,
              telegram: channel,
              telegram_verified: true,
              avatar_url: finalAvatarUrl,
            },
          });
        }

        // Update profiles table
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          telegram: channel,
          avatar_url: finalAvatarUrl,
        });

        // Update scores table
        await supabaseAdmin
          .from('scores')
          .update({
            telegram: channel,
            avatar_url: finalAvatarUrl,
          })
          .eq('user_id', userId);
      } catch (dbErr) {
        console.error('[Telegram Verify] Database persistence error:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      channel,
      avatarUrl: finalAvatarUrl,
      title: title || `@${channel}`,
    });
  } catch (err) {
    console.error('[Telegram Verify] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal verification error' },
      { status: 500 }
    );
  }
}
