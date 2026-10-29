'use client';

import React, { useId, useState, useEffect } from 'react';
import { Zap, Trophy, Crown, Star, ChevronRight, ChevronDown, Terminal } from 'lucide-react';

export interface ScoreItem {
  id: string;
  player_name: string;
  wpm: number;
  accuracy: number;
}

interface Props {
  topToday: ScoreItem[];
  allTime: ScoreItem[];
}

// -700 shades keep white initials above the 4.5:1 AA contrast ratio
const AVATAR_COLORS = [
  'bg-emerald-700',
  'bg-cyan-700',
  'bg-violet-700',
  'bg-amber-700',
  'bg-rose-700',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

function RankMark({ rank }: { rank: number }) {
  return (
    <div className="flex w-5 shrink-0 items-center justify-center" aria-label={`Rank ${rank}`}>
      {rank === 1 && <Crown size={18} aria-hidden className="fill-accent/20 text-accent" />}
      {rank === 2 && <Trophy size={16} aria-hidden className="fill-ink-dim/20 text-ink-dim" />}
      {rank === 3 && <Star size={16} aria-hidden className="fill-amber-600/20 text-amber-500" />}
      {rank > 3 && <span className="text-xs font-semibold tabular-nums text-muted">{rank}</span>}
    </div>
  );
}

export default function SidebarLeaderboard({ topToday, allTime }: Props) {
  const [tab, setTab] = useState<'today' | 'allTime'>('today');
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; wpm: number } | null>(null);
  const panelId = useId();

  const activeList = tab === 'today' ? topToday : allTime;
  const nextTabLabel = tab === 'today' ? 'All-Time Hall of Fame' : 'Fastest Coders Today';

  // The "You" row lives in localStorage, which only exists in the browser
  useEffect(() => {
    const saved = localStorage.getItem('devtype_user');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [topToday, allTime]);

  const userRank = currentUser
    ? activeList.findIndex((item) => item.player_name.toLowerCase() === currentUser.name.toLowerCase()) + 1
    : 0;

  return (
    <aside className="lg:sticky lg:top-0 lg:h-dvh lg:w-80 lg:shrink-0 lg:overflow-y-auto">
      {/* Collapsible on small screens, always open on desktop */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="transition-ui flex h-12 w-full items-center justify-between border-t border-line px-4 text-muted hover:text-ink lg:hidden"
      >
        <span className="label flex items-center gap-2">
          <Trophy size={14} aria-hidden />
          Leaderboards
        </span>
        <ChevronDown size={16} aria-hidden className={`transition-ui ${open ? 'rotate-180' : ''}`} />
      </button>

      <div id={panelId} className={`${open ? 'block' : 'hidden'} p-4 pt-2 lg:block lg:p-6`}>
        <div className="flex w-full flex-col rounded-3xl border border-line bg-surface/90 p-5 shadow-panel backdrop-blur-md">
          {/* Header: switches between the two boards */}
          <button
            type="button"
            onClick={() => setTab(tab === 'today' ? 'allTime' : 'today')}
            aria-label={`Showing ${tab === 'today' ? 'fastest coders today' : 'all-time hall of fame'}. Switch to ${nextTabLabel}`}
            className="transition-ui group mb-5 flex items-center justify-between rounded-lg text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
                {tab === 'today' ? <Zap size={18} aria-hidden /> : <Trophy size={18} aria-hidden />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink transition-ui group-hover:text-accent">
                  {tab === 'today' ? 'Fastest Coders Today' : 'All-Time Hall of Fame'}
                </h2>
                <p className="text-2xs text-muted">
                  {tab === 'today' ? 'Live Sprint (24h)' : 'Compiler Legends'}
                </p>
              </div>
            </div>
            <ChevronRight size={18} aria-hidden className="transition-ui text-muted group-hover:text-ink" />
          </button>

          {/* Rankings */}
          <div aria-live="polite" className="flex-1">
            {activeList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center">
                <p className="text-xs text-ink-dim">No speeds submitted yet.</p>
                <p className="mt-1 text-xs text-muted">Claim rank #1!</p>
              </div>
            ) : (
              <ol className="flex flex-col gap-3.5">
                {activeList.slice(0, 5).map((player, index) => {
                  const initials = player.player_name.replace('@', '').slice(0, 2).toUpperCase();
                  return (
                    <li key={player.id} className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <RankMark rank={index + 1} />
                        <div
                          aria-hidden
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(player.player_name)}`}
                        >
                          {initials}
                        </div>
                        <span className="truncate text-sm font-medium text-ink" title={player.player_name}>
                          {player.player_name}
                        </span>
                      </div>
                      <div className="pl-2 text-right tabular-nums">
                        <span className="text-sm font-bold text-ink">{player.wpm}</span>
                        <span className="ml-1 text-2xs text-muted">WPM</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* You status row */}
          <div className="mt-5 border-t border-line pt-3">
            <div className="flex items-center justify-between rounded-2xl border border-line bg-canvas/70 p-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="pl-1 text-xs tabular-nums text-muted">{userRank > 0 ? `#${userRank}` : '—'}</span>
                <div aria-hidden className="flex size-7 items-center justify-center rounded-full bg-raised text-ink-dim">
                  <Terminal size={14} />
                </div>
                <span className="truncate text-xs font-semibold text-ink">
                  {currentUser ? currentUser.name : 'You'}
                </span>
              </div>
              <span className="pr-1 text-xs font-bold tabular-nums text-accent">
                {currentUser ? `${currentUser.wpm} WPM` : 'Unranked'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
