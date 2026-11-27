import { SNIPPETS } from '@/data/snippets';
import type { LanguageId } from '@/lib/languages';
import { normalizeCode } from '@/lib/snippets';

const random = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/**
 * Picks a well-sized snippet suitable for a 1v1 duel race.
 * Medium or short snippets are optimal (~150 to ~350 characters, 5 to 10 lines).
 */
export function getDuelSnippet(language: LanguageId = 'typescript'): string {
  const targetLang = language in SNIPPETS ? language : 'typescript';
  const pool = [...SNIPPETS[targetLang].medium, ...SNIPPETS[targetLang].short];
  if (pool.length === 0) {
    return `function race() {\n  return "DevType 1v1 Duel";\n}`;
  }
  const picked = random(pool);
  return normalizeCode(picked);
}

/**
 * Generates an uppercase 6-character room code, e.g. "DEV-492" or "GIT-812".
 */
export function generateRoomCode(): string {
  const prefixes = ['GIT', 'DEV', 'CODE', 'PULL', 'PUSH', 'RACE', 'NODE', 'RUST'];
  const prefix = random(prefixes);
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}
