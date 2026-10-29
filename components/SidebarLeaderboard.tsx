'use client';

import React, { useId, useState } from 'react';
import { Trophy, Flame, ChevronDown, type LucideIcon } from 'lucide-react';

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

interface SectionProps {
  title: string;
  icon: LucideIcon;
  /** Tailwind text color class for the heading and WPM figures */
  tone: string;
  scores: ScoreItem[];
  emptyTitle: string;
  emptyHint: string;
}

function LeaderboardSection({ title, icon: Icon, tone, scores, emptyTitle, emptyHint }: SectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className={`label mb-3 flex items-center gap-2 ${tone}`}>
        <Icon size={14} aria-hidden />
        {title}
      </h2>

      {scores.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong px-4 py-4">
          <p className="text-xs text-ink-dim">{emptyTitle}</p>
          <p className="mt-1 text-xs text-muted">{emptyHint}</p>
        </div>
      ) : (
        <ol className="flex flex-col">
          {scores.slice(0, 5).map((score, i) => (
            <li
              key={score.id}
              className="flex items-center gap-3 rounded-md px-2 py-2 transition-ui hover:bg-surface"
            >
              <span className="w-4 text-xs tabular-nums text-muted">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink" title={score.player_name}>
                {score.player_name}
              </span>
              <span className="text-xs tabular-nums text-muted">{score.accuracy}%</span>
              <span className={`w-16 text-right text-sm font-bold tabular-nums ${tone}`}>
                {score.wpm} <span className="text-2xs font-normal text-muted">WPM</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function SidebarLeaderboard({ topToday, allTime }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <aside className="border-t border-line bg-canvas lg:sticky lg:top-0 lg:h-dvh lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:border-l">
      {/* Collapsible on small screens, always open on desktop */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="transition-ui flex h-12 w-full items-center justify-between px-4 text-muted hover:text-ink lg:hidden"
      >
        <span className="label flex items-center gap-2">
          <Trophy size={14} aria-hidden />
          Leaderboards
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`transition-ui ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div id={panelId} className={`${open ? 'flex' : 'hidden'} flex-col gap-8 p-6 pt-2 lg:flex lg:p-6`}>
        <LeaderboardSection
          title="Top 5 Today"
          icon={Flame}
          tone="text-accent"
          scores={topToday}
          emptyTitle="No runs yet today"
          emptyHint="Finish a run and claim your rank to take the top spot."
        />
        <LeaderboardSection
          title="All-Time Legends"
          icon={Trophy}
          tone="text-legend"
          scores={allTime}
          emptyTitle="No legends recorded"
          emptyHint="Set the first all-time score."
        />
      </div>
    </aside>
  );
}
