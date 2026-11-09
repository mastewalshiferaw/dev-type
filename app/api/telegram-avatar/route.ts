import { NextResponse } from 'next/server';
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

      if (!res.ok) {
        clearTimeout(timeout);
        return NextResponse.json(
          { success: false, channel, avatarUrl: null, error: `Telegram returned status ${res.status}` },
          { status: 200 }
        );
      }

      html = await res.text();
    } catch (err: unknown) {
      clearTimeout(timeout);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      return NextResponse.json(
        {
          success: false,
          channel,
          avatarUrl: null,
          error: isAbort ? 'Telegram lookup timed out' : 'Failed to reach Telegram',
        },
        { status: 200 }
      );
    } finally {
      clearTimeout(timeout);
    }

    // Extract photo from class="tgme_page_photo_image" src="..."
    const photoMatch = html.match(/class="tgme_page_photo_image"\s+src="([^"]+)"/i);
    // Or from og:image
    const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    // Extract title
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);

    let avatarUrl: string | null = null;

    if (photoMatch && photoMatch[1]) {
      avatarUrl = photoMatch[1];
    } else if (ogMatch && ogMatch[1]) {
      const candidate = ogMatch[1];
      // Filter out default telegram logo fallback
      const isFallbackLogo =
        candidate.includes('/img/t_logo') || candidate.includes('t_logo.png') || candidate.endsWith('/t_logo_2x.png');
      if (!isFallbackLogo) {
        avatarUrl = candidate;
      }
    }

    // Decode HTML entities if any
    if (avatarUrl) {
      avatarUrl = avatarUrl.replace(/&amp;/g, '&');
    }

    const title = titleMatch && titleMatch[1] ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'") : null;

    return NextResponse.json(
      {
        success: true,
        channel,
        avatarUrl,
        title,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, avatarUrl: null, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
