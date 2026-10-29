'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Crown, Star, ChevronRight, Terminal } from 'lucide-react';

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

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-emerald-600',
    'bg-cyan-600',
    'bg-violet-600',
    'bg-amber-600',
    'bg-rose-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function SidebarLeaderboard({ topToday, allTime }: Props) {
  const [tab, setTab] = useState<'today' | 'allTime'>('today');
  const [currentUser, setCurrentUser] = useState<{ name: string; wpm: number } | null>(null);

  const activeList = tab === 'today' ? topToday : allTime;

  useEffect(() => {
    const saved = localStorage.getItem('devtype_user');
    if (saved) {
      try {
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
    <aside className="w-80 h-full p-6 flex flex-col justify-start select-none font-mono">
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col backdrop-blur-md">
        
        {/* Customized Header */}
        <button
          onClick={() => setTab(tab === 'today' ? 'allTime' : 'today')}
          className="flex items-center justify-between group mb-5 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              {tab === 'today' ? <Zap size={18} /> : <Trophy size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition">
                {tab === 'today' ? 'Fastest Coders Today' : 'All-Time Hall of Fame'}
              </h3>
              <p className="text-[11px] text-zinc-500">
                {tab === 'today' ? 'Live Sprint (24h)' : 'Compiler Legends'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 transition" />
        </button>

        {/* Rankings */}
        <div className="space-y-3.5 flex-1">
          {activeList.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-600 italic">
              No speeds submitted yet.
              <br />
              Claim rank #1!
            </div>
          ) : (
            activeList.slice(0, 5).map((player, index) => {
              const rank = index + 1;
              const initials = player.player_name.replace('@', '').slice(0, 2).toUpperCase();

              return (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 flex justify-center items-center">
                      {rank === 1 && <Crown size={18} className="text-amber-400 fill-amber-400/20" />}
                      {rank === 2 && <Trophy size={16} className="text-zinc-300 fill-zinc-300/20" />}
                      {rank === 3 && <Star size={16} className="text-amber-600 fill-amber-600/20" />}
                      {rank > 3 && <span className="text-xs text-zinc-500 font-semibold">{rank}</span>}
                    </div>

                    <div
                      className={`w-8 h-8 rounded-full ${getAvatarColor(
                        player.player_name
                      )} flex items-center justify-center text-zinc-100 font-bold text-xs shrink-0`}
                    >
                      {initials}
                    </div>

                    <span className="text-sm font-medium text-zinc-200 truncate font-sans">
                      {player.player_name}
                    </span>
                  </div>

                  <div className="text-right pl-2">
                    <span className="text-sm font-bold text-zinc-200">{player.wpm}</span>
                    <span className="text-[10px] text-zinc-500 ml-1">WPM</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* You Status Row */}
        <div className="mt-5 pt-3 border-t border-zinc-800">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs text-zinc-500 pl-1">
                {userRank > 0 ? `#${userRank}` : '—'}
              </span>
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Terminal size={14} />
              </div>
              <span className="text-xs font-semibold text-zinc-200 truncate font-sans">
                {currentUser ? currentUser.name : 'You'}
              </span>
            </div>

            <div className="text-right pr-1">
              <span className="text-xs font-bold text-amber-400">
                {currentUser ? `${currentUser.wpm} WPM` : 'Unranked'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}