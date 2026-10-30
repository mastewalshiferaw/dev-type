# DEV_TYPE

A typing-speed test for developers. Type real code in 15 languages, see WPM, accuracy and consistency
over time, track personal bests, and climb a live leaderboard. Next.js (App Router), TypeScript and
Tailwind CSS v4.

## Setup

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script                 | What it does                         |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Dev server (Turbopack)               |
| `npm run build`        | Production build                     |
| `npm start`            | Serve the production build           |
| `npm run lint`         | ESLint (Next + React Compiler rules) |
| `npm run typecheck`    | `tsc --noEmit`                       |
| `npm run format`       | Prettier (with Tailwind class order) |
| `npm run format:check` | Prettier in check mode (for CI)      |

### Environment

All optional. Put them in `.env.local`.

| Variable                           | Purpose                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`             | Absolute URL for canonical, Open Graph and sitemap links      |
| `NEXT_PUBLIC_LEADERBOARD_PROVIDER` | `supabase` to use the real backend; anything else uses a mock |
| `NEXT_PUBLIC_SUPABASE_URL`         | Supabase project URL (only with the Supabase provider)        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | Supabase anon or publishable key                              |

### Leaderboard backend

The leaderboard talks only to the `LeaderboardProvider` interface in `lib/leaderboard/types.ts`.
By default it uses an in-browser mock: a seeded crowd of players plus your own submissions, kept in
localStorage, with a little simulated latency. To switch to Supabase, set
`NEXT_PUBLIC_LEADERBOARD_PROVIDER=supabase` and add two columns to the existing `scores` table:

```sql
alter table scores add column if not exists language text;
alter table scores add column if not exists mode text;
create index if not exists scores_created_wpm on scores (created_at desc, wpm desc);
```

Any other backend only needs a new adapter with `list` and `submit`, registered in `lib/leaderboard/index.ts`.

## Features

**Typing**

- 15 languages: JavaScript, TypeScript, Python, Rust, C++, Go, Java, C#, PHP, Ruby, Swift, Kotlin,
  SQL, HTML/CSS and Bash, or all of them mixed.
- Modes: Time (15/30/60/120 s), Lines (10/25/50), Zen (no limit, finish with Shift+Enter) and Custom
  (paste your own code).
- Snippet length: Short, Medium, Long or Random.
- Content toggles: punctuation and symbols, keep or strip indentation, auto-indent on Enter, skip comments.
  Comment stripping understands each language's syntax and leaves comment markers inside strings alone.
- Correct handling of Enter, Tab (types indentation where indentation is expected, restarts elsewhere),
  Backspace and Ctrl/Alt+Backspace.
- A hidden-textarea input that works with mobile keyboards and IMEs, plus a click-to-focus overlay.
- A fixed-height code view that scrolls with the caret, so there is no layout shift while typing.
- Caret styles (line, block, underline), code fonts (JetBrains Mono, Fira Code, Geist Mono), font size
  and a ligatures toggle.

**Results**

- WPM, raw WPM, accuracy, consistency, errors, time and correct/incorrect characters.
- A speed-over-time chart (WPM and raw on one axis, errors in a synced strip), with a data-table view.
- Personal bests per language and mode, the last 20 runs, "Try again" (same text) and "Next snippet" (Tab).

**Leaderboard and profile**

- Today / Week / All time and per-language filters, polled every 30 s and refreshed on submit.
- Rank, avatar, username, WPM and accuracy, with your row highlighted and your rank shown below the list.
- A profile popover with your username, run stats, personal bests and a clear-history action.

**UI**

- Light, Dark and System themes with no flash of the wrong theme, plus a sun/moon toggle (Ctrl/⌘+Shift+L).
- A command palette (Ctrl/⌘+K) for language, mode, theme, toggles and actions; a settings drawer for everything.
- Responsive from 360 px to ultrawide: the config bar scrolls sideways on phones and the leaderboard moves below the test.
- Motion that respects `prefers-reduced-motion`, visible focus rings, ARIA roles and live regions.
- Skeleton and empty states, a custom 404, SEO metadata, a favicon, a generated Open Graph image, robots.txt and a sitemap.

## Project structure

```
app/            layout (fonts, metadata, no-flash theme script), page, 404, icon, OG image, robots, sitemap
components/
  DevTypeApp.tsx      orchestrates the run, results, dialogs and global shortcuts
  typing/             ConfigBar, TypingArena (hidden input), CodeView (rendering + caret), Timer
  results/            ResultsPanel, WpmChart (lazy-loaded)
  leaderboard/        Leaderboard, Avatar
  settings/           SettingsDrawer
  command/            CommandPalette
  layout/             Header, Footer, ThemeToggle, ThemeSync, ProfilePopover
  ui/                 SegmentedControl, Select, Switch, Kbd, Skeleton
hooks/          useTypingRun, useLeaderboard, useHotkeys, usePlatform
lib/            engine (pure typing reducer + stats), snippets (pick + transform), settings, theme,
                history, profile, store (localStorage + useSyncExternalStore), leaderboard/ (data layer)
data/snippets/  one file per language, short / medium / long
```

## Design tokens

Semantic colors are CSS variables in `app/globals.css`, switched by `data-theme` on `<html>` and exposed
to Tailwind as `bg-canvas`, `text-muted` and so on. Every text token reaches WCAG AA (4.5:1) on `canvas`,
`surface` and `raised` in both themes.

| Token         | Light     | Dark      | Use                                              |
| ------------- | --------- | --------- | ------------------------------------------------ |
| `canvas`      | `#f7f7f5` | `#09090b` | Page background                                  |
| `surface`     | `#ffffff` | `#18181b` | Cards, panels                                    |
| `raised`      | `#efefec` | `#27272a` | Hover, active pills                              |
| `line`        | `#e4e4e7` | `#27272a` | Borders                                          |
| `ink`         | `#18181b` | `#f4f4f5` | Primary text                                     |
| `muted`       | `#5f5f6a` | `#9a9aa4` | Secondary text, untyped code                     |
| `accent`      | `#a34a06` | `#fbbf24` | Brand amber for text and icons                   |
| `accent-fill` | `#f59e0b` | `#fbbf24` | Brand amber for button fills (with `accent-ink`) |
| `success`     | `#047857` | `#34d399` | Correctly typed characters                       |
| `danger`      | `#be123c` | `#fb7185` | Incorrect characters, errors                     |

## Assumptions

- **Theme without next-themes.** next-themes renders a `<script>` from a client component, which
  React 19.2+ warns about. A ~60-line store plus an inline script in the server layout does the same job
  with no warnings.
- **Mock leaderboard by default.** The existing Supabase `scores` table has no `language`/`mode`
  columns, so the Supabase adapter is opt-in and needs the migration above.
- **One score per player.** Leaderboards keep each player's best score in the selected window.
  Zen and custom runs are not ranked (custom text can be anything), and runs under 2 s are not saved.
- **WPM** counts correctly typed characters ÷ 5 per minute. Auto-indentation is not counted as typed.
  Raw WPM counts every keystroke that produced a character. Accuracy is correct keystrokes ÷ all
  keystrokes, so fixed mistakes still count.
- **Consistency** is `100 × (1 − tanh(cv))` of per-second raw WPM, where `cv` is the coefficient of variation.
- **Paste is blocked** in the typing area. "Skip comments" does not apply to custom text, since its
  language is unknown.
- **Motion** is the `motion` package (Framer Motion's current name), imported from `motion/react`.
