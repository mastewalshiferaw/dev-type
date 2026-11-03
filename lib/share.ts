// Server-safe on purpose: lib/profile and lib/settings create browser stores on import,
// so the two small helpers needed from them are mirrored here.
import { isLanguageId, leaderboardLanguageLabel } from '@/lib/languages';

/** Same rule as USERNAME_PATTERN in lib/profile */
const USERNAME_PATTERN = /^[\w.@-]{2,18}$/;

/** Same labels as modeKeyLabel in lib/settings, for the ranked modes only */
const modeKeyLabel = (key: string) => {
  const [mode, value] = key.split('-');
  return mode === 'lines' ? `${value} lines` : `${value}s`;
};

/**
 * A shareable personal-best card. Everything lives in the URL query, so a link can be
 * pasted anywhere and its preview image is rendered on demand by `app/share/card`.
 * The numbers are not verified: they are clamped to the same limits as the leaderboard.
 */
export interface ShareCard {
  wpm: number;
  accuracy: number;
  /** A language id or `mixed` */
  language: string;
  /** e.g. `time-30` or `lines-25` */
  mode: string;
  username?: string;
  /** WPM gained over the previous best, when there was one */
  gain?: number;
}

export const CARD_SIZE = { width: 1200, height: 630 };

const MODE_PATTERN = /^(time|lines)-\d{1,3}$/;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function toShareParams(card: ShareCard): URLSearchParams {
  const params = new URLSearchParams({
    wpm: String(Math.round(card.wpm)),
    acc: String(Math.round(card.accuracy * 10) / 10),
    lang: card.language,
    mode: card.mode,
  });
  if (card.username) params.set('u', card.username);
  if (card.gain && card.gain > 0) params.set('gain', String(Math.round(card.gain)));
  return params;
}

type QueryInput = URLSearchParams | Record<string, string | string[] | undefined>;

const read = (query: QueryInput, key: string): string | undefined => {
  if (query instanceof URLSearchParams) return query.get(key) ?? undefined;
  const value = query[key];
  return Array.isArray(value) ? value[0] : value;
};

/** Parses and sanitises a card from a query string; returns null when it is unusable. */
export function parseShareParams(query: QueryInput): ShareCard | null {
  const wpm = Number(read(query, 'wpm'));
  const accuracy = Number(read(query, 'acc'));
  if (!Number.isFinite(wpm) || !Number.isFinite(accuracy)) return null;

  const rawLang = read(query, 'lang')?.toLowerCase();
  const rawMode = read(query, 'mode');
  const rawName = read(query, 'u')?.trim();
  const gain = Number(read(query, 'gain'));

  return {
    wpm: clamp(Math.round(wpm), 0, 400),
    accuracy: clamp(Math.round(accuracy * 10) / 10, 0, 100),
    language: isLanguageId(rawLang) ? rawLang : 'mixed',
    mode: rawMode && MODE_PATTERN.test(rawMode) ? rawMode : 'time-30',
    username: rawName && USERNAME_PATTERN.test(rawName) ? rawName : undefined,
    gain: Number.isFinite(gain) && gain > 0 ? clamp(Math.round(gain), 1, 400) : undefined,
  };
}

export const cardImagePath = (card: ShareCard) => `/share/card?${toShareParams(card)}`;
export const sharePagePath = (card: ShareCard) => `/share?${toShareParams(card)}`;

export function cardLabels(card: ShareCard) {
  return {
    language: leaderboardLanguageLabel(card.language),
    mode: modeKeyLabel(card.mode),
  };
}

/** One-line summary used for page titles and native share text. */
export function cardHeadline(card: ShareCard): string {
  const { language, mode } = cardLabels(card);
  const who = card.username ? `@${card.username}` : 'I';
  const verb = card.username ? 'hit' : 'just hit';
  return `${who} ${verb} ${card.wpm} WPM typing ${language} code (${card.accuracy}% accuracy, ${mode}) on DEV_TYPE`;
}
