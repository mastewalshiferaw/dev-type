import type { LanguageId } from '@/lib/languages';
import { bash } from './bash';
import { cpp } from './cpp';
import { csharp } from './csharp';
import { go } from './go';
import { html } from './html';
import { java } from './java';
import { javascript } from './javascript';
import { kotlin } from './kotlin';
import { php } from './php';
import { python } from './python';
import { ruby } from './ruby';
import { rust } from './rust';
import { sql } from './sql';
import { swift } from './swift';
import type { SnippetSet } from './types';
import { typescript } from './typescript';

export type { SnippetSet } from './types';

export const SNIPPETS: Record<LanguageId, SnippetSet> = {
  javascript,
  typescript,
  python,
  rust,
  cpp,
  go,
  java,
  csharp,
  php,
  ruby,
  swift,
  kotlin,
  sql,
  html,
  bash,
};
