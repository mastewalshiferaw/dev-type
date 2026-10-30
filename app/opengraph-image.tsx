import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 40, color: '#d4d4d8' }}>
        <span style={{ color: '#fbbf24', fontSize: 56 }}>&gt;_</span>
        DEV_TYPE
      </div>
      <div style={{ display: 'flex', marginTop: 40, fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
        Type code, not prose.
      </div>
      <div style={{ display: 'flex', marginTop: 24, fontSize: 32, color: '#9a9aa4' }}>
        Typing speed test for developers · 15 languages · live leaderboard
      </div>
      <div style={{ display: 'flex', marginTop: 56, fontSize: 34 }}>
        <span style={{ color: '#34d399' }}>const wpm = </span>
        <span style={{ color: '#fb7185', textDecoration: 'underline' }}>1</span>
        <span style={{ color: '#9a9aa4' }}>42;</span>
        <span style={{ width: 4, height: 40, marginLeft: 2, background: '#fbbf24' }} />
      </div>
    </div>,
    size
  );
}
