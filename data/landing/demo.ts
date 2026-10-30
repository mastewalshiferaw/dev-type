/**
 * Short snippets for the hero's live demo, at most four lines each (the demo has a fixed height).
 * The first one is what the page renders on the server.
 */
export const DEMO_SNIPPETS = [
  {
    file: 'wpm.ts',
    language: 'TypeScript',
    code: 'const wpm = (chars: number, ms: number) =>\n  Math.round(chars / 5 / (ms / 60_000));',
  },
  {
    file: 'retry.py',
    language: 'Python',
    code: 'def retry(fn, times=3):\n    for _ in range(times):\n        if (result := fn()) is not None:\n            return result',
  },
  {
    file: 'main.rs',
    language: 'Rust',
    code: 'fn main() {\n    let sum: u32 = (1..=10).map(|n| n * n).sum();\n    println!("{sum}");\n}',
  },
  {
    file: 'useDebounce.ts',
    language: 'TypeScript',
    code: 'useEffect(() => {\n  const id = setTimeout(() => setValue(input), 300);\n  return () => clearTimeout(id);\n}, [input]);',
  },
] as const;

export const DEMO_ROWS = 4;
