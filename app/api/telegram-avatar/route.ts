import { NextResponse } from 'next/server';
import { generateLetterAvatarSvg, initials } from '@/lib/avatar';
import { cleanTelegramChannel, TG_CHANNEL_PATTERN } from '@/lib/telegram';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('channel') || searchParams.get('username') || '';
    const channel = cleanTelegramChannel(raw);

    if (!channel) {
      return NextResponse.json({ success: false, error: 'Channel handle is required' }, { status: 400 });
    }

    if (!TG_CHANNEL_PATTERN.test(channel)) {
      return NextResponse.json(
        { success: false, error: 'Channel must be 4-32 alphanumeric characters or underscores' },
        { status: 400 }
      );
    }

    // Fetch the public web preview page of the channel
    const tgUrl = `https://t.me/${channel}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let html = '';
    let fetchOk = false;
    try {
      const res = await fetch(tgUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (res.ok) {
        html = await res.text();
        fetchOk = true;
      }
    } catch {
      // Telegram lookup timed out or network error; gracefully fall back to letter avatar
    } finally {
      clearTimeout(timeout);
    }

    let customPhotoUrl: string | null = null;
    let title: string | null = null;

    if (fetchOk && html) {
      // Extract photo from class="tgme_page_photo_image" src="..."
      const photoMatch = html.match(/class="tgme_page_photo_image"\s+src="([^"]+)"/i);
      // Or from og:image
      const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
      // Extract title
      const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);

      if (photoMatch && photoMatch[1]) {
        customPhotoUrl = photoMatch[1];
      } else if (ogMatch && ogMatch[1]) {
        const candidate = ogMatch[1];
        // Filter out default telegram logo fallback
        const isFallbackLogo =
          candidate.includes('/img/t_logo') || candidate.includes('t_logo.png') || candidate.endsWith('/t_logo_2x.png');
        if (!isFallbackLogo) {
          customPhotoUrl = candidate;
        }
      }

      // Decode HTML entities if any
      if (customPhotoUrl) {
        customPhotoUrl = customPhotoUrl.replace(/&amp;/g, '&');
      }

      title = titleMatch && titleMatch[1] ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'") : null;
    }

    // If channel has no photo, compute 1 or 2 letter initials and generate a letter avatar
    const channelLetters = initials(title || channel);
    const hasCustomPhoto = Boolean(customPhotoUrl);
    const finalAvatarUrl = customPhotoUrl || generateLetterAvatarSvg(channelLetters, channel);

    return NextResponse.json(
      {
        success: true,
        channel,
        avatarUrl: finalAvatarUrl,
        title: title || `@${channel}`,
        hasCustomPhoto,
        initials: channelLetters,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    const raw = new URL(request.url).searchParams.get('channel') || '';
    const channel = cleanTelegramChannel(raw);
    const channelLetters = initials(channel);
    return NextResponse.json(
      {
        success: false,
        channel,
        avatarUrl: channel ? generateLetterAvatarSvg(channelLetters, channel) : null,
        hasCustomPhoto: false,
        initials: channelLetters,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
