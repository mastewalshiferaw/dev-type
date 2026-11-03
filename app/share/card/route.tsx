import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { CARD_SIZE, cardLabels, parseShareParams } from '@/lib/share';
import { SITE } from '@/lib/site';

// Same palette as app/opengraph-image.tsx
const COLORS = {
  bg: '#09090b',
  panel: '#18181b',
  line: '#27272a',
  ink: '#f4f4f5',
  muted: '#9a9aa4',
  accent: '#fbbf24',
  success: '#34d399',
};

export function GET(request: NextRequest) {
  const card = parseShareParams(request.nextUrl.searchParams);
  if (!card) return new Response('Invalid card', { status: 400 });

  const { language, mode } = cardLabels(card);
  const host = SITE.url.replace(/^https?:\/\//, '');

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '56px 72px',
        background: COLORS.bg,
        color: COLORS.ink,
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 34, color: '#d4d4d8' }}>
          <span style={{ color: COLORS.accent, fontSize: 44 }}>&gt;_</span>
          DEV_TYPE
        </div>
        <div
          style={{
            display: 'flex',
            padding: '10px 22px',
            borderRadius: 999,
            border: `2px solid ${COLORS.accent}`,
            color: COLORS.accent,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          {card.gain ? `NEW PERSONAL BEST  +${card.gain}` : 'PERSONAL BEST'}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', fontSize: 220, fontWeight: 700, lineHeight: 1, color: COLORS.accent }}>
          {card.wpm}
        </div>
        <div style={{ display: 'flex', marginTop: 4, fontSize: 40, letterSpacing: 12, color: COLORS.muted }}>
          WPM
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 36, fontSize: 36 }}>
          <span style={{ color: COLORS.success, fontWeight: 700 }}>{card.accuracy}% acc</span>
          <span style={{ color: COLORS.muted }}>·</span>
          <span>{language}</span>
          <span style={{ color: COLORS.muted }}>·</span>
          <span>{mode}</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 24,
          borderTop: `2px solid ${COLORS.line}`,
          fontSize: 28,
        }}
      >
        <span style={{ color: COLORS.ink, fontWeight: 700 }}>{card.username ? `@${card.username}` : ''}</span>
        <span style={{ color: COLORS.muted }}>{host}</span>
      </div>
    </div>,
    {
      ...CARD_SIZE,
      // Cards never change for the same URL
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    }
  );
}
