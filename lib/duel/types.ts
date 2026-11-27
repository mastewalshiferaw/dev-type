export interface DuelPlayerStats {
  wpm: number;
  raw: number;
  accuracy: number;
  durationMs: number;
}

export interface DuelPlayer {
  id: string;
  username: string;
  avatarUrl?: string;
  isHost: boolean;
  committed: boolean;
  joinedAt: number;
  isBot?: boolean;
  // Live in-race telemetry
  progress: number; // 0 to 1
  cursor: number;
  wpm: number;
  errors: number;
  // Race outcome
  finished: boolean;
  finishedAt?: number;
  stats?: DuelPlayerStats;
}

export type DuelPhase = 'lobby' | 'countdown' | 'racing' | 'finished';

export interface DuelBroadcastPayload {
  playerId: string;
  timestamp: number;
  type: 'presence_announce' | 'commit' | 'config' | 'countdown' | 'progress' | 'finish' | 'rematch' | 'leave';
  data?: unknown;
}
