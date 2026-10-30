export const LANGUAGE_IDS = [
  'javascript',
  'typescript',
  'python',
  'rust',
  'cpp',
  'go',
  'java',
  'csharp',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'sql',
  'html',
  'bash',
] as const;

export type LanguageId = (typeof LANGUAGE_IDS)[number];
export type LanguageFilter = LanguageId | 'all';

export interface CommentSyntax {
  /** Tokens that start a comment running to the end of the line */
  line: readonly string[];
  /** [open, close] pairs */
  block: readonly (readonly [string, string])[];
  /** Characters that open a string literal (comment tokens inside strings are ignored) */
  quotes: readonly string[];
}

const C_LIKE: CommentSyntax = { line: ['//'], block: [['/*', '*/']], quotes: ['"', "'", '`'] };
const HASH: CommentSyntax = { line: ['#'], block: [], quotes: ['"', "'"] };

export const LANGUAGES: Record<LanguageId, { label: string; comments: CommentSyntax }> = {
  javascript: { label: 'JavaScript', comments: C_LIKE },
  typescript: { label: 'TypeScript', comments: C_LIKE },
  python: { label: 'Python', comments: HASH },
  // `'` starts lifetimes in Rust, so only double quotes delimit strings
  rust: { label: 'Rust', comments: { ...C_LIKE, quotes: ['"'] } },
  cpp: { label: 'C++', comments: C_LIKE },
  go: { label: 'Go', comments: C_LIKE },
  java: { label: 'Java', comments: C_LIKE },
  csharp: { label: 'C#', comments: C_LIKE },
  php: { label: 'PHP', comments: { ...C_LIKE, line: ['//', '#'] } },
  ruby: { label: 'Ruby', comments: HASH },
  swift: { label: 'Swift', comments: C_LIKE },
  kotlin: { label: 'Kotlin', comments: C_LIKE },
  sql: { label: 'SQL', comments: { line: ['--'], block: [['/*', '*/']], quotes: ["'"] } },
  html: {
    label: 'HTML/CSS',
    comments: {
      line: [],
      block: [
        ['<!--', '-->'],
        ['/*', '*/'],
      ],
      quotes: ['"'],
    },
  },
  bash: { label: 'Bash', comments: HASH },
};

export const LANGUAGE_FILTER_OPTIONS: readonly { value: LanguageFilter; label: string }[] = [
  { value: 'all', label: 'All languages' },
  ...LANGUAGE_IDS.map((id) => ({ value: id, label: LANGUAGES[id].label })),
];

export function languageLabel(language: LanguageFilter | 'mixed' | 'custom'): string {
  if (language === 'all') return 'All languages';
  if (language === 'mixed') return 'Mixed';
  if (language === 'custom') return 'Custom text';
  return LANGUAGES[language].label;
}

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === 'string' && (LANGUAGE_IDS as readonly string[]).includes(value);
}
