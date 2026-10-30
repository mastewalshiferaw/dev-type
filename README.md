# DEV_TYPE

A typing-speed test for developers. Type real code in 15 languages, see WPM, accuracy and consistency
over time, track personal bests, and climb a live leaderboard. Next.js (App Router), TypeScript and
Tailwind CSS v4.

## Routes

| Route      | What it is                                                            |
| ---------- | --------------------------------------------------------------------- |
| `/`        | Landing page (route group `app/(marketing)`), with a live typing demo |
| `/play`    | The typing test itself (`components/DevTypeApp.tsx`)                  |
| `/privacy` | Privacy notice (placeholder wording, see below)                       |
| `/terms`   | Terms (placeholder wording, see below)                                |

The test moved from `/` to `/play`. Old links to `/` now land on the landing page, where every CTA leads
to `/play`. The app's logo links back to `/`, and `/play#leaderboard` jumps to the live leaderboard.

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
app/            root layout (fonts, no-flash theme script), 404, icon, OG image, robots, sitemap
  (marketing)/  landing page, privacy, terms, and their layout (navbar, footer, sans font)
  play/         the typing test
components/
  DevTypeApp.tsx      orchestrates the run, results, dialogs and global shortcuts
  landing/            one folder per section (hero, languages, features, how-it-works, leaderboard,
                      results, testimonials, faq, cta, footer, nav), plus LandingShell, Section
                      (layout + headings) and LegalPage
  motion/             motion primitives: Reveal, TextReveal, TypeIn, CountUp, Odometer, Magnetic,
                      Marquee, SmoothScroll (Lenis), ScrollProgress, CustomCursor, SudoConfetti
  splash/             the first-visit boot splash
  typing/             ConfigBar, TypingArena (hidden input), CodeView (rendering + caret), Timer
  results/            ResultsPanel, WpmChart (lazy-loaded)
  leaderboard/        Leaderboard, LeaderboardRow, RankMark, Avatar
  settings/           SettingsDrawer
  command/            CommandPalette, ThemeCommands
  layout/             Header, Footer, Logo, PaletteButton, ThemeToggle, ThemeSync, ProfilePopover
  ui/                 Button, CommandDialog, GitHubIcon, SegmentedControl, Select, SpotlightCard, Switch,
                      Kbd, Skeleton
hooks/          useTypingRun, useHiddenInput, useLeaderboard, useHotkeys, usePlatform,
                useReducedMotion, useEnterOnce
lib/            engine (pure typing reducer + stats), snippets (pick + transform), settings, theme,
                motion (shared timings), splash-script,
                history, profile, avatar, fonts, site (+ pageMetadata), store (localStorage +
                useSyncExternalStore), leaderboard/ (data layer)
data/snippets/  one file per language, short / medium / long
data/landing/   landing content: features, FAQ, languages, steps, navigation, demo snippets, samples
```

## Design tokens

Semantic colors are CSS variables in `app/globals.css`, switched by `data-theme` on `<html>` and exposed
to Tailwind as `bg-canvas`, `text-muted` and so on. Every text token reaches WCAG AA (4.5:1) on `canvas`,
`surface` and `raised` in both themes.

| Token                 | Light           | Dark              | Use                                              |
| --------------------- | --------------- | ----------------- | ------------------------------------------------ |
| `canvas`              | `#f8f6f1`       | `#09090b`         | Page background (warm paper in light mode)       |
| `surface`             | `#fffefb`       | `#18181b`         | Cards, panels                                    |
| `raised`              | `#f1ede4`       | `#27272a`         | Hover, active pills                              |
| `line`, `line-strong` | ink at 8% / 15% | white at 8% / 14% | Borders (alpha, so they sit on any surface)      |
| `ink`                 | `#1c1917`       | `#f4f4f5`         | Primary text                                     |
| `ink-dim`             | `#44403c`       | `#c6c6ce`         | Lead paragraphs, secondary emphasis              |
| `muted`               | `#625b53`       | `#a1a1ab`         | Secondary text, untyped code                     |
| `accent`              | `#94400a`       | `#fbbf24`         | Brand amber for text and icons                   |
| `accent-fill`         | `#f59e0b`       | `#fbbf24`         | Brand amber for button fills (with `accent-ink`) |
| `success`             | `#046c4e`       | `#34d399`         | Correctly typed characters (app)                 |
| `danger`              | `#be123c`       | `#fb7185`         | Incorrect characters, errors                     |

