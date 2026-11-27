'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import type { LanguageId } from '@/lib/languages';
import type { DuelBroadcastPayload, DuelPhase, DuelPlayer, DuelPlayerStats } from './types';
import { getDuelSnippet } from './snippet';

interface UseDuelRoomOptions {
  roomId: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export function useDuelRoom({ roomId, user }: UseDuelRoomOptions) {
  const [players, setPlayers] = useState<Record<string, DuelPlayer>>({});
  const [phase, setPhase] = useState<DuelPhase>('lobby');
  const [countdown, setCountdown] = useState(3);
  const [language, setLanguageState] = useState<LanguageId>('typescript');
  const [snippet, setSnippetState] = useState<string>('');
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [botActive, setBotActive] = useState(false);
  const [botWpm, setBotWpm] = useState(65);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef({
    players,
    phase,
    snippet,
    language,
    winnerId,
    botActive,
    botWpm,
  });

  useEffect(() => {
    stateRef.current = {
      players,
      phase,
      snippet,
      language,
      winnerId,
      botActive,
      botWpm,
    };
  });

  const isHost = Boolean(
    players[user.id]?.isHost ||
    Object.values(players).length === 1 ||
    (players[user.id] &&
      Object.values(players).every(
        (p) => p.id === user.id || p.joinedAt >= (players[user.id]?.joinedAt ?? 0)
      ))
  );

  // Unified emitter across Supabase Realtime + local BroadcastChannel
  const emit = useCallback(
    (type: DuelBroadcastPayload['type'], data?: unknown) => {
      const payload: DuelBroadcastPayload = {
        playerId: user.id,
        timestamp: Date.now(),
        type,
        data,
      };

      // 1. Send via local BroadcastChannel (instant for tabs)
      try {
        broadcastChannelRef.current?.postMessage(payload);
      } catch {
        // BroadcastChannel might not be supported or open
      }

      // 2. Send via Supabase Realtime channel
      try {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'duel_message',
            payload,
          });
        }
      } catch {
        // Ignored
      }
    },
    [user.id]
  );

  // Handle incoming payloads
  const handlePayload = useCallback(
    (payload: DuelBroadcastPayload) => {
      if (!payload || payload.playerId === user.id) return;

      switch (payload.type) {
        case 'presence_announce': {
          const incoming = payload.data as DuelPlayer;
          if (!incoming?.id) break;
          setPlayers((prev) => {
            const existing = prev[incoming.id];
            return {
              ...prev,
              [incoming.id]: {
                ...incoming,
                isHost: existing ? existing.isHost : false,
              },
            };
          });
          // If we are host, respond with current room config and our presence
          const local = stateRef.current.players[user.id];
          if (local) {
            emit('presence_announce', local);
            if (stateRef.current.snippet) {
              emit('config', {
                language: stateRef.current.language,
                snippet: stateRef.current.snippet,
              });
            }
          }
          break;
        }

        case 'commit': {
          const data = payload.data as { committed?: boolean } | undefined;
          const committed = data?.committed;
          setPlayers((prev) => {
            const target = prev[payload.playerId];
            if (!target) return prev;
            return {
              ...prev,
              [payload.playerId]: { ...target, committed: Boolean(committed) },
            };
          });
          break;
        }

        case 'config': {
          const data = payload.data as { language?: LanguageId; snippet?: string } | undefined;
          if (data?.language) setLanguageState(data.language);
          if (data?.snippet) setSnippetState(data.snippet);
          break;
        }

        case 'countdown': {
          const data = payload.data as
            { countdown?: number; snippet?: string; language?: LanguageId } | undefined;
          if (data?.snippet) setSnippetState(data.snippet);
          if (data?.language) setLanguageState(data.language);
          setPhase('countdown');
          setCountdown(data?.countdown ?? 3);
          break;
        }

        case 'progress': {
          const data = payload.data as
            { cursor?: number; progress?: number; wpm?: number; errors?: number } | undefined;
          const { cursor, progress, wpm, errors } = data || {};
          setPlayers((prev) => {
            const target = prev[payload.playerId];
            if (!target) return prev;
            return {
              ...prev,
              [payload.playerId]: {
                ...target,
                cursor: cursor ?? target.cursor,
                progress: progress ?? target.progress,
                wpm: wpm ?? target.wpm,
                errors: errors ?? target.errors,
              },
            };
          });
          break;
        }

        case 'finish': {
          const data = payload.data as { stats?: DuelPlayerStats } | undefined;
          const stats = data?.stats;
          const finishedAt = payload.timestamp;
          setPlayers((prev) => {
            const target = prev[payload.playerId];
            if (!target) return prev;
            return {
              ...prev,
              [payload.playerId]: {
                ...target,
                finished: true,
                finishedAt,
                stats,
                progress: 1,
              },
            };
          });

          // First to finish is winner
          setWinnerId((current) => current ?? payload.playerId);
          break;
        }

        case 'rematch': {
          const data = payload.data as { snippet?: string } | undefined;
          if (data?.snippet) setSnippetState(data.snippet);
          setWinnerId(null);
          setPhase('lobby');
          setPlayers((prev) => {
            const updated = { ...prev };
            for (const pid of Object.keys(updated)) {
              updated[pid] = {
                ...updated[pid],
                committed: false,
                progress: 0,
                cursor: 0,
                wpm: 0,
                errors: 0,
                finished: false,
                finishedAt: undefined,
                stats: undefined,
              };
            }
            return updated;
          });
          break;
        }

        case 'leave': {
          setPlayers((prev) => {
            const next = { ...prev };
            delete next[payload.playerId];
            return next;
          });
          break;
        }
      }
    },
    [emit, user.id]
  );

  // Initialize room & connections
  useEffect(() => {
    if (!roomId) return;

    // Initialize local player
    const localPlayer: DuelPlayer = {
      id: user.id,
      username: user.username || 'Coder',
      avatarUrl: user.avatarUrl,
      isHost: true,
      committed: false,
      joinedAt: Date.now(),
      progress: 0,
      cursor: 0,
      wpm: 0,
      errors: 0,
      finished: false,
    };

    setPlayers({ [user.id]: localPlayer });

    // Host initial snippet
    const initialSnippet = getDuelSnippet(language);
    setSnippetState(initialSnippet);

    // 1. Setup BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(`devtype:duel:${roomId}`);
      broadcastChannelRef.current = bc;
      bc.onmessage = (event) => {
        handlePayload(event.data);
      };
    } catch {
      // not supported in some older environments
    }

    // 2. Setup Supabase Realtime
    const supabase = getSupabase();
    let channel: RealtimeChannel | null = null;

    if (supabase) {
      channel = supabase.channel(`duel:${roomId}`, {
        config: {
          presence: { key: user.id },
          broadcast: { ack: false, self: false },
        },
      });
      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel?.presenceState<{
            id: string;
            username: string;
            avatarUrl?: string;
            joinedAt: number;
          }>();
          if (presenceState) {
            setPlayers((prev) => {
              const updated = { ...prev };
              for (const key of Object.keys(presenceState)) {
                const presences = presenceState[key];
                if (presences && presences.length > 0) {
                  const p = presences[0];
                  if (!updated[p.id]) {
                    updated[p.id] = {
                      id: p.id,
                      username: p.username || 'Rival',
                      avatarUrl: p.avatarUrl,
                      isHost: false,
                      committed: false,
                      joinedAt: p.joinedAt || Date.now(),
                      progress: 0,
                      cursor: 0,
                      wpm: 0,
                      errors: 0,
                      finished: false,
                    };
                  }
                }
              }
              return updated;
            });
          }
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          if (newPresences && newPresences.length > 0) {
            const p = newPresences[0] as unknown as Partial<DuelPlayer>;
            if (p.id && p.id !== user.id) {
              setPlayers((prev) => ({
                ...prev,
                [p.id as string]: {
                  id: p.id as string,
                  username: p.username || 'Rival',
                  avatarUrl: p.avatarUrl,
                  isHost: false,
                  committed: false,
                  joinedAt: p.joinedAt || Date.now(),
                  progress: 0,
                  cursor: 0,
                  wpm: 0,
                  errors: 0,
                  finished: false,
                },
              }));
              // Notify newcomer of current room configuration
              if (stateRef.current.snippet) {
                emit('config', {
                  language: stateRef.current.language,
                  snippet: stateRef.current.snippet,
                });
              }
            }
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          if (leftPresences && leftPresences.length > 0) {
            const p = leftPresences[0] as unknown as Partial<DuelPlayer>;
            if (p.id) {
              setPlayers((prev) => {
                const next = { ...prev };
                delete next[p.id as string];
                return next;
              });
            }
          }
        })
        .on('broadcast', { event: 'duel_message' }, ({ payload }) => {
          handlePayload(payload);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
            await channel?.track({
              id: user.id,
              username: user.username,
              avatarUrl: user.avatarUrl,
              joinedAt: Date.now(),
            });
            // Announce presence via broadcast
            emit('presence_announce', localPlayer);
          }
        });
    } else {
      setConnected(true);
    }

    // Announce to any tab already listening
    emit('presence_announce', localPlayer);

    return () => {
      emit('leave');
      if (channel) {
        supabase?.removeChannel(channel);
      }
      if (bc) {
        bc.close();
      }
    };
  }, [roomId, user.id, user.username, user.avatarUrl, handlePayload, emit, language]);

  // Host detects when both players (or player + bot) are committed
  useEffect(() => {
    if (phase !== 'lobby') return;

    const playerList = Object.values(players);
    if (playerList.length >= 2 && playerList.every((p) => p.committed)) {
      // Both committed! Start countdown
      const freshSnippet = snippet || getDuelSnippet(language);
      setSnippetState(freshSnippet);
      setPhase('countdown');
      setCountdown(3);
      emit('countdown', { countdown: 3, snippet: freshSnippet, language });
    }
  }, [players, phase, snippet, language, emit]);

  // Countdown clock ticker
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase('racing');
    }
  }, [phase, countdown]);

  // Check if both players finished in racing phase
  useEffect(() => {
    if (phase !== 'racing') return;
    const playerList = Object.values(players);
    if (playerList.length > 0 && playerList.every((p) => p.finished)) {
      setPhase('finished');
    }
  }, [players, phase]);

  // Simulated GitBot behavior
  useEffect(() => {
    if (!botActive) {
      setPlayers((prev) => {
        const next = { ...prev };
        delete next['git-bot'];
        return next;
      });
      return;
    }

    // Add GitBot player
    const botPlayer: DuelPlayer = {
      id: 'git-bot',
      username: 'GitBot 🤖',
      avatarUrl:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      isHost: false,
      committed: false,
      isBot: true,
      joinedAt: Date.now(),
      progress: 0,
      cursor: 0,
      wpm: botWpm,
      errors: 0,
      finished: false,
    };

    setPlayers((prev) => ({ ...prev, 'git-bot': botPlayer }));

    // If human committed, GitBot commits after 400ms
    const human = players[user.id];
    if (human?.committed && phase === 'lobby') {
      const timer = setTimeout(() => {
        setPlayers((prev) => {
          if (!prev['git-bot']) return prev;
          return {
            ...prev,
            'git-bot': { ...prev['git-bot'], committed: true },
          };
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [botActive, players[user.id]?.committed, phase, botWpm, user.id]);

  // GitBot typing simulation during racing phase
  useEffect(() => {
    if (!botActive || phase !== 'racing') return;

    const textLength = snippet.length || 200;
    // Calculate typing interval based on target WPM (5 chars per word)
    const charsPerSec = (botWpm * 5) / 60;
    const intervalMs = Math.max(50, Math.floor(1000 / charsPerSec));

    const interval = setInterval(() => {
      setPlayers((prev) => {
        const bot = prev['git-bot'];
        if (!bot || bot.finished) return prev;

        const nextCursor = bot.cursor + 1;
        const nextProgress = Math.min(1, nextCursor / textLength);
        const finished = nextCursor >= textLength;

        if (finished) {
          const finishedAt = Date.now();
          setWinnerId((w) => w ?? 'git-bot');
          return {
            ...prev,
            'git-bot': {
              ...bot,
              cursor: textLength,
              progress: 1,
              finished: true,
              finishedAt,
              stats: {
                wpm: botWpm,
                raw: botWpm + 4,
                accuracy: 98,
                durationMs: Math.round((textLength / charsPerSec) * 1000),
              },
            },
          };
        }

        return {
          ...prev,
          'git-bot': {
            ...bot,
            cursor: nextCursor,
            progress: nextProgress,
            wpm: Math.round(botWpm + (Math.random() * 6 - 3)),
          },
        };
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [botActive, phase, snippet.length, botWpm]);

  // Actions
  const toggleCommit = useCallback(() => {
    const nextCommitted = !players[user.id]?.committed;
    setPlayers((prev) => {
      const me = prev[user.id];
      if (!me) return prev;
      return {
        ...prev,
        [user.id]: { ...me, committed: nextCommitted },
      };
    });
    emit('commit', { committed: nextCommitted });
  }, [emit, players, user.id]);

  const changeLanguage = useCallback(
    (lang: LanguageId) => {
      setLanguageState(lang);
      const newSnippet = getDuelSnippet(lang);
      setSnippetState(newSnippet);
      emit('config', { language: lang, snippet: newSnippet });
    },
    [emit]
  );

  const reportProgress = useCallback(
    (cursor: number, progress: number, wpm: number, errors: number) => {
      setPlayers((prev) => {
        const me = prev[user.id];
        if (!me) return prev;
        return {
          ...prev,
          [user.id]: { ...me, cursor, progress, wpm, errors },
        };
      });
      emit('progress', { cursor, progress, wpm, errors });
    },
    [emit, user.id]
  );

  const reportFinish = useCallback(
    (stats: DuelPlayerStats) => {
      const finishedAt = Date.now();
      setPlayers((prev) => {
        const me = prev[user.id];
        if (!me) return prev;
        return {
          ...prev,
          [user.id]: {
            ...me,
            finished: true,
            finishedAt,
            stats,
            progress: 1,
          },
        };
      });

      setWinnerId((current) => current ?? user.id);
      emit('finish', { stats });
    },
    [emit, user.id]
  );

  const rematch = useCallback(() => {
    const newSnippet = getDuelSnippet(language);
    setSnippetState(newSnippet);
    setWinnerId(null);
    setPhase('lobby');
    setPlayers((prev) => {
      const updated = { ...prev };
      for (const pid of Object.keys(updated)) {
        updated[pid] = {
          ...updated[pid],
          committed: false,
          progress: 0,
          cursor: 0,
          wpm: 0,
          errors: 0,
          finished: false,
          finishedAt: undefined,
          stats: undefined,
        };
      }
      return updated;
    });
    emit('rematch', { snippet: newSnippet });
  }, [emit, language]);

  const toggleBot = useCallback((active?: boolean, wpm?: number) => {
    setBotActive((current) => (active !== undefined ? active : !current));
    if (wpm) setBotWpm(wpm);
  }, []);

  return {
    players,
    phase,
    countdown,
    snippet,
    language,
    winnerId,
    connected,
    isHost,
    botActive,
    botWpm,
    toggleCommit,
    changeLanguage,
    reportProgress,
    reportFinish,
    rematch,
    toggleBot,
    setBotWpm,
  };
}
