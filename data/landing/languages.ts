import { LANGUAGE_IDS, LANGUAGES, type LanguageId } from '@/lib/languages';

/** The file extension shown on each language chip. */
const EXTENSIONS: Record<LanguageId, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  rust: 'rs',
  cpp: 'cpp',
  go: 'go',
  java: 'java',
  csharp: 'cs',
  php: 'php',
  ruby: 'rb',
  swift: 'swift',
  kotlin: 'kt',
  sql: 'sql',
  html: 'html',
  bash: 'sh',
};

/** Built from the app's own language list, so the landing page can never overpromise. */
export const LANDING_LANGUAGES = LANGUAGE_IDS.map((id) => ({
  id,
  label: LANGUAGES[id].label,
  extension: EXTENSIONS[id],
}));

export const LANGUAGE_COUNT = LANGUAGE_IDS.length;
