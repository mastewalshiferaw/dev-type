'use client';

import React from 'react';
import { Trophy, Flame } from 'lucide-react';

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

export default function SidebarLeaderboard({ topToday, allTime }: Props) {
  return (
    <aside className="w-80 h-full border-l border-zinc-800 bg-zinc-950 p-6 flex flex-col gap-8 font-mono text-zinc-300">
      {/* Top 5 Today */}
      <div>
        <div className="flex items-center gap-2 mb-4 text-amber-400 font-semibold text-xs tracking-wider uppercase">
          <Flame size={16} />
          <span>Top 5 Today</span>
        </div>
        <div className="space-y-3">
          {topToday.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">No runs yet today</p>
          ) : (
            topToday.slice(0, 5).map((score, i) => (
              <div key={score.id} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 truncate">
                  <span className="text-zinc-500 text-xs w-4">{i + 1}.</span>
                  <span className="text-zinc-200 truncate">{score.player_name}</span>
                </span>
                <span className="font-bold text-amber-400">{score.wpm} <span className="text-[10px] text-zinc-500">WPM</span></span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* All-Time Legends */}
      <div>
        <div className="flex items-center gap-2 mb-4 text-purple-400 font-semibold text-xs tracking-wider uppercase">
          <Trophy size={16} />
          <span>All-Time Legends</span>
        </div>
        <div className="space-y-3">
          {allTime.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">No legends recorded</p>
          ) : (
            allTime.slice(0, 5).map((score, i) => (
              <div key={score.id} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 truncate">
                  <span className="text-zinc-500 text-xs w-4">{i + 1}.</span>
                  <span className="text-zinc-200 truncate">{score.player_name}</span>
                </span>
                <span className="font-bold text-purple-400">{score.wpm} <span className="text-[10px] text-zinc-500">WPM</span></span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}