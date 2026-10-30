'use client';

import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import CommandPalette from '@/components/command/CommandPalette';
import Leaderboard from '@/components/leaderboard/Leaderboard';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import ResultsPanel, { type RunResult } from '@/components/results/ResultsPanel';
import SettingsDrawer, { type SettingsSection } from '@/components/settings/SettingsDrawer';
import ConfigBar from '@/components/typing/ConfigBar';
import TypingArena from '@/components/typing/TypingArena';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useTypingRun, type RunInfo } from '@/hooks/useTypingRun';
import { computeStats, type EngineState } from '@/lib/engine';
import { bestKey, bestsStore, recordRun, type RunRecord } from '@/lib/history';
import { isRankedMode, modeKey, useSettings } from '@/lib/settings';
import { toggleTheme } from '@/lib/theme';

/** Runs shorter than this, or with almost nothing typed, are shown but not saved */
const MIN_SAVED_MS = 2000;
const MIN_SAVED_CHARS = 5;

export default function DevTypeApp() {
  const settings = useSettings();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [result, setResult] = useState<(RunResult & { runId: number }) | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleFinish = useCallback(
    (state: EngineState, run: RunInfo) => {
      const { correctChars, incorrectChars, ...stats } = computeStats(state, state.endedAt ?? Date.now());
      const record: RunRecord = {
        ...stats,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        language: run.language,
        modeKey: modeKey(settings),
      };
      const saved = stats.durationMs >= MIN_SAVED_MS && correctChars >= MIN_SAVED_CHARS;
      const outcome = saved
        ? recordRun(record)
        : {
            isPersonalBest: false,
            previousBest: bestsStore.get()[bestKey(record.language, record.modeKey)] ?? null,
          };
      setResult({
        ...outcome,
        record,
        samples: state.samples,
        correctChars,
        incorrectChars,
        saved,
        ranked: isRankedMode(settings.mode),
        runId: run.id,
      });
    },
    [settings]
  );

  const { state, run, dispatch, next, retry, finish, elapsedMs, liveWpm } = useTypingRun(
    settings,
    handleFinish
  );

  // Results belong to one run; a settings change starts a new run and hides them
  const visibleResult = result && run && result.runId === run.id ? result : null;

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, []);

  const goNext = useCallback(() => {
    setResult(null);
    next();
    focusInput();
  }, [next, focusInput]);

  const goRetry = useCallback(() => {
    setResult(null);
    retry();
    focusInput();
  }, [retry, focusInput]);

  const openSettings = useCallback((section?: SettingsSection) => {
    setSettingsSection(section);
    setSettingsOpen(true);
  }, []);

  useHotkeys([
    { code: 'KeyK', mod: true, handler: () => setPaletteOpen((open) => !open) },
    { code: 'KeyL', mod: true, shift: true, handler: toggleTheme },
    { code: 'Comma', mod: true, handler: () => openSettings() },
  ]);

  // "Press any key to focus": typing while nothing is focused jumps into the typing area
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const idle = !document.activeElement || document.activeElement === document.body;
      if (!idle || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length === 1 || event.key === 'Enter') inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#typing"
        className="sr-only z-50 rounded-md bg-accent-fill px-3 py-2 text-sm font-bold text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to typing test
      </a>
      <div className="mx-auto flex min-h-dvh w-full max-w-[110rem] flex-col gap-8 p-4 sm:p-8 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Header
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenSettings={() => openSettings()}
            profileOpen={profileOpen}
            onProfileOpenChange={setProfileOpen}
          />

          <main id="typing" className="flex flex-1 flex-col items-center pt-[clamp(0rem,4vh,3rem)]">
            <h1 className="sr-only">DEV_TYPE: typing speed test for developers</h1>
            <div className="flex w-full max-w-5xl flex-col gap-5">
              <ConfigBar settings={settings} onOpenSettings={openSettings} />
              <AnimatePresence mode="wait" initial={false}>
                {visibleResult ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <ResultsPanel result={visibleResult} onNext={goNext} onRetry={goRetry} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="arena"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <TypingArena
                      state={state}
                      run={run}
                      settings={settings}
                      elapsedMs={elapsedMs}
                      liveWpm={liveWpm}
                      dispatch={dispatch}
                      onRestart={goNext}
                      onFinish={finish}
                      onEditCustomText={() => openSettings('custom')}
                      inputRef={inputRef}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>

          <Footer />
        </div>

        {/* Below the test on small screens, a sticky sidebar on large ones */}
        <aside
          aria-label="Leaderboard"
          className="w-full shrink-0 lg:sticky lg:top-8 lg:w-80 lg:self-start xl:w-96"
        >
          <Leaderboard onEditProfile={() => setProfileOpen(true)} />
        </aside>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (!open) focusInput();
        }}
        section={settingsSection}
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onRestart={goNext}
        onNext={goNext}
        onOpenSettings={() => openSettings()}
        onOpenProfile={() => setProfileOpen(true)}
      />
    </MotionConfig>
  );
}
