'use client';

import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import Avatar from '@/components/leaderboard/Avatar';
import CountUp from '@/components/motion/CountUp';
import { SHOWCASE_SAMPLES, SHOWCASE_STATS } from '@/data/landing/showcase';
import { leaderboardLanguageLabel } from '@/lib/languages';
import { useModKey } from '@/hooks/usePlatform';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { DURATION, EASE, SPRING, TRANSITION } from '@/lib/motion';

/**
 * Small illustrations for the feature cards. Each plays once, the first time its card scrolls
 * into view, then holds its final frame. With reduced motion the final frame shows from the start.
 */
function useSequence(ref: RefObject<Element | null>, last: number, intervalMs: number) {
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => {
      setStep((current) => {
        if (current + 1 >= last) clearInterval(id);
        return Math.min(current + 1, last);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [inView, reduce, last, intervalMs]);
  return reduce ? last : step;
}

/* Real code: a snippet being typed, with one mistake on the way */

const SNIPPET =
  'fn parse(src: &str) -> Result<Ast> {\n    let tokens = lex(src)?;\n    Ok(Ast::from(tokens))\n}';
const TYPO = SNIPPET.indexOf('?');

export function SnippetsVisual() {
  const ref = useRef<HTMLPreElement>(null);
  const shown = useSequence(ref, SNIPPET.length, 45);

  return (
    <pre ref={ref} className="h-full overflow-hidden p-6 text-xs leading-relaxed whitespace-pre sm:text-sm">
      <span className="text-ink">{SNIPPET.slice(0, Math.min(shown, TYPO))}</span>
      {shown > TYPO && (
        <>
          <span className="rounded-xs bg-danger/15 text-danger underline decoration-2 underline-offset-4">
            ;
          </span>
          <span className="text-ink">{SNIPPET.slice(TYPO + 1, shown)}</span>
        </>
      )}
      <span className="inline-block h-[1.2em] w-0.5 translate-y-[0.2em] animate-blink-settle bg-caret" />
      <span className="text-muted">{SNIPPET.slice(shown)}</span>
    </pre>
  );
}

/* Modes: the switcher steps through its four options and comes back to Time */

const MODES = [
  { label: 'Time', detail: '30 seconds' },
  { label: 'Lines', detail: '25 lines' },
  { label: 'Zen', detail: 'no limit' },
  { label: 'Custom', detail: 'paste.ts' },
];

export function ModesVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const active = useSequence(ref, MODES.length, 900) % MODES.length;

  return (
    <div ref={ref} className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <div className="flex rounded-md border border-line bg-surface p-1 shadow-panel">
        {MODES.map((mode, i) => (
          <span key={mode.label} className="relative px-3 py-2 text-xs">
            {i === active && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-sm bg-raised"
                transition={SPRING}
              />
            )}
            <span className={`relative ${i === active ? 'font-semibold text-accent' : 'text-muted'}`}>
              {mode.label}
            </span>
          </span>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={TRANSITION.base}
          className="text-2xl font-bold text-ink"
        >
          {MODES[active].detail}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/* Stats: headline numbers counting up over a WPM line that draws itself */

const CHART_W = 240;
const CHART_H = 56;

function linePath(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * CHART_W;
      const y = CHART_H - 4 - ((value - min) / (max - min || 1)) * (CHART_H - 8);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

const WPM_LINE = linePath(SHOWCASE_SAMPLES.map((sample) => sample.wpm));

export function StatsVisual() {
  const reduce = useReducedMotion();
  const stats = [
    { label: 'wpm', value: SHOWCASE_STATS.wpm, unit: '', accent: true },
    { label: 'acc', value: SHOWCASE_STATS.accuracy, unit: '%' },
    { label: 'cons', value: SHOWCASE_STATS.consistency, unit: '%' },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6">
      <dl className="flex items-baseline justify-between gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col">
            <dt className="label text-muted">{stat.label}</dt>
            <dd className={`font-bold ${stat.accent ? 'text-3xl text-accent' : 'text-lg text-ink-dim'}`}>
              <CountUp value={stat.value} decimals={Number.isInteger(stat.value) ? 0 : 1} />
              {stat.unit}
            </dd>
          </div>
        ))}
      </dl>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="h-auto w-full overflow-visible">
        <line x1="0" x2={CHART_W} y1={CHART_H} y2={CHART_H} stroke="var(--color-line)" />
        <motion.path
          d={WPM_LINE}
          fill="none"
          stroke="var(--color-chart-wpm)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 1.2, ease: EASE }}
        />
      </svg>
    </div>
  );
}

/* Leaderboard: three players trading places, settling on the final standings */

const ROUNDS = [
  [
    { name: 'vim_queen', wpm: 117, language: 'python' },
    { name: 'async_ada', wpm: 112, language: 'html' },
    { name: 'go_gopher', wpm: 104, language: 'all' },
  ],
  [
    { name: 'async_ada', wpm: 121, language: 'html' },
    { name: 'vim_queen', wpm: 117, language: 'python' },
    { name: 'go_gopher', wpm: 104, language: 'all' },
  ],
  [
    { name: 'async_ada', wpm: 121, language: 'html' },
    { name: 'go_gopher', wpm: 119, language: 'all' },
    { name: 'vim_queen', wpm: 117, language: 'python' },
  ],
];

export function LeaderboardVisual() {
  const ref = useRef<HTMLOListElement>(null);
  const round = useSequence(ref, ROUNDS.length - 1, 1200);

  return (
    <div className="flex h-full flex-col justify-center gap-2 p-6">
      <p className="flex items-center gap-2 text-2xs text-muted">
        <span className="size-2 rounded-full bg-success" />
        Live sprint (24h)
      </p>
      <ol ref={ref} className="flex flex-col gap-1">
        {ROUNDS[round].map((player, i) => (
          <motion.li
            key={player.name}
            layout
            transition={SPRING}
            className={`relative flex items-center gap-3 rounded-sm px-2 py-1 transition-colors hover:z-20 ${i === 0 ? 'bg-raised' : ''}`}
          >
            <span className="w-3 text-xs font-semibold text-muted tabular-nums">{i + 1}</span>
            <Avatar name={player.name} size="sm" />
            <div className="relative group/name min-w-0 flex-1">
              <span
                tabIndex={0}
                className="truncate block text-xs text-ink cursor-pointer transition-colors group-hover/name:text-accent group-focus-visible/name:text-accent focus:outline-none"
                title={`${player.name} · Language: ${leaderboardLanguageLabel(player.language)}`}
              >
                {player.name}
              </span>
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-0 mb-1.5 hidden group-hover/name:flex group-focus-within/name:flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line-strong bg-surface px-2.5 py-1 text-2xs font-medium text-ink shadow-panel z-30 animate-pop"
              >
                <span className="text-muted">Language:</span>
                <span className="font-semibold text-accent">
                  {leaderboardLanguageLabel(player.language)}
                </span>
                <span className="absolute -bottom-1 left-4 size-2 -translate-x-1/2 rotate-45 border-b border-r border-line-strong bg-surface" />
              </div>
            </div>
            <span className="text-xs font-bold text-ink tabular-nums">{player.wpm}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

/* Keyboard: each row of keycaps pressed once, a beat after the previous one */

export function KeyboardVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduce = useReducedMotion();
  const mod = useModKey();
  const shortcuts = [
    { keys: ['Tab'], action: 'restart' },
    { keys: [mod, 'K'], action: 'commands' },
    { keys: [mod, '⇧', 'L'], action: 'theme' },
  ];
  return (
    <div ref={ref} className="flex h-full flex-col justify-center gap-3 p-6">
      {shortcuts.map((shortcut, row) => (
        <div key={shortcut.action} className="flex items-center gap-3">
          <span className="flex gap-1">
            {shortcut.keys.map((key, i) => (
              <kbd
                key={key}
                style={{ animationDelay: `${row * 0.6 + i * DURATION.base}s` }}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-line-strong bg-surface px-2 text-xs text-ink-dim shadow-[0_3px_0_var(--color-line-strong)] ${
                  inView && !reduce ? 'animate-keypress' : ''
                }`}
              >
                {key}
              </kbd>
            ))}
          </span>
          <span className="text-xs text-muted">{shortcut.action}</span>
        </div>
      ))}
    </div>
  );
}

/* Themes: the same line in light and dark, the caret trying each style and settling on line */

const CARETS = ['line', 'block', 'underline'] as const;

function Caret({ style }: { style: (typeof CARETS)[number] }) {
  return (
    <span className="relative inline-block h-[1.2em] w-[0.6em] translate-y-[0.25em]">
      <span
        className={`absolute left-0 rounded-xs ${
          style === 'line'
            ? 'top-0 h-full w-0.5 bg-caret'
            : style === 'block'
              ? 'top-0 h-full w-full bg-caret/35'
              : 'bottom-0 h-0.5 w-full bg-caret'
        }`}
      />
    </span>
  );
}

export function ThemesVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const caret = useSequence(ref, CARETS.length, 900) % CARETS.length;

  return (
    <div ref={ref} className="flex h-full flex-col justify-center gap-3 p-6">
      {/* Two equal previews, each carrying its own theme so both palettes show at once */}
      <div className="grid grid-cols-2 gap-3">
        {(['light', 'dark'] as const).map((theme) => (
          <div
            key={theme}
            data-theme={theme}
            className="flex flex-col gap-3 rounded-md border border-line bg-canvas p-3 text-ink shadow-panel"
          >
            <span className="flex items-center justify-between text-muted">
              <span className="label">{theme}</span>
              {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
            </span>
            <code className="text-xs whitespace-nowrap">
              <span className="text-ink">let theme</span>
              <Caret style={CARETS[caret]} />
              <span className="text-muted">= auto;</span>
            </code>
          </div>
        ))}
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted">
        <span>
          caret: <span className="text-ink-dim">{CARETS[caret]}</span>
        </span>
        <span>JetBrains Mono · Fira Code · Geist Mono</span>
      </p>
    </div>
  );
}
