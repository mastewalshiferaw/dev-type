'use client';

import React, { useEffect, useState, useCallback } from 'react';
import TypingArena from '@/components/TypingArena';
import SidebarLeaderboard, { ScoreItem } from '@/components/SidebarLeaderboard';
import ResultModal from '@/components/ResultModal';
import { supabase } from '@/lib/supabase';
import { Terminal } from 'lucide-react';

export default function Home() {
  const [topToday, setTopToday] = useState<ScoreItem[]>([]);
  const [allTime, setAllTime] = useState<ScoreItem[]>([]);
  const [completedStats, setCompletedStats] = useState<{
    wpm: number;
    accuracy: number;
    errors: number;
  } | null>(null);
  const [restartToken, setRestartToken] = useState(0);

  const fetchLeaderboards = useCallback(async () => {
    // 1. Fetch All-Time Top 5
    const { data: globalData } = await supabase
      .from('scores')
      .select('id, player_name, wpm, accuracy')
      .order('wpm', { ascending: false })
      .limit(5);

    if (globalData) setAllTime(globalData);

    // 2. Fetch Top 5 in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: todayData } = await supabase
      .from('scores')
      .select('id, player_name, wpm, accuracy')
      .gte('created_at', oneDayAgo)
      .order('wpm', { ascending: false })
      .limit(5);

    if (todayData) setTopToday(todayData);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    fetchLeaderboards();
  }, [fetchLeaderboards]);

  const handleScoreSubmit = async (playerName: string) => {
    if (!completedStats) return;

    // 1. Submit to Supabase
    await supabase.from('scores').insert([
      {
        player_name: playerName,
        wpm: completedStats.wpm,
        accuracy: completedStats.accuracy,
      },
    ]);

    // 2. Save to local storage for the "You" row at the bottom of the card
    localStorage.setItem(
      'devtype_user',
      JSON.stringify({ name: playerName, wpm: completedStats.wpm })
    );

    setCompletedStats(null);
    setRestartToken((t) => t + 1);
    fetchLeaderboards();
  };

  const handleRestart = () => {
    setCompletedStats(null);
    setRestartToken((t) => t + 1);
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-8">
        <header>
          <h1 className="flex items-center gap-2 text-sm font-bold tracking-wider text-ink-dim">
            <Terminal className="text-accent" size={20} aria-hidden />
            DEV_TYPE
          </h1>
        </header>

        {/* Top-aligned so the filter bar never moves when the snippet height changes */}
        <main className="flex flex-1 flex-col items-center pt-[clamp(0rem,6vh,4rem)]">
          <TypingArena
            restartToken={restartToken}
            onFinish={(wpm, accuracy, errors) => setCompletedStats({ wpm, accuracy, errors })}
          />
        </main>

        <footer className="text-center text-xs text-muted">
          Press{' '}
          <kbd className="rounded-sm border border-line-strong px-1.5 py-0.5 text-2xs">Tab</kbd> to restart
          {' • '}Mixed Syntax (JS, Python, Rust, C++)
        </footer>
      </div>

      <SidebarLeaderboard topToday={topToday} allTime={allTime} />

      {completedStats && (
        <ResultModal
          wpm={completedStats.wpm}
          accuracy={completedStats.accuracy}
          errors={completedStats.errors}
          onSubmit={handleScoreSubmit}
          onDiscard={() => setCompletedStats(null)}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