Beyond color: radius `xs/sm/md/lg/xl` = 4/6/10/14/20px; elevation `shadow-panel` (resting), `shadow-lift`
(featured), `shadow-modal` (dialogs), `shadow-cta` (primary button); fluid type `text-body`, `text-lead`,
`text-h2`, `text-headline`, `text-display` (`clamp()`, -0.02em on headings). Motion uses three durations
(120/200/320ms), one ease (`--ease-out`) and one spring; JavaScript reads the same values from
`lib/motion.ts`, and `hooks/useReducedMotion.ts` is the only reduced-motion check in JS.

## Landing page

Every section reuses the app's tokens and components. The hero demo runs the real typing engine,
`CodeView` and hidden-input hook (so phone keyboards work), the results showcase uses the app's
`WpmChart`, and the leaderboard preview renders the same rows as the live board. Copy lives in
`data/landing/`.

- **Hero demo keys:** any letter (with nothing focused) starts it, **Tab** loads the next snippet (or
  indents where indentation is expected), **Enter** types a new line (after finishing: opens `/play`),
  **Escape** leaves the editor, **Shift+Tab** moves focus out. Stats stay at `0 wpm · 100% · 0s` until
  the first key, WPM appears after 2 seconds, and a run left alone for 5 seconds resets.
- **Boot splash** (`components/splash/`): first visit per browser session only. A head script
  (`lib/splash-script.ts`) sets `html[data-splash]` before the first paint, so the overlay is there from
  frame one in the right theme while the real page renders underneath (LCP and SEO are unaffected).
  Any key or click skips it; reduced motion gets a 400ms fade; a CSS failsafe removes it after 6s if
  JavaScript never arrives. To see it again, open a new tab or clear `devtype:booted` in sessionStorage.
- **Motion system:** one stack, `motion` (Framer Motion), plus Lenis for inertial wheel scrolling
  (mouse and trackpad only; touch and keyboard stay native). Shared timings live in `lib/motion.ts` and
  the matching CSS tokens; `hooks/useReducedMotion.ts` is the single reduced-motion switch. Reusable
  primitives in `components/motion/`: `Reveal`/`Stagger`/`RevealActive`, `TextReveal`, `TypeIn`,
  `CountUp`, `Odometer`, `Magnetic`, `Marquee`, `SmoothScroll`, `ScrollProgress`, `CustomCursor`.
  Every scroll entrance follows `hooks/useEnterOnce.ts`: the server renders the finished state, only
  below-the-fold content is hidden after mount, and it plays once.
- **Reduced motion:** no splash animation (fade), no Lenis, no parallax or pinning, no custom cursor or
  tilt, no confetti; reveals are skipped, the marquee is one wrapped list and every illustration shows
  its final frame.
- **Easter egg:** type `sudo` anywhere on the home page.
- **Performance:** every page is static. Recharts only loads when the results section gets close, the
  landing command palette loads on first open, and fonts are self-hosted by `next/font` (Geist sans is
  only downloaded by the landing and legal pages). The page has no raster images, so `next/image` has
  nothing to optimize; every visual is CSS or SVG.
- **SEO:** a title, description and canonical URL for each page (`pageMetadata` in `lib/site.ts`), Open
  Graph and Twitter cards using the generated `/opengraph-image`, a sitemap with all four routes, and
  `WebApplication` + `FAQPage` JSON-LD on the home page.

### Placeholder content (replace before launch)

| What                       | Where                                  |
| -------------------------- | -------------------------------------- |
| Testimonials (invented)    | `data/landing/testimonials.ts`         |
| Leaderboard preview scores | `data/landing/leaderboard.ts`          |
| Results showcase run       | `data/landing/showcase.ts`             |
| Privacy and terms wording  | `app/(marketing)/privacy`, `.../terms` |

The leaderboard and results samples are labelled "Sample" on the page. The hero's trust stats (15
languages, 15s to 120s tests, free with no signup) are real, and the language count comes from the app's
own language list.

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
- **The landing page uses the same theme store**, not next-themes, for the reason above.
- **GitHub links** point at this repository (`SITE.repo` in `lib/site.ts`). The footer credit links to
  github.com/Birabg.
- **Motion** is the `motion` package (Framer Motion's current name), imported from `motion/react`.
