'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/command/CommandPalette';
import SettingsDrawer, { type SettingsSection } from '@/components/settings/SettingsDrawer';
import { useProfile } from '@/lib/profile';
import { useDuelRoom } from '@/lib/duel/duel-channel';
import { generateRoomCode } from '@/lib/duel/snippet';
import DuelLobby from './DuelLobby';
import DuelArena from './DuelArena';
import DuelResults from './DuelResults';

export default function DuelView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRoom = searchParams.get('room');

  // Generate or sanitize room code
  const [roomId, setRoomId] = useState<string>(() => {
    return rawRoom ? rawRoom.toUpperCase().trim() : generateRoomCode();
  });

  useEffect(() => {
    if (!rawRoom) {
      // Sync URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      window.history.replaceState({}, '', url.toString());
    } else if (rawRoom.toUpperCase() !== roomId) {
      setRoomId(rawRoom.toUpperCase().trim());
    }
  }, [rawRoom, roomId]);

  const profile = useProfile();

  // Stable local user ID for session
  const [userId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('devtype:duel_user_id');
      if (stored) return stored;
      const created = crypto.randomUUID();
      sessionStorage.setItem('devtype:duel_user_id', created);
      return created;
    }
    return 'local-user';
  });

  const localUser = useMemo(() => {
    const name = profile.username.trim() || `Dev_${userId.slice(0, 4)}`;
    return {
      id: userId,
      username: name,
      avatarUrl: profile.avatarUrl,
    };
  }, [profile.username, profile.avatarUrl, userId]);

  const {
    players,
    phase,
    countdown,
    snippet,
    language,
    winnerId,
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
  } = useDuelRoom({ roomId, user: localUser });

  const localPlayer = players[localUser.id] || {
    id: localUser.id,
    username: localUser.username,
    avatarUrl: localUser.avatarUrl,
    isHost: true,
    committed: false,
    joinedAt: Date.now(),
    progress: 0,
    cursor: 0,
    wpm: 0,
    errors: 0,
    finished: false,
  };

  const opponent = Object.values(players).find((p) => p.id !== localUser.id) || null;

  // Header and palettes
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6">
        <Header
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenSettings={() => {
            setSettingsSection(undefined);
            setSettingsOpen(true);
          }}
          profileOpen={profileOpen}
          onProfileOpenChange={setProfileOpen}
        />

        <main className="flex flex-1 flex-col justify-center py-6">
          {phase === 'lobby' || phase === 'countdown' ? (
            <DuelLobby
              roomId={roomId}
              localPlayer={localPlayer}
              opponent={opponent}
              language={language}
              isHost={isHost}
              botActive={botActive}
              botWpm={botWpm}
              countdown={countdown}
              phase={phase}
              onToggleCommit={toggleCommit}
              onChangeLanguage={changeLanguage}
              onToggleBot={toggleBot}
              onSetBotWpm={setBotWpm}
            />
          ) : phase === 'racing' ? (
            <DuelArena
              snippet={snippet}
              localPlayer={localPlayer}
              opponent={opponent}
              onReportProgress={reportProgress}
              onReportFinish={reportFinish}
            />
          ) : (
            <DuelResults
              localPlayer={localPlayer}
              opponent={opponent}
              winnerId={winnerId}
              onRematch={rematch}
            />
          )}
        </main>

        <Footer />
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onRestart={() => {}}
        onNext={() => {}}
        onOpenSettings={() => {
          setSettingsSection(undefined);
          setSettingsOpen(true);
        }}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} section={settingsSection} />
    </div>
  );
}
