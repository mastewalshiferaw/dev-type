import { SNIPPETS } from '@/data/snippets';
import { LANGUAGE_IDS, LANGUAGES, type CommentSyntax, type LanguageId } from '@/lib/languages';
import { CUSTOM_TEXT_LIMIT, type Settings } from '@/lib/settings';

export type RunLanguage = LanguageId | 'mixed' | 'custom';

export interface RunText {
  text: string;
  language: RunLanguage;
  /** Time and zen runs keep appending snippets as you type */
  streaming: boolean;
}

type TextSettings = Pick<
  Settings,
  'language' | 'mode' | 'lineCount' | 'length' | 'punctuation' | 'indentation' | 'skipComments' | 'customText'
>;

const SEPARATOR = '\n\n';
/** Streaming runs always keep at least this much untyped text ahead of the cursor */
export const STREAM_LOOKAHEAD = 300;
const REMOVED = '\u0000';

const random = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** CRLF to LF, no trailing spaces, at most one blank line in a row, no blank edges. */
export function normalizeCode(code: string): string {
  return code
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');
}

/**
 * Remove comments while leaving string literals alone. Comment characters are first replaced
 * with a marker so lines that held only a comment can be dropped entirely afterwards.
 */
export function stripComments(code: string, syntax: CommentSyntax): string {
  let out = '';
  let quote: string | null = null;
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    if (quote) {
      out += ch;
      if (ch === '\\' && i + 1 < code.length && code[i + 1] !== '\n') {
        out += code[i + 1];
        i += 2;
        continue;
      }
      // Strings never span lines here, which keeps a stray quote from swallowing the file
      if (ch === quote || ch === '\n') quote = null;
      i++;
      continue;
    }

    const block = syntax.block.find(([open]) => code.startsWith(open, i));
    if (block) {
      const close = code.indexOf(block[1], i + block[0].length);
      const end = close === -1 ? code.length : close + block[1].length;
      out += REMOVED.repeat(end - i);
      i = end;
      continue;
    }

    // `#` only starts a comment at a word boundary (keeps `$#` and `a#b` intact)
    const line = syntax.line.find(
      (token) => code.startsWith(token, i) && (token !== '#' || i === 0 || /\s/.test(code[i - 1]))
    );
    if (line) {
      const newline = code.indexOf('\n', i);
      const end = newline === -1 ? code.length : newline;
      out += REMOVED.repeat(end - i);
      i = end;
      continue;
    }

    if (syntax.quotes.includes(ch)) quote = ch;
    out += ch;
    i++;
  }

  return out
    .split('\n')
    .filter((text) => !(text.includes(REMOVED) && text.replaceAll(REMOVED, '').trim() === ''))
    .map((text) => text.replaceAll(REMOVED, ''))
    .join('\n');
}

/** Reduce each line to words and numbers, keeping its indentation. */
function stripPunctuation(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      const indent = line.match(/^\s*/)?.[0] ?? '';
      const body = line
        .slice(indent.length)
        .replace(/[^\p{L}\p{N}_\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return body ? indent + body : '';
    })
    .filter(Boolean)
    .join('\n');
}

export function transformCode(
  code: string,
  options: Pick<Settings, 'punctuation' | 'indentation' | 'skipComments'>,
  language?: LanguageId
): string {
  let result = normalizeCode(code);
  if (options.skipComments && language) result = stripComments(result, LANGUAGES[language].comments);
  if (!options.punctuation) result = stripPunctuation(result);
  if (!options.indentation) {
    result = result
      .split('\n')
      .map((line) => line.trimStart())
      .join('\n');
  }
  return normalizeCode(result);
}

/** Pick a snippet, avoiding any that `isRecent` rejects when another choice exists. */
function pickSnippet(settings: TextSettings, isRecent: (code: string) => boolean = () => false): string {
  const language = settings.language === 'all' ? random(LANGUAGE_IDS) : settings.language;
  const length =
    settings.length === 'random' ? random(['short', 'medium', 'long'] as const) : settings.length;
  // Stripping can empty a snippet (e.g. all comments); fall back to the untransformed one
  const pool = SNIPPETS[language][length].map(
    (code) => transformCode(code, settings, language) || normalizeCode(code)
  );
  const fresh = pool.filter((code) => !isRecent(code));
  return random(fresh.length > 0 ? fresh : pool);
}

/** More text for a streaming run, starting with a separator. `text` is the run so far. */
export function nextChunk(settings: TextSettings, text = ''): string {
  return SEPARATOR + pickSnippet(settings, (code) => text.endsWith(code));
}

export function customText(settings: Pick<Settings, 'customText' | 'punctuation' | 'indentation'>) {
  return transformCode(settings.customText.slice(0, CUSTOM_TEXT_LIMIT), {
    punctuation: settings.punctuation,
    indentation: settings.indentation,
    skipComments: false,
  });
}

/**
 * Build the text for a new run. Uses Math.random, so call it from event handlers or effects,
 * never during render (keeps SSR deterministic).
 */
export function buildRunText(settings: TextSettings, previous = ''): RunText {
  const language: RunLanguage = settings.language === 'all' ? 'mixed' : settings.language;

  if (settings.mode === 'custom') {
    return { text: customText(settings), language: 'custom', streaming: false };
  }

  // "Next snippet" should not start with the snippet the previous run started with
  const first = pickSnippet(settings, (code) => previous.startsWith(code));

  if (settings.mode === 'lines') {
    let text = first;
    while (text.split('\n').length < settings.lineCount) text += nextChunk(settings, text);
    const lines = text.split('\n').slice(0, settings.lineCount);
    return { text: normalizeCode(lines.join('\n')), language, streaming: false };
  }

  let text = first;
  while (text.length < STREAM_LOOKAHEAD) text += nextChunk(settings, text);
  return { text, language, streaming: true };
}
