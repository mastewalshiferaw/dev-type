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
  const [completedStats, setCompletedStats] = useState<{ wpm: number; accuracy: number } | null>(null);

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
    fetchLeaderboards();
  };

  return (
    <main className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Center Typing Area */}
      <div className="flex-1 flex flex-col justify-between p-8">
        <header className="flex items-center gap-2 text-zinc-400">
          <Terminal className="text-amber-400" size={20} />
          <span className="font-mono font-bold tracking-wider text-sm">DEV_TYPE</span>
        </header>

        <div className="flex justify-center items-center">
          <TypingArena onFinish={(wpm, accuracy) => setCompletedStats({ wpm, accuracy })} />
        </div>

        <footer className="text-center text-xs font-mono text-zinc-600">
          Press Tab to restart • Mixed Syntax (JS, Python, Rust, C++)
        </footer>
      </div>

      {/* Right Sidebar Leaderboard */}
      <SidebarLeaderboard topToday={topToday} allTime={allTime} />

      {/* Score Result Modal */}
      {completedStats && (
        <ResultModal
          wpm={completedStats.wpm}
          accuracy={completedStats.accuracy}
          onSubmit={handleScoreSubmit}
          onDiscard={() => setCompletedStats(null)}
        />
      )}
    </main>
  );
}